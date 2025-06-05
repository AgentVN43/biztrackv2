// Thêm đoạn code này vào đầu file app.js hoặc server.js của bạn
process.on('uncaughtException', (err) => {
  console.error('🔥 Lỗi không được xử lý (Uncaught Exception):', err);
  // Quan trọng: Tùy chọn thoát tiến trình sau khi log lỗi
  // process.exit(1); 
  // Trong môi trường phát triển, bạn có thể không muốn thoát ngay để debug
  // Trong môi trường production, thường nên thoát để tránh trạng thái không ổn định
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 Lỗi Promise không được xử lý (Unhandled Rejection):', reason, promise);
  // Tùy chọn thoát tiến trình
  // process.exit(1);
});

const express = require("express");
const cors = require("cors");
require("dotenv").config({ path: ".env.local" });

const app = express();
const port = process.env.PORT || 3008;

const corsOptions = {
  origin: "http://localhost:5173", // Thay đổi thành domain của client nếu cần
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true, // Cho phép cookie được gửi
  optionsSuccessStatus: 204, // Một số trình duyệt cũ (IE11, các trình duyệt cũ) không hỗ trợ 204
};
// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
require("./app/routes")(app);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

// Start server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

module.exports = app; // For testing purposes



