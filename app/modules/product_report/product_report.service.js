const ProductEventModel = require('./product_event.model'); // Đảm bảo đường dẫn đúng

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

      const report = events.map(event => {
        let loai_giao_dich;
        // Map event_type sang định dạng tiếng Việt mong muốn
        switch (event.event_type) {
          case 'ORDER_SOLD':
            loai_giao_dich = 'Bán hàng';
            break;
          case 'PO_RECEIVED':
            loai_giao_dich = 'Nhập hàng';
            break;
          case 'STOCK_ADJUSTMENT_INCREASE':
            loai_giao_dich = 'Điều chỉnh tăng kho';
            break;
          case 'STOCK_ADJUSTMENT_DECREASE':
            loai_giao_dich = 'Điều chỉnh giảm kho';
            break;
          case 'RETURN_FROM_CUSTOMER': // Giả định bạn sẽ thêm event_type này sau
            loai_giao_dich = 'Khách hàng trả hàng';
            break;
          case 'RETURN_TO_SUPPLIER': // Giả định bạn sẽ thêm event_type này sau
            loai_giao_dich = 'Trả hàng nhà cung cấp';
            break;
          default:
            loai_giao_dich = 'Giao dịch khác';
        }

        return {
          chung_tu: event.reference_id,
          thoi_gian: event.event_timestamp, // Có thể format lại theo ý muốn (ví dụ: 'DD/MM/YYYY HH:mm:ss')
          loai_giao_dich: loai_giao_dich,
          doi_tac: event.partner_name || 'N/A', // Hiển thị N/A nếu không có đối tác (ví dụ: điều chỉnh kho)
          gia_gd: event.transaction_price || 0, // Giá giao dịch, 0 nếu không có
          so_luong: event.quantity_impact,
          ton_cuoi: event.current_stock_after || 0, // Tồn cuối sau sự kiện, 0 nếu null
          mo_ta: event.description, // Thêm mô tả cho chi tiết
        };
      });

      return report;

    } catch (error) {
      console.error("🚀 ~ ProductReportService: getProductHistoryReport - Error:", error);
      throw error; // Ném lỗi để controller xử lý
    }
  },
};

module.exports = ProductReportService;
