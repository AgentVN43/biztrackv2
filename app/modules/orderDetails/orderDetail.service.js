// const OrderDetailModel = require("./orderDetail.model");

// const OrderDetailService = {
//   create: (data, callback) => {
//     OrderDetailModel.create(data, callback);
//   },

//   read: (callback) => {
//     OrderDetailModel.read(callback);
//   },

//   readById: (order_detail_id, callback) => {
//     OrderDetailModel.readById(order_detail_id, callback);
//   },

//   getOrderDetailByOrderId: (order_id, callback) => {
//     OrderDetailModel.getOrderDetailByOrderId(order_id, callback);
//   },

//   update: (order_detail_id, data, callback) => {
//     OrderDetailModel.update(order_detail_id, data, callback);
//   },

//   delete: (order_detail_id, callback) => {
//     OrderDetailModel.delete(order_detail_id, callback);
//   },

// };

// module.exports = OrderDetailService;
// orderDetail.service.js
const OrderDetailModel = require("./orderDetail.model"); // ✅ Đảm bảo import đúng tên OrderDetailModel

const OrderDetailService = {
  /**
   * Tạo một chi tiết đơn hàng mới.
   * @param {Object} data - Dữ liệu chi tiết đơn hàng.
   * @returns {Promise<Object>} Promise giải quyết với chi tiết đơn hàng đã tạo.
   */
  create: async (data) => {
    // ✅ Chuyển sang async
    try {
      const result = await OrderDetailModel.create(data); // ✅ Sử dụng await
      return result;
    } catch (error) {
      console.error("🚀 ~ orderDetail.service.js: create - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Đọc tất cả các chi tiết đơn hàng.
   * @returns {Promise<Array<Object>>} Promise giải quyết với danh sách chi tiết đơn hàng.
   */
  read: async () => {
    // ✅ Chuyển sang async
    try {
      const results = await OrderDetailModel.read(); // ✅ Sử dụng await
      return results;
    } catch (error) {
      console.error("🚀 ~ orderDetail.service.js: read - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Đọc chi tiết đơn hàng theo ID.
   * @param {string} order_detail_id - ID chi tiết đơn hàng.
   * @returns {Promise<Object|null>} Promise giải quyết với chi tiết đơn hàng hoặc null.
   */
  readById: async (order_detail_id) => {
    // ✅ Chuyển sang async
    try {
      const result = await OrderDetailModel.readById(order_detail_id); // ✅ Sử dụng await
      return result;
    } catch (error) {
      console.error("🚀 ~ orderDetail.service.js: readById - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Lấy chi tiết đơn hàng theo ID đơn hàng chính.
   * @param {string} order_id - ID đơn hàng chính.
   * @returns {Promise<Object|null>} Promise giải quyết với đối tượng đơn hàng kèm chi tiết hoặc null.
   */
  getOrderDetailByOrderId: async (order_id) => {
    // ✅ Chuyển sang async
    try {
      const result = await OrderDetailModel.getOrderDetailByOrderId(order_id); // ✅ Sử dụng await
      return result;
    } catch (error) {
      console.error(
        "🚀 ~ orderDetail.service.js: getOrderDetailByOrderId - Lỗi:",
        error
      );
      throw error;
    }
  },

  /**
   * Cập nhật thông tin chi tiết đơn hàng.
   * @param {string} order_detail_id - ID chi tiết đơn hàng.
   * @param {Object} data - Dữ liệu cập nhật.
   * @returns {Promise<Object|null>} Promise giải quyết với chi tiết đơn hàng đã cập nhật hoặc null.
   */
  update: async (order_detail_id, data) => {
    // ✅ Chuyển sang async
    try {
      const result = await OrderDetailModel.update(order_detail_id, data); // ✅ Sử dụng await
      return result;
    } catch (error) {
      console.error("🚀 ~ orderDetail.service.js: update - Lỗi:", error);
      throw error;
    }
  },

  /**
   * Xóa một chi tiết đơn hàng.
   * @param {string} order_detail_id - ID chi tiết đơn hàng.
   * @returns {Promise<boolean>} Promise giải quyết với true nếu xóa thành công, false nếu không.
   */
  delete: async (order_detail_id) => {
    // ✅ Chuyển sang async
    try {
      const result = await OrderDetailModel.delete(order_detail_id); // ✅ Sử dụng await
      return result;
    } catch (error) {
      console.error("🚀 ~ orderDetail.service.js: delete - Lỗi:", error);
      throw error;
    }
  },
};

module.exports = OrderDetailService;
