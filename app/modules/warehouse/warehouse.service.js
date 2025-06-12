// const { v4: uuidv4 } = require('uuid');
// const WarehouseModel = require('./warehouse.model');

// const WarehouseService = {
//   createWarehouse: (warehouseData, callback) => {
//     WarehouseModel.findByName(warehouseData.warehouse_name, (err, results) => {
//       if (err) return callback(err);

//       if (results.length > 0) {
//         return callback(null, {
//           conflict: true,
//           message: 'Warehouse already exists'
//         });
//       }

//       const newWarehouse = {
//         warehouse_id: uuidv4(),
//         ...warehouseData
//       };

//       WarehouseModel.create(newWarehouse, (err, result) => {
//         if (err) return callback(err);

//         callback(null, {
//           conflict: false,
//           data: {
//             id: newWarehouse.warehouse_id,
//             ...warehouseData
//           }
//         });
//       });
//     });
//   }
// };

// module.exports = WarehouseService;
const WarehouseModel = require("./warehouse.model"); // Đảm bảo đường dẫn đúng đến WarehouseModel

const WarehouseService = {
  /**
   * Tạo một kho mới sau khi kiểm tra tên kho đã tồn tại chưa.
   * @param {Object} warehouseData - Dữ liệu kho cần tạo.
   * @param {string} warehouseData.warehouse_name - Tên kho.
   * @param {string} warehouseData.warehouse_location - Vị trí kho.
   * @param {number} warehouseData.warehouse_capacity - Sức chứa kho.
   * @returns {Promise<Object>} Promise giải quyết với đối tượng kho đã tạo.
   * @throws {Error} Nếu kho đã tồn tại hoặc có lỗi.
   */
  createWarehouse: async (warehouseData) => {
    try {
      // 1. Kiểm tra xem tên kho đã tồn tại chưa
      const existingWarehouses = await WarehouseModel.findByName(
        warehouseData.warehouse_name
      );

      if (existingWarehouses && existingWarehouses.length > 0) {
        throw new Error("Tên kho đã tồn tại."); // Ném lỗi nếu tên kho trùng lặp
      }

      // 2. Tạo kho mới (Model sẽ tự sinh UUID cho warehouse_id)
      const newWarehouse = await WarehouseModel.create(warehouseData);

      return newWarehouse;
    } catch (error) {
      console.error("🚀 ~ WarehouseService: createWarehouse - Lỗi:", error);
      throw error; // Ném lỗi để controller xử lý
    }
  },

  /**
   * Lấy tất cả các kho.
   * @returns {Promise<Array<Object>>} Promise giải quyết với một mảng các đối tượng kho.
   * @throws {Error} Nếu có lỗi.
   */
  getAllWarehouses: async () => {
    try {
      return await WarehouseModel.getAll();
    } catch (error) {
      console.error("🚀 ~ WarehouseService: getAllWarehouses - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Lấy một kho theo ID.
   * @param {string} id - ID của kho.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng kho hoặc null nếu không tìm thấy.
   * @throws {Error} Nếu có lỗi.
   */
  getWarehouseById: async (id) => {
    try {
      return await WarehouseModel.getById(id);
    } catch (error) {
      console.error("🚀 ~ WarehouseService: getWarehouseById - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Cập nhật thông tin một kho.
   * @param {string} id - ID của kho cần cập nhật.
   * @param {Object} updateData - Dữ liệu cập nhật.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng kho đã cập nhật hoặc null nếu không tìm thấy.
   * @throws {Error} Nếu có lỗi hoặc không có trường nào để cập nhật.
   */
  updateWarehouse: async (id, updateData) => {
    try {
      // Tùy chọn: Kiểm tra tên kho mới có trùng với kho khác không (nếu tên kho được cập nhật)
      if (updateData.warehouse_name) {
        const existingWarehouses = await WarehouseModel.findByName(
          updateData.warehouse_name
        );
        if (
          existingWarehouses &&
          existingWarehouses.length > 0 &&
          existingWarehouses[0].warehouse_id !== id
        ) {
          throw new Error("Tên kho đã tồn tại cho một kho khác.");
        }
      }
      const updated = await WarehouseModel.update(id, updateData);
      if (!updated) {
        throw new Error("Không tìm thấy kho để cập nhật."); // Ném lỗi rõ ràng hơn
      }
      return updated;
    } catch (error) {
      console.error("🚀 ~ WarehouseService: updateWarehouse - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Xóa một kho theo ID.
   * @param {string} id - ID của kho cần xóa.
   * @returns {Promise<Object|null>} Promise giải quyết với một đối tượng thành công hoặc null nếu không tìm thấy.
   * @throws {Error} Nếu có lỗi.
   */
  deleteWarehouse: async (id) => {
    try {
      const deleted = await WarehouseModel.delete(id);
      if (!deleted) {
        throw new Error("Không tìm thấy kho để xóa."); // Ném lỗi rõ ràng hơn
      }
      return deleted;
    } catch (error) {
      console.error("🚀 ~ WarehouseService: deleteWarehouse - Lỗi:", error);
      throw error;
    }
  },
};

module.exports = WarehouseService;
