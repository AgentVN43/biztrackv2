# Customer Return Module

Module quản lý đơn trả hàng của khách hàng trong hệ thống warehouse và sales management.

## Tính năng chính

### 1. Quản lý đơn trả hàng
- Tạo đơn trả hàng mới với chi tiết sản phẩm
- Cập nhật thông tin đơn trả hàng
- Xóa đơn trả hàng
- Xem danh sách đơn trả hàng với pagination và filter

### 2. Xử lý đơn trả hàng
- Phê duyệt đơn trả hàng
- Xử lý đơn trả hàng (cập nhật inventory, tạo transaction)
- Từ chối đơn trả hàng với lý do
- Tính toán số tiền hoàn trả tự động
- Cập nhật số tiền hoàn trả cho từng item

### 3. Kiểm tra và validation
- Kiểm tra khả năng trả hàng của đơn hàng
- Validation thời hạn trả hàng (30 ngày)
- Kiểm tra trạng thái đơn hàng
- Kiểm tra đơn trả hàng đã tồn tại

### 4. Báo cáo và thống kê
- Thống kê đơn trả hàng theo thời gian
- Báo cáo chi tiết với phân tích trạng thái
- Tỷ lệ trả hàng

## Cấu trúc Database

### Bảng `return_orders`
- `return_id`: ID đơn trả hàng (UUID)
- `order_id`: ID đơn hàng (có thể null)
- `po_id`: ID purchase order (có thể null)
- `customer_id`: ID khách hàng (có thể null)
- `supplier_id`: ID nhà cung cấp (có thể null)
- `type`: Loại trả hàng (customer_return, supplier_return)
- `created_at`: Thời gian tạo
- `status`: Trạng thái (pending, approved, rejected, completed)
- `note`: Ghi chú

### Bảng `return_order_items`
- `return_item_id`: ID chi tiết trả hàng (UUID)
- `return_id`: ID đơn trả hàng
- `product_id`: ID sản phẩm
- `quantity`: Số lượng trả
- `refund_amount`: Số tiền hoàn trả

## API Endpoints

### 1. Tạo đơn trả hàng
```
POST /api/v1/customer-returns
```

**Body:**
```json
{
  "customer_id": "uuid",
  "order_id": "uuid",
  "po_id": "uuid",
  "supplier_id": "uuid",
  "type": "customer_return",
  "note": "Khách hàng phản ánh sản phẩm không hoạt động",
  "return_details": [
    {
      "product_id": "uuid",
      "quantity": 2,
      "refund_amount": 200000
    }
  ]
}
```

### 2. Lấy danh sách đơn trả hàng
```
GET /api/v1/customer-returns?page=1&limit=10&customer_id=uuid&status=pending
```

### 3. Lấy chi tiết đơn trả hàng
```
GET /api/v1/customer-returns/:return_id
```

### 4. Cập nhật đơn trả hàng
```
PUT /api/v1/customer-returns/:return_id
```

### 5. Phê duyệt đơn trả hàng
```
POST /api/v1/customer-returns/:return_id/approve
```

### 6. Xử lý đơn trả hàng
```
POST /api/v1/customer-returns/:return_id/process
```

### 7. Từ chối đơn trả hàng
```
POST /api/v1/customer-returns/:return_id/reject
```

**Body:**
```json
{
  "rejection_reason": "Sản phẩm đã qua thời hạn bảo hành"
}
```

### 8. Tính toán số tiền hoàn trả
```
GET /api/v1/customer-returns/:return_id/calculate-refund
```

### 9. Cập nhật số tiền hoàn trả cho item
```
PUT /api/v1/customer-returns/item/:return_item_id/refund-amount
```

**Body:**
```json
{
  "refund_amount": 200000
}
```

### 10. Kiểm tra khả năng trả hàng
```
GET /api/v1/customer-returns/order/:order_id/eligibility
```

### 11. Lấy thống kê
```
GET /api/v1/customer-returns/statistics?created_at_from=2024-01-01&created_at_to=2024-01-31
```

### 12. Lấy báo cáo
```
GET /api/v1/customer-returns/report?date_from=2024-01-01&date_to=2024-01-31
```

### 13. Lấy đơn trả hàng theo khách hàng
```
GET /api/v1/customer-returns/customer/:customer_id?page=1&limit=10
```

### 14. Lấy đơn trả hàng theo đơn hàng
```
GET /api/v1/customer-returns/order/:order_id/returns
```

## Quy trình xử lý

### 1. Tạo đơn trả hàng
1. Kiểm tra khả năng trả hàng của đơn hàng (nếu có)
2. Tạo đơn trả hàng với trạng thái "pending"
3. Tạo chi tiết trả hàng cho từng sản phẩm

### 2. Phê duyệt đơn trả hàng
1. Kiểm tra trạng thái đơn trả hàng (phải là "pending")
2. Cập nhật trạng thái thành "approved"

### 3. Xử lý đơn trả hàng
1. Kiểm tra trạng thái đơn trả hàng
2. Cập nhật inventory (thêm hàng trả về kho)
3. Tạo transaction nếu có hoàn tiền
4. Cập nhật debt của khách hàng
5. Cập nhật trạng thái thành "completed"

### 4. Từ chối đơn trả hàng
1. Kiểm tra trạng thái đơn trả hàng
2. Cập nhật trạng thái thành "rejected"
3. Ghi lý do từ chối

## Validation Rules

### 1. Kiểm tra khả năng trả hàng
- Đơn hàng phải có trạng thái "Hoàn thành"
- Trong vòng 30 ngày kể từ ngày đặt hàng
- Chưa có đơn trả hàng nào cho đơn hàng này

### 2. Validation dữ liệu
- `customer_id` bắt buộc
- `return_details` phải là array và không rỗng
- `quantity` phải > 0
- `refund_amount` phải >= 0

## Database Integration

### Foreign Keys
- `customer_id` → `customers(customer_id)`
- `order_id` → `orders(order_id)`
- `po_id` → `purchase_orders(po_id)`
- `supplier_id` → `suppliers(supplier_id)`
- `product_id` → `products(product_id)`

### Trạng thái đơn trả hàng
- `pending`: Chờ xử lý
- `approved`: Đã phê duyệt
- `rejected`: Từ chối
- `completed`: Hoàn thành

## Error Handling

Module xử lý các lỗi sau:
- Đơn trả hàng không tồn tại
- Đơn trả hàng đã được xử lý
- Không thể từ chối đơn trả hàng đã xử lý
- Thiếu thông tin bắt buộc
- Validation lỗi
- Lỗi database

## Security

- Tất cả endpoints yêu cầu authentication (hiện tại đã comment)
- Kiểm tra quyền truy cập dựa trên user role
- Validation dữ liệu đầu vào
- Sanitize dữ liệu trước khi lưu database

## Testing

File `test_customer_return.js` đã được tạo với các test cases:
- Tạo đơn trả hàng
- Lấy danh sách
- Thống kê
- Kiểm tra khả năng trả hàng
- Tính toán hoàn tiền
- Báo cáo
- Phê duyệt đơn trả hàng 