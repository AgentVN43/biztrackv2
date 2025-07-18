const SupplierReturn = require("./supplier_return.model");
const db = require("../../config/db.config");
const { calculateRefund } = require("../../utils/refundUtils");
const { v4: uuidv4 } = require("uuid");
const { generateTransactionCode } = require("../../utils/transactionUtils");

const SupplierReturnService = {
  // Tạo đơn trả hàng nhà cung cấp với chi tiết
  createReturnWithDetails: async (returnData, details) => {
    // Tạo đơn trả hàng (không có warehouse_id)
    const createdReturn = await SupplierReturn.create(returnData);
    const return_id = createdReturn.return_id;
    // Tạo chi tiết trả hàng, mỗi item phải có warehouse_id
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
  },

  // Lấy danh sách đơn trả hàng
  getReturnsWithPagination: async (filters, page = 1, limit = 10) => {
    const offset = (page - 1) * limit;
    const returns = await SupplierReturn.getAll(filters, { limit, offset });
    // Đếm tổng số
    const total = returns.length;
    return {
      returns,
      pagination: { page, limit, total },
    };
  },

  // Lấy chi tiết đơn trả hàng
  getReturnWithDetails: async (return_id) => {
    const main = await SupplierReturn.getById(return_id);
    const details = await SupplierReturn.getReturnDetails(return_id);
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
        const refund_amount = item.refund_amount;

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
      const transaction_id = uuidv4();
      const transaction_code = generateTransactionCode("SUPREF");
      await db
        .promise()
        .query(
          `INSERT INTO transactions (transaction_id, transaction_code, type, amount, supplier_id, related_type, related_id, created_at) VALUES (?, ?, 'payment', ?, ?, 'refund', ?, NOW())`,
          [
            transaction_id,
            transaction_code,
            total_refund,
            supplier_id,
            return_id,
          ]
        );

      // 6. Cập nhật trạng thái đơn trả hàng
      await db
        .promise()
        .query(
          `UPDATE return_orders SET status = 'approved' WHERE return_id = ?`,
          [return_id]
        );

      return { ...main, status: "approved", total_refund: Number(total_refund), invoice_id };
    } catch (error) {
      console.error("Lỗi trong approveReturn:", error);
      throw error;
    }
  },
};

module.exports = SupplierReturnService;
