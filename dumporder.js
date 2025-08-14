function getRandomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function getRandomOrderDate() {
  const start = new Date("2025-01-01");
  const end = new Date("2025-08-06");
  const randomTime =
    start.getTime() + Math.random() * (end.getTime() - start.getTime());
  const randomDate = new Date(randomTime);
  return randomDate.toISOString().slice(0, 10); // format YYYY-MM-DD
}

const customerIds = [
  "113994b8-4153-437c-9323-5d5025fcafb5",
  "28dbeb62-87af-41b1-97ca-62dee29c1ca1",
  "679eb073-216b-42f5-97c3-3260a83ff5a8",
  "6f360492-3df2-4d16-bf64-3351ce0357ca",
  "79ab373d-1468-443c-9cda-112e56f76964",
  "a9948433-8535-4c08-b2ee-8f90d49e09b4",
  "af421cb9-9e7b-461a-9986-0f63bbeb6783",
];

const products = [
  { product_id: "1deb4808-3aae-11f0-b0ee-00505689acf4", price: 2000000 },
  { product_id: "2xyz8808-4abc-11f0-b0ee-00505689ab12", price: 500000 },
  { product_id: "0653645f-f8e6-470a-b74a-b63953e54dfa", price: 9000000 },
  { product_id: "2b34d0a6-b9f7-446b-96ed-ef1b7aa48f66", price: 1111111 },
  { product_id: "45e24e62-a550-402e-8d95-8a47db0f32f9", price: 10990000 },
  { product_id: "c37b260a-3798-11f0-b0ee-00505689acf4", price: 1438000 },
];

const warehouseIds = ["762fe746-344e-4834-97b8-6f1203ebb583"];

const paymentMethods = ["Chuyển khoản", "Tiền mặt", "COD"];
const addresses = ["Thủ Đức", "Quận 1", "Bình Thạnh", "Tân Phú"];

function generateRandomOrder() {
  const customer_id = getRandomItem(customerIds);
  const warehouse_id = getRandomItem(warehouseIds);
  const payment_method = getRandomItem(paymentMethods);
  const shipping_address = getRandomItem(addresses);
  const order_date = new Date().toISOString().slice(0, 10); // yyyy-mm-dd

  const product = getRandomItem(products);
  const quantity = Math.floor(Math.random() * 5) + 1;
  const price = product.price;
  const discount = 0;

  return {
    order: {
      customer_id,
      order_date: getRandomOrderDate(),
      order_amount: 0,
      shipping_address,
      shipping_fee: 0,
      amount_paid: 0,
      payment_method,
      warehouse_id,
    },
    orderDetails: [
      {
        product_id: product.product_id,
        quantity,
        price,
        discount,
      },
    ],
  };
}

const orders = Array.from({ length: 1 }, generateRandomOrder);

// Gửi từng đơn hàng qua API
async function postOrders(orders) {
  let successCount = 0;
  let errorCount = 0;
  for (const order of orders) {
    try {
      const res = await fetch(
        "http://localhost:3008/api/v1/orders/with-details",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization:
              "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjoiOWJmMDRiMGQtNjNiZS00NzFjLTgxZGQtYmJlZDMwOWQwNzAwIiwicm9sZSI6InVzZXIiLCJpYXQiOjE3NTQ3MTk5NjksImV4cCI6MTc1NDgwNjM2OX0.1CNS34Jstk6OEOqR6qzju9bDRtV7qjHFTcwaa1rBQDA",
          },
          body: JSON.stringify(order),
        }
      );

      if (!res.ok) {
        const errorData = await res.text();
        //console.error("❌ Lỗi gửi đơn hàng:", errorData);
      } else {
        const data = await res.json();
        successCount++;
        //console.log("✅ Đơn hàng đã tạo:", data);
      }
    } catch (error) {
      errorCount++;
      //console.error("❌ Lỗi kết nối:", error.message);
    }
  }
  //console.log("🎉 Tổng kết:");
  //console.log(`✅ Đã tạo thành công: ${successCount} đơn`);
  //console.log(`❌ Thất bại: ${errorCount} đơn`);
}

// Gọi thực hiện
postOrders(orders);


