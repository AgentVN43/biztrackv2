// const db = require('../../config/db.config');

// exports.createWarehouse = (data, callback) => {
//   const { warehouse_id, warehouse_name, warehouse_location, warehouse_capacity } = data;
//   const query = 'INSERT INTO warehouses (warehouse_id, warehouse_name, warehouse_location, warehouse_capacity) VALUES (?, ?, ?, ?)';
//   db.query(query, [warehouse_id, warehouse_name, warehouse_location, warehouse_capacity], callback);
// };

// exports.getAllWarehouses = (callback) => {
//   const query = 'SELECT * FROM warehouses';
//   db.query(query, callback);
// };

// exports.getWarehouseById = (id, callback) => {
//   const query = 'SELECT * FROM warehouses WHERE warehouse_id = ?';
//   db.query(query, [id], callback);
// };

// exports.updateWarehouse = (id, data, callback) => {
//   const { warehouse_name, warehouse_location, warehouse_capacity } = data;
//   const query = `
//     UPDATE warehouses
//     SET warehouse_name = ?, warehouse_location = ?, warehouse_capacity = ?
//     WHERE warehouse_id = ?
//   `;
//   db.query(query, [warehouse_name, warehouse_location, warehouse_capacity, id], callback);
// };

// exports.deleteWarehouse = (id, callback) => {
//   const query = 'DELETE FROM warehouses WHERE warehouse_id = ?';
//   db.query(query, [id], callback);
// };

const db = require("../../config/db.config"); // Đảm bảo đường dẫn đúng đến file cấu hình database của bạn
const { v4: uuidv4 } = require("uuid"); // Để tạo UUID cho warehouse_id nếu cần

const WarehouseModel = {
  /**
   * Tạo một bản ghi kho mới.
   * @param {Object} data - Dữ liệu kho.
   * @param {string} [data.warehouse_id] - ID kho (tùy chọn, sẽ tự sinh nếu không có).
   * @param {string} data.warehouse_name - Tên kho.
   * @param {string} data.warehouse_location - Vị trí kho.
   * @param {number} data.warehouse_capacity - Sức chứa kho.
   * @returns {Promise<Object>} Promise giải quyết với đối tượng kho đã tạo.
   * @throws {Error} Nếu thiếu thông tin bắt buộc hoặc có lỗi database.
   */
  create: async (data) => {
    const warehouse_id = data.warehouse_id || uuidv4(); // Sử dụng ID nếu có, nếu không tự sinh
    const { warehouse_name, warehouse_location, warehouse_capacity } = data;

    // Validate inputs
    if (
      !warehouse_name ||
      !warehouse_location ||
      warehouse_capacity === undefined
    ) {
      throw new Error(
        "Thiếu thông tin bắt buộc để tạo kho (tên, vị trí, sức chứa)."
      );
    }

    const query =
      "INSERT INTO warehouses (warehouse_id, warehouse_name, warehouse_location, warehouse_capacity) VALUES (?, ?, ?, ?)";
    const values = [
      warehouse_id,
      warehouse_name,
      warehouse_location,
      warehouse_capacity,
    ];

    try {
      await db.promise().query(query, values);
      return { warehouse_id, ...data };
    } catch (error) {
      console.error("🚀 ~ WarehouseModel: create - Lỗi khi tạo kho:", error);
      throw error;
    }
  },

  /**
   * Lấy tất cả các bản ghi kho.
   * @returns {Promise<Array<Object>>} Promise giải quyết với một mảng các đối tượng kho.
   * @throws {Error} Nếu có lỗi database.
   */
  getAll: async () => {
    const query = "SELECT * FROM warehouses ORDER BY warehouse_name ASC";
    try {
      const [rows] = await db.promise().query(query);
      return rows;
    } catch (error) {
      console.error(
        "🚀 ~ WarehouseModel: getAll - Lỗi khi lấy tất cả kho:",
        error
      );
      throw error;
    }
  },

  /**
   * Lấy một bản ghi kho theo ID.
   * @param {string} id - ID của kho.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng kho hoặc null nếu không tìm thấy.
   * @throws {Error} Nếu có lỗi database.
   */
  getById: async (id) => {
    const query = "SELECT * FROM warehouses WHERE warehouse_id = ?";
    try {
      const [rows] = await db.promise().query(query, [id]);
      return rows.length ? rows[0] : null;
    } catch (error) {
      console.error(
        "🚀 ~ WarehouseModel: getById - Lỗi khi lấy kho theo ID:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật thông tin một bản ghi kho.
   * @param {string} id - ID của kho cần cập nhật.
   * @param {Object} data - Dữ liệu cập nhật.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng kho đã cập nhật hoặc null nếu không tìm thấy.
   * @throws {Error} Nếu không có trường nào để cập nhật hoặc có lỗi database.
   */
  update: async (id, data) => {
    const fields = [];
    const values = [];

    // Xây dựng động các cặp 'field = ?' và giá trị tương ứng
    // Chỉ thêm các trường có trong bảng
    if (data.warehouse_name !== undefined) {
      fields.push("warehouse_name = ?");
      values.push(data.warehouse_name);
    }
    if (data.warehouse_location !== undefined) {
      fields.push("warehouse_location = ?");
      values.push(data.warehouse_location);
    }
    if (data.warehouse_capacity !== undefined) {
      fields.push("warehouse_capacity = ?");
      values.push(data.warehouse_capacity);
    }

    if (fields.length === 0) {
      throw new Error("Không có trường hợp lệ để cập nhật.");
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`); // Luôn cập nhật thời gian sửa đổi
    values.push(id); // Thêm ID vào cuối cho mệnh đề WHERE

    const query = `UPDATE warehouses SET ${fields.join(
      ", "
    )} WHERE warehouse_id = ?`;

    try {
      const [result] = await db.promise().query(query, values);
      if (result.affectedRows === 0) {
        return null; // Không tìm thấy kho để cập nhật
      }
      return { warehouse_id: id, ...data }; // Trả về thông tin kho đã cập nhật
    } catch (error) {
      console.error(
        "🚀 ~ WarehouseModel: update - Lỗi khi cập nhật kho:",
        error
      );
      throw error;
    }
  },

  /**
   * Xóa một bản ghi kho theo ID.
   * @param {string} id - ID của kho cần xóa.
   * @returns {Promise<Object|null>} Promise giải quyết với một đối tượng thành công hoặc null nếu không tìm thấy.
   * @throws {Error} Nếu có lỗi database.
   */
  delete: async (id) => {
    const query = "DELETE FROM warehouses WHERE warehouse_id = ?";
    try {
      const [result] = await db.promise().query(query, [id]);
      if (result.affectedRows === 0) {
        return null; // Không tìm thấy kho để xóa
      }
      return { message: "Kho đã được xóa thành công", warehouse_id: id };
    } catch (error) {
      console.error("🚀 ~ WarehouseModel: delete - Lỗi khi xóa kho:", error);
      throw error;
    }
  },
};

module.exports = WarehouseModel;
