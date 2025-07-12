# 🔄 **Kế hoạch tích hợp Supplier Return**

## 📋 **Tổng quan**

Tích hợp nghiệp vụ trả hàng cho nhà cung cấp vào hệ thống hiện có, tận dụng cơ sở hạ tầng đã có sẵn.

## 🎯 **Mục tiêu**

1. **Ghi nhận trả hàng**: Tạo đơn trả hàng cho nhà cung cấp
2. **Cập nhật tồn kho**: Giảm số lượng hàng trong kho
3. **Ghi nhận công nợ**: Giảm công nợ phải trả nhà cung cấp
4. **Tạo giao dịch**: Ghi nhận vào sổ cái
5. **Theo dõi lịch sử**: Ghi nhận vào product_events và inventory_adjustments

## 🏗️ **Kiến trúc tích hợp**

### **1. Tận dụng bảng hiện có**
```sql
-- Đã có sẵn
return_orders (type = 'supplier_return')
return_order_items
inventory_adjustments
product_events
```

### **2. Module mới cần tạo**
```
app/modules/supplier_return/
├── supplier_return.model.js
├── supplier_return.service.js
├── supplier_return.controller.js
└── supplier_return.routes.js
```

### **3. Tích hợp với module hiện có**

#### **A. Invoice Module**
- Tạo invoice type: `supplier_return_invoice`
- Ghi nhận giảm công nợ phải trả

#### **B. Inventory Module**
- Giảm số lượng tồn kho
- Ghi nhận vào `inventory_adjustments`
- Ghi nhận vào `product_events`

#### **C. Transaction Module**
- Tạo transaction type: `supplier_refund`
- Ghi nhận giảm công nợ

#### **D. Purchase Order Module**
- Liên kết với PO gốc
- Cập nhật trạng thái PO nếu cần

## 🔄 **Luồng nghiệp vụ**

### **1. Tạo đơn trả hàng**
```
Frontend → Supplier Return Controller → Service → Model
```

### **2. Xử lý đơn trả hàng**
```
1. Cập nhật inventory (giảm số lượng)
2. Ghi nhận inventory_adjustments
3. Ghi nhận product_events
4. Tạo transaction (giảm công nợ)
5. Cập nhật supplier payables
6. Tạo invoice (nếu cần)
```

### **3. Ghi nhận sổ cái**
```
Dr. Supplier Payables (giảm)
Cr. Inventory (giảm)
Cr. Cost of Goods Sold (nếu cần)
```

## 📊 **Cấu trúc dữ liệu**

### **Supplier Return Data**
```javascript
{
  return_id: "uuid",
  po_id: "uuid",           // Liên kết với PO gốc
  supplier_id: "uuid",     // Nhà cung cấp
  type: "supplier_return",
  status: "pending|approved|completed|rejected",
  price_value: 1000000,    // Giá trị hàng trả
  note: "Lý do trả hàng",
  created_at: "timestamp"
}
```

### **Return Items**
```javascript
{
  return_item_id: "uuid",
  return_id: "uuid",
  product_id: "uuid",
  quantity: 10,
  refund_amount: 500000,   // Số tiền hoàn trả
  created_at: "timestamp"
}
```

## 🔧 **Implementation Steps**

### **Phase 1: Core Module**
1. Tạo supplier_return model
2. Tạo supplier_return service
3. Tạo supplier_return controller
4. Tạo supplier_return routes

### **Phase 2: Integration**
1. Tích hợp với inventory module
2. Tích hợp với transaction module
3. Tích hợp với invoice module
4. Tích hợp với purchase order module

### **Phase 3: Advanced Features**
1. Báo cáo supplier return
2. Thống kê tỷ lệ trả hàng
3. Dashboard tích hợp

## ⚠️ **Lưu ý quan trọng**

### **1. Validation**
- Kiểm tra PO tồn tại và hợp lệ
- Kiểm tra số lượng có thể trả
- Kiểm tra thời gian trả hàng

### **2. Business Rules**
- Chỉ trả hàng từ PO đã hoàn thành
- Tính toán refund dựa trên giá gốc
- Cập nhật công nợ chính xác

### **3. Audit Trail**
- Ghi nhận đầy đủ lịch sử
- Tracking người thực hiện
- Backup dữ liệu quan trọng

## 📈 **Benefits**

1. **Quản lý chính xác**: Theo dõi đầy đủ nghiệp vụ
2. **Báo cáo đầy đủ**: Phản ánh đúng tình hình tài chính
3. **Tối ưu tồn kho**: Quản lý hàng tồn kho chính xác
4. **Tuân thủ kế toán**: Đáp ứng chuẩn kế toán

## 🚀 **Next Steps**

1. Review và approve kế hoạch
2. Bắt đầu implement Phase 1
3. Testing và validation
4. Deploy và monitoring 