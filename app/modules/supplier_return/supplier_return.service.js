const SupplierReturn = require("./supplier_return.model");
const db = require("../../config/db.config");
const { calculateRefund } = require("../../utils/refundUtils");
const { v4: uuidv4 } = require("uuid");
const { generateTransactionCode } = require("../../utils/transactionUtils");

const SupplierReturnService = {
  // Tạo đơn trả hàng nhà cung cấp với chi tiết
  createReturnWithDetails: async (returnData, details) => {
    try {
      // 1. KIỂM TRA TỒN KHO TRƯỚC KHI TẠO ĐƠN TRẢ
      for (const item of details) {
        // Validate dữ liệu đầu vào
        if (!item.product_id || !item.warehouse_id || !item.quantity) {
          throw new Error(`Dữ liệu chi tiết trả hàng không hợp lệ: ${JSON.stringify(item)}`);
        }

        // Kiểm tra sản phẩm có active không
        const [product] = await db.promise().query(
          `SELECT * FROM products WHERE product_id = ? AND is_active = 1`,
          [item.product_id]
        );
        if (!product || product.length === 0) {
          throw new Error(`Sản phẩm ${item.product_id} không hợp lệ hoặc không active`);
        }

        // Kiểm tra sản phẩm có thuộc về nhà cung cấp này không
        const [poDetail] = await db.promise().query(
          `SELECT pod.* FROM purchase_order_details pod
           JOIN purchase_orders po ON pod.po_id = po.po_id
           WHERE pod.product_id = ? AND po.supplier_id = ?
           ORDER BY po.created_at DESC LIMIT 1`,
          [item.product_id, returnData.supplier_id]
        );
        if (!poDetail || poDetail.length === 0) {
          throw new Error(`Sản phẩm ${item.product_id} không thuộc về nhà cung cấp này`);
        }

        // Kiểm tra tồn kho
        const [inventory] = await db.promise().query(
          `SELECT quantity, reserved_stock FROM inventories WHERE product_id = ? AND warehouse_id = ?`,
          [item.product_id, item.warehouse_id]
        );
        
        if (!inventory || inventory.length === 0) {
          throw new Error(`Không tìm thấy tồn kho cho sản phẩm ${item.product_id} tại kho ${item.warehouse_id}`);
        }

        const availableStock = inventory[0].quantity - inventory[0].reserved_stock;
        if (availableStock < item.quantity) {
          throw new Error(`Số lượng trả (${item.quantity}) vượt quá tồn kho khả dụng (${availableStock}) cho sản phẩm ${item.product_id} tại kho ${item.warehouse_id}`);
        }
      }

      // 2. TẠO ĐƠN TRẢ HÀNG (chỉ khi đã kiểm tra tồn kho thành công)
    const createdReturn = await SupplierReturn.create(returnData);
    const return_id = createdReturn.return_id;

      // 3. TẠO CHI TIẾT TRẢ HÀNG
    const detailResults = await Promise.all(
      details.map(async (item) => {
        return SupplierReturn.createReturnDetail({
          return_id,
          product_id: item.product_id,
          quantity: item.quantity,
          refund_amount: item.price * item.quantity, // sẽ xác thực lại khi duyệt
          warehouse_id: item.warehouse_id,
        });
      })
    );

    return { ...createdReturn, details: detailResults };
    } catch (error) {
      console.error('🚀 ~ SupplierReturnService.createReturnWithDetails - Error:', error);
      throw error;
    }
  },

  // Lấy danh sách đơn trả hàng
  getReturnsWithPagination: async (filters, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const [returns, total] = await Promise.all([
      SupplierReturn.getAll(filters, { limit, offset }),
      SupplierReturn.countAll(filters),
    ]);
    return {
      returns,
      total,
      page,
      limit,
    };
  },

  // Lấy chi tiết đơn trả hàng
  getReturnWithDetails: async (return_id) => {
    const main = await SupplierReturn.getById(return_id);
    const details = await SupplierReturn.getReturnDetails(return_id);

    // Đảm bảo refund_amount là number
    details.forEach((d) => {
      if (typeof d.refund_amount === "string") {
        d.refund_amount = parseFloat(d.refund_amount);
      }
      d.item_return_price = (d.refund_amount || 0) / (d.quantity || 0);
    });

    return { ...main, details };
  },

  // Duyệt đơn trả hàng
  approveReturn: async (return_id) => {
    try {
      // 1. Lấy thông tin đơn và chi tiết
      const main = await SupplierReturn.getById(return_id);
      if (!main) throw new Error("Không tìm thấy đơn trả hàng");
      if (main.status !== "pending")
        throw new Error("Chỉ duyệt đơn ở trạng thái pending");

      const details = await SupplierReturn.getReturnDetails(return_id);

      if (!details || details.length === 0)
        throw new Error("Không có chi tiết trả hàng");

      // 2. Kiểm tra điều kiện từng sản phẩm
      for (const item of details) {
        // Validate dữ liệu đầu vào
        if (
          !item.product_id ||
          !item.warehouse_id ||
          !item.quantity ||
          !item.return_item_id
        ) {
          throw new Error(
            `Dữ liệu chi tiết trả hàng không hợp lệ: ${JSON.stringify(item)}`
          );
        }

        // Kiểm tra sản phẩm có active và tồn kho đủ
        const [product] = await db
          .promise()
          .query(
            `SELECT * FROM products WHERE product_id = ? AND is_active = 1`,
            [item.product_id]
          );
        if (!product)
          throw new Error(
            `Sản phẩm ${item.product_id} không hợp lệ hoặc không active`
          );

        // Kiểm tra sản phẩm có thuộc về nhà cung cấp này không (thông qua purchase_order_details)
        const [poDetail] = await db.promise().query(
          `
          SELECT pod.* FROM purchase_order_details pod
          JOIN purchase_orders po ON pod.po_id = po.po_id
          WHERE pod.product_id = ? AND po.supplier_id = ?
          ORDER BY po.created_at DESC LIMIT 1
        `,
          [item.product_id, main.supplier_id]
        );
        if (!poDetail)
          throw new Error(
            `Sản phẩm ${item.product_id} không thuộc về nhà cung cấp này`
          );

        const [inventory] = await db
          .promise()
          .query(
            `SELECT * FROM inventories WHERE product_id = ? AND warehouse_id = ?`,
            [item.product_id, item.warehouse_id]
          );
        if (!inventory)
          throw new Error(
            `Không tìm thấy tồn kho cho sản phẩm ${item.product_id} tại kho ${item.warehouse_id}`
          );
        if (inventory.quantity - inventory.reserved_stock < item.quantity)
          throw new Error(
            `Số lượng trả vượt quá tồn kho khả dụng cho sản phẩm ${item.product_id}`
          );
      }

      // 3. Cập nhật kho, ghi product_event
      for (const item of details) {
        const quantity = parseInt(item.quantity) || 0;
        const product_id = item.product_id;
        const warehouse_id = item.warehouse_id;

        if (quantity <= 0) {
          throw new Error(
            `Số lượng trả hàng phải lớn hơn 0 cho sản phẩm ${product_id}`
          );
        }

        // Lấy tồn kho hiện tại trước khi cập nhật
        const [inventoryRows] = await db
          .promise()
          .query(
            `SELECT quantity FROM inventories WHERE product_id = ? AND warehouse_id = ?`,
            [product_id, warehouse_id]
          );
        const current_quantity_before =
          inventoryRows && inventoryRows[0]
            ? parseInt(inventoryRows[0].quantity)
            : 0;

        // Tính tồn kho sau khi cập nhật
        const quantity_impact = -quantity; // Giảm tồn kho
        const current_stock_after = current_quantity_before + quantity_impact;

        // // Lấy giá nhập gốc (price) từ PO gần nhất của supplier này
        const [poDetail] = await db.promise().query(
          `
          SELECT pod.price FROM purchase_order_details pod
          JOIN purchase_orders po ON pod.po_id = po.po_id
          WHERE pod.product_id = ? AND po.supplier_id = ?
          ORDER BY po.created_at DESC LIMIT 1
        `,
          [product_id, main.supplier_id]
        );
        const transaction_price = item.refund_amount;

        // Cập nhật tồn kho
        await db
          .promise()
          .query(
            `UPDATE inventories SET quantity = quantity - ?, available_stock = available_stock - ? WHERE product_id = ? AND warehouse_id = ?`,
            [quantity, quantity, product_id, warehouse_id]
          );

        const event_id = uuidv4();
        const reference_id = return_id;
        const reference_type = "SUPPLIER_RETURN";
        const description = `Trả hàng cho nhà cung cấp - Sản phẩm ${product_id}, Số lượng: ${quantity}`;

        // Ghi product_event với current_stock_after và transaction_price
        await db
          .promise()
          .query(
            `INSERT INTO product_events (event_id, product_id, warehouse_id, event_type, quantity_impact, transaction_price, current_stock_after, reference_id, reference_type, description) VALUES (?, ?, ?, 'supplier_return', ?, ?, ?, ?, ?, ?)`,
            [
              event_id,
              product_id,
              warehouse_id,
              quantity_impact,
              transaction_price,
              current_stock_after,
              reference_id,
              reference_type,
              description,
            ]
          );
      }

      // 4. Tính lại refund_amount theo giá nhập gốc
      let total_refund = 0;
      for (const item of details) {
        //   // Sử dụng cùng logic như phần validation để lấy giá từ PO của supplier này
        const [poDetail] = await db.promise().query(
          `
          SELECT pod.price FROM purchase_order_details pod
          JOIN purchase_orders po ON pod.po_id = po.po_id
          WHERE pod.product_id = ? AND po.supplier_id = ?
          ORDER BY po.created_at DESC LIMIT 1
        `,
          [item.product_id, main.supplier_id]
        );

        const price =
          poDetail && poDetail.price ? parseFloat(poDetail.price) : 0;
        const quantity = parseInt(item.quantity) || 0;
        const refund_amount = parseFloat(item.refund_amount) || 0;

        console.log(
          `Tính refund cho sản phẩm ${item.product_id}: price=${price}, quantity=${quantity}, refund_amount=${refund_amount}`
        );

        await db
          .promise()
          .query(
            `UPDATE return_order_items SET refund_amount = ? WHERE return_item_id = ?`,
            [refund_amount, item.return_item_id]
          );
        total_refund += refund_amount;
      }

      // Đảm bảo total_refund là số và có độ chính xác phù hợp
      total_refund = parseFloat(total_refund.toFixed(2));

      // 5. Tạo phiếu thu (invoice_type = 'refund_invoice')
      const invoice_id = uuidv4();
      const invoice_code = `REF-${Date.now()}`;
      const supplier_id = main.supplier_id;

      if (!supplier_id) {
        throw new Error("Không tìm thấy supplier_id trong đơn trả hàng");
      }

      await db
        .promise()
        .query(
          `INSERT INTO invoices (invoice_id, invoice_code, supplier_id, total_amount, final_amount, invoice_type, issued_date, status) VALUES (?, ?, ?, ?, ?, 'refund_invoice', NOW(), 'pending')`,
          [invoice_id, invoice_code, supplier_id, total_refund, total_refund]
        );

      // 5.5. Ghi nhận transaction hoàn tiền cho nhà cung cấp
      // const transaction_id = uuidv4();
      // const transaction_code = generateTransactionCode("SUPREF");
      // await db
      //   .promise()
      //   .query(
      //     `INSERT INTO transactions (transaction_id, transaction_code, type, amount, supplier_id, related_type, related_id, created_at) VALUES (?, ?, 'receipt', ?, ?, 'refund', ?, NOW())`,
      //     [
      //       transaction_id,
      //       transaction_code,
      //       total_refund,
      //       supplier_id,
      //       return_id,
      //     ]
      //   );

      // 6. Cập nhật trạng thái đơn trả hàng
      await db
        .promise()
        .query(
          `UPDATE return_orders SET status = 'approved' WHERE return_id = ?`,
          [return_id]
        );

      return {
        ...main,
        status: "approved",
        total_refund: Number(total_refund),
        invoice_id,
      };
    } catch (error) {
      console.error("Lỗi trong approveReturn:", error);
      throw error;
    }
  },

  // Cập nhật đơn trả hàng nhà cung cấp
  updateReturnWithDetails: async (return_id, supplier_id, note, details) => {
    try {
      // 1. Kiểm tra đơn trả hàng tồn tại và có thể cập nhật
      const existingReturn = await SupplierReturn.getById(return_id);
      if (!existingReturn) {
        throw new Error("Không tìm thấy đơn trả hàng");
      }
      if (existingReturn.status !== "pending") {
        throw new Error("Chỉ có thể cập nhật đơn ở trạng thái pending");
      }

      // 2. KIỂM TRA TỒN KHO TRƯỚC KHI CẬP NHẬT
      for (const item of details) {
        // Validate dữ liệu đầu vào
        if (!item.product_id || !item.warehouse_id || !item.quantity) {
          throw new Error(`Dữ liệu chi tiết trả hàng không hợp lệ: ${JSON.stringify(item)}`);
        }

        // Kiểm tra sản phẩm có active không
        const [product] = await db.promise().query(
          `SELECT * FROM products WHERE product_id = ? AND is_active = 1`,
          [item.product_id]
        );
        if (!product || product.length === 0) {
          throw new Error(`Sản phẩm ${item.product_id} không hợp lệ hoặc không active`);
        }

        // Kiểm tra sản phẩm có thuộc về nhà cung cấp này không
        const [poDetail] = await db.promise().query(
          `SELECT pod.* FROM purchase_order_details pod
           JOIN purchase_orders po ON pod.po_id = po.po_id
           WHERE pod.product_id = ? AND po.supplier_id = ?
           ORDER BY po.created_at DESC LIMIT 1`,
          [item.product_id, supplier_id]
        );
        if (!poDetail || poDetail.length === 0) {
          throw new Error(`Sản phẩm ${item.product_id} không thuộc về nhà cung cấp này`);
        }

        // Kiểm tra tồn kho
        const [inventory] = await db.promise().query(
          `SELECT quantity, reserved_stock FROM inventories WHERE product_id = ? AND warehouse_id = ?`,
          [item.product_id, item.warehouse_id]
        );
        
        if (!inventory || inventory.length === 0) {
          throw new Error(`Không tìm thấy tồn kho cho sản phẩm ${item.product_id} tại kho ${item.warehouse_id}`);
        }

        const availableStock = inventory[0].quantity - inventory[0].reserved_stock;
        if (availableStock < item.quantity) {
          throw new Error(`Số lượng trả (${item.quantity}) vượt quá tồn kho khả dụng (${availableStock}) cho sản phẩm ${item.product_id} tại kho ${item.warehouse_id}`);
        }
      }

      // 3. Cập nhật thông tin chính
      await db
        .promise()
        .query(
          `UPDATE return_orders SET supplier_id = ?, note = ?, updated_at = NOW() WHERE return_id = ?`,
          [supplier_id, note, return_id]
        );

      // 4. Xóa chi tiết cũ
      await db
        .promise()
        .query(`DELETE FROM return_order_items WHERE return_id = ?`, [
          return_id,
        ]);

      // 5. Tạo chi tiết mới
      const detailResults = await Promise.all(
        details.map(async (item) => {
          return SupplierReturn.createReturnDetail({
            return_id,
            product_id: item.product_id,
            quantity: item.quantity,
            refund_amount: item.price * item.quantity,
            warehouse_id: item.warehouse_id,
          });
        })
      );

      return { return_id, supplier_id, note, details: detailResults };
    } catch (error) {
      console.error("Lỗi trong updateReturnWithDetails:", error);
      throw error;
    }
  },

  // Xóa đơn trả hàng nhà cung cấp
  deleteReturn: async (return_id) => {
    try {
      // Kiểm tra đơn trả hàng tồn tại và có thể xóa
      const existingReturn = await SupplierReturn.getById(return_id);
      if (!existingReturn) {
        throw new Error("Không tìm thấy đơn trả hàng");
      }
      if (existingReturn.status !== "pending") {
        throw new Error("Chỉ có thể xóa đơn ở trạng thái pending");
      }

      // Xóa chi tiết trước
      await db
        .promise()
        .query(`DELETE FROM return_order_items WHERE return_id = ?`, [
          return_id,
        ]);

      // Xóa đơn trả hàng
      await db
        .promise()
        .query(`DELETE FROM return_orders WHERE return_id = ?`, [return_id]);

      return { return_id, message: "Xóa đơn trả hàng thành công" };
    } catch (error) {
      console.error("Lỗi trong deleteReturn:", error);
      throw error;
    }
  },

  // Lấy danh sách đơn trả hàng theo nhà cung cấp
  getReturnBySupplierId: async (supplier_id, page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;
      const filters = { supplier_id };
      const returns = await SupplierReturn.getAll(filters, { limit, offset });

      // Đếm tổng số
      const [countResult] = await db
        .promise()
        .query(
          `SELECT COUNT(*) as total FROM return_orders WHERE type = 'supplier_return' AND supplier_id = ?`,
          [supplier_id]
        );
      const total = countResult[0].total;

      return {
        returns,
        pagination: { page, limit, total },
      };
    } catch (error) {
      console.error("Lỗi trong getReturnBySupplierId:", error);
      throw error;
    }
  },

  // Lấy danh sách đơn trả hàng theo trạng thái
  getReturnByStatus: async (status, page = 1, limit = 10) => {
    try {
      const offset = (page - 1) * limit;
      const filters = { status };
      const returns = await SupplierReturn.getAll(filters, { limit, offset });

      // Đếm tổng số
      const [countResult] = await db
        .promise()
        .query(
          `SELECT COUNT(*) as total FROM return_orders WHERE type = 'supplier_return' AND status = ?`,
          [status]
        );
      const total = countResult[0].total;

      return {
        returns,
        pagination: { page, limit, total },
      };
    } catch (error) {
      console.error("Lỗi trong getReturnByStatus:", error);
      throw error;
    }
  },

  // Lấy danh sách đơn trả hàng phải trả cho nhà cung cấp (payable)
  getPayableReturns: async ({ supplier_id, status = "approved" }) => {
    const filters = { status };
    if (supplier_id) filters.supplier_id = supplier_id;
    const returns = await SupplierReturn.getAll(filters, {});
    // Lấy tổng số tiền phải trả cho từng đơn (từ chi tiết)
    const payableList = await Promise.all(
      returns.map(async (r) => {
        const details = await SupplierReturn.getReturnDetails(r.return_id);
        const total_refund = details.reduce(
          (sum, d) => sum + Number(d.refund_amount || 0),
          0
        );
        return {
          ...r,
          total_refund,
          details,
        };
      })
    );
    return payableList;
  },
};

module.exports = SupplierReturnService;
