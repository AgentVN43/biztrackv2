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

exports.getProductHistoryByProductAndWarehouse = async (req, res, next) => {
  const product_id = req.params.productId; // Lấy product_id từ URL params
  const warehouse_id = req.params.warehouseId; // Lấy warehouse_id từ URL params
  try {
    const history =
      await ProductReportService.getProductHistoryByProductAndWarehouse(
        product_id,
        warehouse_id
      );
    if (!history || history.length === 0) {
      return createResponse(
        res,
        404,
        false,
        null,
        `Không tìm thấy lịch sử cho sản phẩm ID: ${product_id} tại kho ID: ${warehouse_id}.`
      );
    }
    createResponse(
      res,
      200,
      true,
      history,
      "Lịch sử sản phẩm theo kho đã được tải thành công."
    );
  } catch (error) {
    console.error(
      "🚀 ~ ProductReportController: getProductHistoryByProductAndWarehouse - Lỗi:",
      error
    );
    next(error); // Chuyển lỗi xuống middleware xử lý lỗi
  }
};
