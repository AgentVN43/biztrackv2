const ProductEventModel = require("./product_event.model"); // Đảm bảo đường dẫn đúng
const ProductModel = require("../product/product.model");
const WarehouseModel = require('../warehouse/warehouse.model');


const ProductReportService = {
  /**
   * Tạo báo cáo lịch sử chi tiết cho một sản phẩm cụ thể.
   * Báo cáo này tổng hợp thông tin từ các sự kiện đã ghi nhận trong product_events.
   *
   * @param {string} product_id - ID của sản phẩm cần tạo báo cáo.
   * @returns {Promise<Array<Object>>} Promise giải quyết với một mảng các đối tượng lịch sử đã định dạng.
   * Mỗi đối tượng bao gồm: chung_tu, thoi_gian, loai_giao_dich,
   * doi_tac, gia_gd, so_luong, ton_cuoi.
   */
  getProductHistoryReport: async (product_id) => {
    try {
      const events = await ProductEventModel.getEventsByProductId(product_id);

      if (!events || events.length === 0) {
        return []; // Trả về mảng rỗng nếu không có sự kiện nào
      }

      const report = events.map((event) => {
        let loai_giao_dich;
        // Map event_type sang định dạng tiếng Việt mong muốn
        switch (event.event_type) {
          case "ORDER_SOLD":
            loai_giao_dich = "Bán hàng";
            break;
          case "PO_RECEIVED":
            loai_giao_dich = "Nhập hàng";
            break;
          case "STOCK_ADJUSTMENT_INCREASE":
            loai_giao_dich = "Điều chỉnh tăng kho";
            break;
          case "STOCK_ADJUSTMENT_DECREASE":
            loai_giao_dich = "Điều chỉnh giảm kho";
            break;
          case "RETURN_FROM_CUSTOMER": // Giả định bạn sẽ thêm event_type này sau
            loai_giao_dich = "Khách hàng trả hàng";
            break;
          case "RETURN_TO_SUPPLIER": // Giả định bạn sẽ thêm event_type này sau
            loai_giao_dich = "Trả hàng nhà cung cấp";
            break;
          default:
            loai_giao_dich = "Giao dịch khác";
        }

        return {
          chung_tu: event.reference_id,
          thoi_gian: event.event_timestamp, // Có thể format lại theo ý muốn (ví dụ: 'DD/MM/YYYY HH:mm:ss')
          loai_giao_dich: loai_giao_dich,
          doi_tac: event.partner_name || "N/A", // Hiển thị N/A nếu không có đối tác (ví dụ: điều chỉnh kho)
          gia_gd: event.transaction_price || 0, // Giá giao dịch, 0 nếu không có
          so_luong: event.quantity_impact,
          ton_cuoi: event.current_stock_after || 0, // Tồn cuối sau sự kiện, 0 nếu null
          mo_ta: event.description, // Thêm mô tả cho chi tiết
        };
      });

      return report;
    } catch (error) {
      console.error(
        "🚀 ~ ProductReportService: getProductHistoryReport - Error:",
        error
      );
      throw error; // Ném lỗi để controller xử lý
    }
  },

  getProductHistoryByProductAndWarehouse: async (product_id, warehouse_id) => {
    try {
      // Gọi hàm model mới để lấy sự kiện theo sản phẩm và kho
      const events = await ProductEventModel.getEventsByProductAndWarehouseId(
        product_id,
        warehouse_id
      );

      if (!events || events.length === 0) {
        return [];
      }

      // Lấy thông tin chi tiết về sản phẩm (nếu cần hiển thị tên sản phẩm đầy đủ)
      // Giả sử ProductModel.findById tồn tại
      const productInfo = await ProductModel.getProductById(product_id);
      const productName = productInfo
        ? productInfo.product_name
        : `Sản phẩm ${product_id}`;

      // Lấy tên kho (nếu model không trả về, mặc dù chúng ta đã thêm vào model query)
      const warehouseInfo = await WarehouseModel.getById(warehouse_id); // Giả sử WarehouseModel.findById tồn tại
      const warehouseName = warehouseInfo
        ? warehouseInfo.warehouse_name
        : `Kho ${warehouse_id}`;

      const report = events.map((event) => {
        let loai_giao_dich;
        switch (event.event_type) {
          case "ORDER_SOLD":
            loai_giao_dich = "Bán hàng";
            break;
          case "PO_RECEIVED":
            loai_giao_dich = "Nhập hàng";
            break;
          case "STOCK_ADJUSTMENT_INCREASE":
            loai_giao_dich = "Điều chỉnh tăng kho";
            break;
          case "STOCK_ADJUSTMENT_DECREASE":
            loai_giao_dich = "Điều chỉnh giảm kho";
            break;
          case "ORDER_CANCELLED":
            loai_giao_dich = "Huỷ đơn hàng";
            break;
          case "RETURN_FROM_CUSTOMER":
            loai_giao_dich = "Khách hàng trả hàng";
            break;
          case "RETURN_TO_SUPPLIER":
            loai_giao_dich = "Trả hàng nhà cung cấp";
            break;
          default:
            loai_giao_dich = "Giao dịch khác";
        }

        return {
          chung_tu: event.reference_id,
          thoi_gian: event.event_timestamp,
          loai_giao_dich: loai_giao_dich,
          doi_tac: event.partner_name || "N/A",
          gia_gd: event.transaction_price || 0,
          so_luong: event.quantity_impact,
          ton_cuoi: event.current_stock_after || 0,
          mo_ta: event.description,
          product_name: productName, // Bao gồm tên sản phẩm
          warehouse_name: event.warehouse_name || warehouseName, // Tên kho từ JOIN hoặc từ WarehouseModel
          warehouse_id: event.warehouse_id,
        };
      });

      return report;
    } catch (error) {
      console.error(
        "🚀 ~ ProductReportService: getProductHistoryByProductAndWarehouse - Lỗi:",
        error
      );
      throw error;
    }
  },
};

module.exports = ProductReportService;
