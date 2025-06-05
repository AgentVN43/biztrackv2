// const service = require("./inventory.service");
// const { handleResult } = require("../../utils/responseHelper");

// exports.create = (req, res, next) => {
//   service.createInventory(req.body, (err, result) => {
//     if (err) return next(err);
//     res.status(201).json({ success: true, data: result });
//   });
// };

// exports.update = (req, res, next) => {
//   service.updateInventory(req.params.id, req.body, (err, result) => {
//     if (err) return next(err);
//     res.json({ success: true, message: "Inventory updated", data: result });
//   });
// };

// exports.getAll = (req, res, next) => {
//   service.getAllInventories(handleResult(res, next));
// };

// exports.getById = (req, res, next) => {
//   service.getInventoryById(
//     req.params.id,
//     handleResult(res, next, "Inventory not found")
//   );
// };

// // exports.getByWareHouseId = (req, res, next) => {
// //   service.getByWareHouseId(
// //     req.params.id,
// //     handleResult(res, next, "Inventory not found")
// //   );
// // };

// exports.getByWareHouseId = (req, res, next) => {
//   const warehouseId = req.params.id;

//   service.getByWareHouseId(warehouseId, (err, results) => {
//     if (err) {
//       return next(err);
//     }

//     // Nếu không có dữ liệu, trả về mảng rỗng thay vì lỗi
//     if (!results || results.length === 0) {
//       return res.status(200).json({ success: true, data: [] });
//     }

//     return res.status(200).json(results);
//   });
// };

// exports.checkAll = (req, res, next) => {
//   service.getAllInventoriesByWarehouse(
//     req.params.id,
//     handleResult(res, next, "Inventory not found")
//   );
// };

// exports.remove = (req, res, next) => {
//   service.deleteInventory(req.params.id, (err) => {
//     if (err) return next(err);
//     res.json({ success: true, message: "Deleted successfully" });
//   });
// };

// // ===============================
// // Business Logic APIs
// // ===============================

// // 1️⃣ Duyệt PO -> tăng tồn kho
// exports.increaseStock = (req, res, next) => {
//   const { orderDetails, warehouse_id } = req.body;
//   service.increaseStockFromPurchaseOrder(orderDetails, warehouse_id, (err) => {
//     if (err) return next(err);
//     res.json({ success: true, message: "Đã cập nhật tồn kho từ đơn mua" });
//   });
// };

// // 2️⃣ Tạm giữ hàng khi tạo đơn
// exports.reserveStock = (req, res, next) => {
//   const { orderDetails, warehouse_id } = req.body;
//   service.reserveStockFromOrderDetails(orderDetails, warehouse_id, (err) => {
//     if (err) return next(err);
//     res.json({ success: true, message: "Đã tạm giữ hàng trong tồn kho" });
//   });
// };

// // 3️⃣ Xác nhận thanh toán -> trừ thật sự tồn kho
// exports.confirmStock = async (req, res, next) => {
//   const { orderDetails, warehouse_id } = req.body;
//   try {
//     await service.confirmStockReservation(orderDetails, warehouse_id);
//     res.json({ success: true, message: "Đã xác nhận tồn kho" });
//   } catch (err) {
//     next(err);
//   }
// };

// // 4️⃣ Hủy đơn -> giải phóng hàng đã giữ
// exports.releaseStock = (req, res, next) => {
//   const { orderDetails, warehouse_id } = req.body;
//   service.releaseReservedStock(orderDetails, warehouse_id, (err) => {
//     if (err) return next(err);
//     res.json({ success: true, message: "Đã giải phóng hàng tồn kho" });
//   });
// };

const service = require("./inventory.service"); // Đảm bảo đường dẫn đúng
// const { handleResult } = require("../../utils/responseHelper"); // ✅ Không cần thiết nữa vì chúng ta xử lý response trực tiếp

exports.create = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  try {
    const newInventory = await service.createInventory(req.body); // ✅ Sử dụng await
    res
      .status(201)
      .json({
        success: true,
        data: newInventory,
        message: "Inventory created successfully",
      });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: create - Lỗi:", err);
    next(err);
  }
};

exports.update = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  try {
    const updatedInventory = await service.updateInventory(
      req.params.id,
      req.body
    ); // ✅ Sử dụng await
    if (!updatedInventory) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Inventory not found or no changes made",
        });
    }
    res.json({
      success: true,
      message: "Inventory updated",
      data: updatedInventory,
    });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: update - Lỗi:", err);
    next(err);
  }
};

exports.getAll = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  try {
    const inventories = await service.getAllInventories(); // ✅ Sử dụng await
    res.json({ success: true, data: inventories });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: getAll - Lỗi:", err);
    next(err);
  }
};

exports.getById = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  try {
    const inventory = await service.getInventoryById(req.params.id); // ✅ Sử dụng await
    if (!inventory) {
      return res
        .status(404)
        .json({ success: false, message: "Inventory not found" });
    }
    res.json({ success: true, data: inventory });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: getById - Lỗi:", err);
    next(err);
  }
};

exports.getByWareHouseId = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  const warehouseId = req.params.id;
  try {
    const results = await service.getByWareHouseId(warehouseId); // ✅ Sử dụng await

    // Nếu không có dữ liệu, trả về mảng rỗng thay vì lỗi
    if (!results || (Array.isArray(results) && results.length === 0)) {
      // Kiểm tra cả mảng rỗng
      return res.status(200).json({ success: true, data: [] });
    }

    // `results` từ service.getByWareHouseId có thể là { success: true, data: [] }
    // Cần kiểm tra cấu trúc trả về từ service
    if (results && results.success !== undefined) {
      // Nếu service trả về object có success
      return res.status(200).json(results); // Trả về nguyên object nếu service đã định dạng
    } else {
      // Nếu service chỉ trả về mảng dữ liệu
      return res.status(200).json({ success: true, data: results });
    }
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: getByWareHouseId - Lỗi:", err);
    next(err);
  }
};

exports.checkAll = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  try {
    // Giả định service.getAllInventoriesByWarehouse trả về một Promise
    const inventories = await service.getAllInventoriesByWarehouse(
      req.params.id
    );
    if (
      !inventories ||
      (Array.isArray(inventories) && inventories.length === 0)
    ) {
      return res
        .status(404)
        .json({
          success: false,
          message: "Inventory not found for this warehouse",
        });
    }
    res.json({ success: true, data: inventories });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: checkAll - Lỗi:", err);
    next(err);
  }
};

exports.remove = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  try {
    const result = await service.deleteInventory(req.params.id); // ✅ Sử dụng await
    if (!result || result.affectedRows === 0) {
      // Kiểm tra kết quả xóa
      return res
        .status(404)
        .json({
          success: false,
          message: "Inventory not found or already deleted",
        });
    }
    res.json({ success: true, message: "Deleted successfully" });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: remove - Lỗi:", err);
    next(err);
  }
};

// ===============================
// Business Logic APIs
// ===============================

// 1️⃣ Duyệt PO -> tăng tồn kho
exports.increaseStock = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  const { orderDetails, warehouse_id } = req.body;
  try {
    await service.increaseStockFromPurchaseOrder(orderDetails, warehouse_id); // ✅ Sử dụng await
    res.json({ success: true, message: "Đã cập nhật tồn kho từ đơn mua" });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: increaseStock - Lỗi:", err);
    next(err);
  }
};

// 2️⃣ Tạm giữ hàng khi tạo đơn
exports.reserveStock = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  const { orderDetails, warehouse_id } = req.body;
  try {
    await service.reserveStockFromOrderDetails(orderDetails, warehouse_id); // ✅ Sử dụng await
    res.json({ success: true, message: "Đã tạm giữ hàng trong tồn kho" });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: reserveStock - Lỗi:", err);
    next(err);
  }
};

// 3️⃣ Xác nhận thanh toán -> trừ thật sự tồn kho
exports.confirmStock = async (req, res, next) => {
  // Hàm này đã là async, đảm bảo nhất quán
  const { orderDetails, warehouse_id } = req.body;
  try {
    await service.confirmStockReservation(orderDetails, warehouse_id);
    res.json({ success: true, message: "Đã xác nhận tồn kho" });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: confirmStock - Lỗi:", err);
    next(err);
  }
};

// 4️⃣ Hủy đơn -> giải phóng hàng đã giữ
exports.releaseStock = async (req, res, next) => {
  // ✅ Chuyển hàm thành async
  const { orderDetails, warehouse_id } = req.body;
  try {
    await service.releaseReservedStock(orderDetails, warehouse_id); // ✅ Sử dụng await
    res.json({ success: true, message: "Đã giải phóng hàng tồn kho" });
  } catch (err) {
    console.error("🚀 ~ inventory.controller.js: releaseStock - Lỗi:", err);
    next(err);
  }
};
