// const { v4: uuidv4 } = require('uuid');
// const warehouseModel = require('./warehouse.model');

// exports.createWarehouse = (req, res, next) => {
//   const warehouse_id = uuidv4();
//   const { warehouse_name, warehouse_location, warehouse_capacity } = req.body;

//   warehouseModel.createWarehouse({ warehouse_id, warehouse_name, warehouse_location, warehouse_capacity }, (err, result) => {
//     if (err) return next(err);
//     res.status(201).json({ success: true, message: 'Warehouse created', id: warehouse_id });
//   });
// };

// exports.getAllWarehouses = (req, res, next) => {
//   warehouseModel.getAllWarehouses((err, results) => {
//     if (err) return next(err);
//     res.json({ success: true, data: results });
//   });
// };

// exports.getWarehouseById = (req, res, next) => {
//   const { id } = req.params;
//   warehouseModel.getWarehouseById(id, (err, results) => {
//     if (err) return next(err);
//     if (results.length === 0) {
//       return res.status(404).json({ success: false, message: 'Warehouse not found' });
//     }
//     res.json({ success: true, data: results[0] });
//   });
// };

// exports.updateWarehouse = (req, res, next) => {
//   const { id } = req.params;
//   const { warehouse_name, warehouse_location, warehouse_capacity } = req.body;

//   warehouseModel.updateWarehouse(id, { warehouse_name, warehouse_location, warehouse_capacity }, (err, result) => {
//     if (err) return next(err);
//     res.json({ success: true, message: 'Warehouse updated' });
//   });
// };

// exports.deleteWarehouse = (req, res, next) => {
//   const { id } = req.params;
//   warehouseModel.deleteWarehouse(id, (err, result) => {
//     if (err) return next(err);
//     res.json({ success: true, message: 'Warehouse deleted' });
//   });
// };
const WarehouseModel = require("./warehouse.model"); // Đảm bảo đường dẫn đúng đến WarehouseModel
const { createResponse } = require("../../utils/response");

/**
 * Xử lý yêu cầu POST để tạo một kho mới.
 * POST /api/warehouses
 */
exports.createWarehouse = async (req, res, next) => {
  const { warehouse_name, warehouse_location, warehouse_capacity } = req.body;
  const warehouseData = {
    warehouse_name,
    warehouse_location,
    warehouse_capacity,
  }; // Model sẽ tự sinh ID

  try {
    const newWarehouse = await WarehouseModel.create(warehouseData); // Gọi hàm create đã refactor trong model
    createResponse(res, 201, true, newWarehouse, "Kho đã được tạo thành công!");
  } catch (err) {
    console.error("🚀 ~ warehouse.controller.js: createWarehouse - Lỗi:", err);
    next(err); // Chuyển lỗi đến middleware xử lý lỗi
  }
};

/**
 * Xử lý yêu cầu GET để lấy tất cả các kho.
 * GET /api/warehouses
 */
exports.getAllWarehouses = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const parsedPage = parseInt(page);
    const parsedLimit = parseInt(limit);
    const skip = (parsedPage - 1) * parsedLimit;
    let result, total;
    if (req.query.page || req.query.limit) {
      [result, total] = await Promise.all([
        WarehouseModel.getAll(skip, parsedLimit),
        WarehouseModel.countAll()
      ]);
      createResponse(
        res,
        200,
        true,
        result,
        "Danh sách kho đã được tải thành công.",
        total,
        parsedPage,
        parsedLimit
      );
    } else {
      result = await WarehouseModel.getAll();
      createResponse(
        res,
        200,
        true,
        result,
        "Danh sách kho đã được tải thành công."
      );
    }
  } catch (err) {
    console.error("🚀 ~ warehouse.controller.js: getAllWarehouses - Lỗi:", err);
    next(err);
  }
};

/**
 * Xử lý yêu cầu GET để lấy một kho theo ID.
 * GET /api/warehouses/:id
 */
exports.getWarehouseById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const warehouse = await WarehouseModel.getById(id); // Gọi hàm getById đã refactor trong model
    if (!warehouse) {
      return createResponse(res, 404, false, null, "Không tìm thấy kho.");
    }
    createResponse(
      res,
      200,
      true,
      warehouse,
      "Thông tin kho đã được tải thành công."
    );
  } catch (err) {
    console.error("🚀 ~ warehouse.controller.js: getWarehouseById - Lỗi:", err);
    next(err);
  }
};

/**
 * Xử lý yêu cầu PUT để cập nhật một kho theo ID.
 * PUT /api/warehouses/:id
 */
exports.updateWarehouse = async (req, res, next) => {
  const { id } = req.params;
  const updateData = req.body; // Toàn bộ body có thể chứa các trường cần cập nhật

  try {
    const updatedWarehouse = await WarehouseModel.update(id, updateData); // Gọi hàm update đã refactor trong model
    if (!updatedWarehouse) {
      return createResponse(
        res,
        404,
        false,
        null,
        "Không tìm thấy kho để cập nhật."
      );
    }
    createResponse(
      res,
      200,
      true,
      updatedWarehouse,
      "Kho đã được cập nhật thành công!"
    );
  } catch (err) {
    console.error("🚀 ~ warehouse.controller.js: updateWarehouse - Lỗi:", err);
    next(err);
  }
};

/**
 * Xử lý yêu cầu DELETE để xóa một kho theo ID.
 * DELETE /api/warehouses/:id
 */
exports.deleteWarehouse = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await WarehouseModel.delete(id); // Gọi hàm delete đã refactor trong model
    if (!result) {
      return createResponse(
        res,
        404,
        false,
        null,
        "Không tìm thấy kho để xóa."
      );
    }
    createResponse(res, 200, true, result, "Kho đã được xóa thành công!");
  } catch (err) {
    console.error("🚀 ~ warehouse.controller.js: deleteWarehouse - Lỗi:", err);
    next(err);
  }
};
