# API Sổ Cái Giao Dịch Khách Hàng

## Tổng quan
API này cung cấp lịch sử giao dịch chi tiết của khách hàng theo format sổ cái (ledger), hiển thị tất cả các giao dịch từ khi tạo đơn hàng đến thanh toán theo thứ tự thời gian.

## Endpoint
```
GET /api/customers/:id/transaction-ledger
```

## Tham số
- `id` (string, required): ID của khách hàng

## Response Format

### Success Response (200)
```json
{
  "success": true,
  "data": [
    {
      "ma_giao_dich": "ORD-20241201-00001",
      "ngay_giao_dich": "01/12/2024",
      "loai": "Tạo đơn hàng",
      "gia_tri": "10,000,000 VNĐ",
      "du_no": "10,000,000 VNĐ",
      "mo_ta": "Tạo đơn hàng ORD-20241201-00001 - Mới",
      "order_id": "uuid-order-1",
      "invoice_id": null,
      "transaction_id": null,
      "order_code": "ORD-20241201-00001",
      "invoice_code": null,
      "status": "Mới"
    },
    {
      "ma_giao_dich": "ORD-20241201-00001-ADVANCE",
      "ngay_giao_dich": "01/12/2024",
      "loai": "Thanh toán một phần",
      "gia_tri": "2,000,000 VNĐ",
      "du_no": "8,000,000 VNĐ",
      "mo_ta": "Thanh toán trước cho đơn hàng ORD-20241201-00001",
      "order_id": "uuid-order-1",
      "invoice_id": null,
      "transaction_id": null,
      "order_code": "ORD-20241201-00001",
      "invoice_code": null,
      "status": "completed"
    }
  ],
  "message": "Sổ cái giao dịch của khách hàng đã được tải thành công."
}
```

### Error Response (404)
```json
{
  "success": false,
  "data": null,
  "message": "Không tìm thấy lịch sử giao dịch cho khách hàng ID: customer-id."
}
```

## Logic Tính Toán

### Các Loại Giao Dịch
1. **Tạo đơn hàng** (`pending`): Tăng dư nợ
2. **Thanh toán một phần** (`partial_paid`): Giảm dư nợ
3. **Thanh toán** (`payment`): Giảm dư nợ

### Cách Tính Dư Nợ
- **Dư nợ ban đầu**: 0
- **Khi tạo đơn hàng**: Dư nợ = Dư nợ cũ + Giá trị đơn hàng
- **Khi thanh toán**: Dư nợ = Dư nợ cũ - Số tiền thanh toán

## Ví Dụ Thực Tế

### Tình huống:
- **Order 1**: 10tr, thanh toán trước 0đ
- **Order 2**: 5tr, thanh toán trước 1tr

### Kết quả hiển thị:
```
Mã giao dịch              | Ngày giao dịch | Loại            | Giá trị         | Dư nợ
gd1                       | 28-06-2025     | Tạo đơn hàng    | 10,000,000 VNĐ  | 10,000,000 VNĐ
gd2                       | 28-06-2025     | Tạo đơn hàng    | 5,000,000 VNĐ   | 15,000,000 VNĐ
gd2-ADVANCE               | 28-06-2025     | Thanh toán một phần | 1,000,000 VNĐ | 14,000,000 VNĐ
```

## Cách Sử Dụng

### 1. Gọi API
```javascript
const axios = require('axios');

const response = await axios.get('http://localhost:3000/api/customers/customer-id/transaction-ledger');
console.log(response.data);
```

### 2. Test với file test
```bash
# Cài đặt axios nếu chưa có
npm install axios

# Chỉnh sửa CUSTOMER_ID trong file test
# Chạy test
node test_transaction_ledger.js
```

## Dữ Liệu Nguồn
API kết hợp dữ liệu từ:
- **Bảng orders**: Đơn hàng và thanh toán trước
- **Bảng invoices**: Hóa đơn và thanh toán
- **Bảng transactions**: Giao dịch thanh toán riêng lẻ

## Lưu Ý
- Dữ liệu được sắp xếp theo thời gian từ cũ đến mới
- Dư nợ được tính toán liên tục theo thứ tự thời gian
- Hỗ trợ hiển thị thông tin chi tiết về order, invoice, transaction
- Format tiền tệ theo chuẩn Việt Nam 