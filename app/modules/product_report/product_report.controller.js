const createResponse = require("../../utils/response");
const ProductReportService = require("./product_report.service"); // Đảm bảo đường dẫn đúng

exports.getProductHistory = async (req, res, next) => {
  const product_id = req.params.id; // Lấy product_id từ URL params

  try {
    const historyReport = await ProductReportService.getProductHistoryReport(
      product_id
    );

    if (historyReport.length === 0) {
      // Trả về 404 nếu không tìm thấy lịch sử cho sản phẩm này
      return createResponse(
        res,
        404,
        false,
        null,
        `Không tìm thấy lịch sử cho sản phẩm với ID: ${product_id}`
      );
    }

    createResponse(
      res,
      200,
      true,
      historyReport,
      "Lịch sử sản phẩm đã được tải thành công."
    );
  } catch (error) {
    console.error(
      "🚀 ~ product_report.controller.js: getProductHistory - Lỗi:",
      error
    );
    next(error); // Chuyển lỗi xuống middleware xử lý lỗi
  }
};
