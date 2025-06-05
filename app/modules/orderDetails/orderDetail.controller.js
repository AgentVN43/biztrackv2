// const OrderDetailService = require('./orderDetail.service');

// const OrderDetailController = {
//     create: (req, res) => {
//         OrderDetailService.create(req.body, (error, orderDetail) => {
//             if (error) {
//                 return res.status(500).json({ message: 'Failed to create order detail', error });
//             }
//             res.status(201).json(orderDetail);
//         });
//     },

//     read: (req, res) => {
//         OrderDetailService.read((error, orderDetails) => {
//             if (error) {
//                 return res.status(500).json({ message: 'Failed to read order details', error });
//             }
//             res.status(200).json(orderDetails);
//         });
//     },

//     readById: (req, res) => {
//         const { id } = req.params;
//         OrderDetailService.readById(id, (error, orderDetail) => {
//             if (error) {
//                 return res.status(500).json({ message: 'Failed to read order detail', error });
//             }
//             if (!orderDetail) {
//                 return res.status(404).json({ message: 'Order detail not found' });
//             }
//             res.status(200).json(orderDetail);
//         });
//     },

//        getOrderDetailByOrderId: (req, res) => {
//         const { id } = req.params;
//         OrderDetailService.getOrderDetailByOrderId(id, (error, orderDetail) => {
//             if (error) {
//                 return res.status(500).json({ message: 'Failed to read order detail', error });
//             }
//             if (!orderDetail) {
//                 return res.status(404).json({ message: 'Order detail not found' });
//             }
//             res.status(200).json(orderDetail);
//         });
//     },

//     update: (req, res) => {
//         const { id } = req.params;
//         OrderDetailService.update(id, req.body, (error, orderDetail) => {
//             if (error) {
//                 return res.status(500).json({ message: 'Failed to update order detail', error });
//             }
//             if (!orderDetail) {
//                 return res.status(404).json({ message: 'Order detail not found' });
//             }
//             res.status(200).json(orderDetail);
//         });
//     },

//     delete: (req, res) => {
//         const { id } = req.params;
//         OrderDetailService.delete(id, (error, success) => {
//             if (error) {
//                 return res.status(500).json({ message: 'Failed to delete order detail', error });
//             }
//             if (!success) {
//                 return res.status(404).json({ message: 'Order detail not found' });
//             }
//             res.status(204).send();
//         });
//     }
// };

// module.exports = OrderDetailController;

// orderDetail.controller.js
const OrderDetailService = require("./orderDetail.service");

const OrderDetailController = {
  /**
   * Xử lý yêu cầu tạo chi tiết đơn hàng mới.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  create: async (req, res, next) => {
    // ✅ Chuyển sang async
    try {
      const orderDetail = await OrderDetailService.create(req.body); // ✅ Sử dụng await
      res.status(201).json(orderDetail);
    } catch (error) {
      console.error("🚀 ~ orderDetail.controller.js: create - Lỗi:", error);
      next(error); // ✅ Chuyển lỗi đến middleware xử lý lỗi
    }
  },

  /**
   * Xử lý yêu cầu đọc tất cả chi tiết đơn hàng.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  read: async (req, res, next) => {
    // ✅ Chuyển sang async
    try {
      const orderDetails = await OrderDetailService.read(); // ✅ Sử dụng await
      res.status(200).json(orderDetails);
    } catch (error) {
      console.error("🚀 ~ orderDetail.controller.js: read - Lỗi:", error);
      next(error);
    }
  },

  /**
   * Xử lý yêu cầu đọc chi tiết đơn hàng theo ID.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  readById: async (req, res, next) => {
    // ✅ Chuyển sang async
    const { id } = req.params;
    try {
      const orderDetail = await OrderDetailService.readById(id); // ✅ Sử dụng await
      if (!orderDetail) {
        return res.status(404).json({ message: "Order detail not found" });
      }
      res.status(200).json(orderDetail);
    } catch (error) {
      console.error("🚀 ~ orderDetail.controller.js: readById - Lỗi:", error);
      next(error);
    }
  },

  /**
   * Xử lý yêu cầu lấy chi tiết đơn hàng theo ID đơn hàng chính.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  getOrderDetailByOrderId: async (req, res, next) => {
    // ✅ Chuyển sang async
    const { id } = req.params;
    try {
      const orderDetail = await OrderDetailService.getOrderDetailByOrderId(id); // ✅ Sử dụng await
      if (!orderDetail) {
        return res.status(404).json({ message: "Order detail not found" });
      }
      res.status(200).json(orderDetail);
    } catch (error) {
      console.error(
        "🚀 ~ orderDetail.controller.js: getOrderDetailByOrderId - Lỗi:",
        error
      );
      next(error);
    }
  },

  /**
   * Xử lý yêu cầu cập nhật chi tiết đơn hàng.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  update: async (req, res, next) => {
    // ✅ Chuyển sang async
    const { id } = req.params;
    try {
      const orderDetail = await OrderDetailService.update(id, req.body); // ✅ Sử dụng await
      if (!orderDetail) {
        return res.status(404).json({ message: "Order detail not found" });
      }
      res.status(200).json(orderDetail);
    } catch (error) {
      console.error("🚀 ~ orderDetail.controller.js: update - Lỗi:", error);
      next(error);
    }
  },

  /**
   * Xử lý yêu cầu xóa chi tiết đơn hàng.
   * @param {Object} req - Đối tượng Request.
   * @param {Object} res - Đối tượng Response.
   * @param {Function} next - Hàm middleware tiếp theo.
   */
  delete: async (req, res, next) => {
    // ✅ Chuyển sang async
    const { id } = req.params;
    try {
      const success = await OrderDetailService.delete(id); // ✅ Sử dụng await
      if (!success) {
        return res.status(404).json({ message: "Order detail not found" });
      }
      res.status(204).send(); // 204 No Content cho xóa thành công
    } catch (error) {
      console.error("🚀 ~ orderDetail.controller.js: delete - Lỗi:", error);
      next(error);
    }
  },
};

module.exports = OrderDetailController;
