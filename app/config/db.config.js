// const mysql = require("mysql2"); // Using mysql2 for better compatibility

// const connection = mysql.createConnection({
//   host: process.env.DB_HOST,
//   user: process.env.DB_USER,
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   // Optional: Connection pool settings
//   // connectionLimit: 10,
//   // queueLimit: 0
// });

// // Open the MySQL connection
// connection.connect(error => {
//   if (error) {
//     //console.error('Database connection failed:', error.message);
//     // Don't throw here - better to handle gracefully
//     return;
//   }
//   //console.log("Successfully connected to the database.");
// });

// // Ping database to check for common exception errors on startup
// connection.query('SELECT 1', (err) => {
//   if (err) {
//     //console.error('Database ping failed:', err.message);
//   }
// });

// // Handle unexpected disconnects
// connection.on('error', (err) => {
//   //console.error('Database error:', err);
//   if (err.code === 'PROTOCOL_CONNECTION_LOST') {
//     //console.error('Database connection was closed.');
//   } else if (err.code === 'ER_CON_COUNT_ERROR') {
//     //console.error('Database has too many connections.');
//   } else if (err.code === 'ECONNREFUSED') {
//     //console.error('Database connection was refused.');
//   }
// });

// module.exports = connection;

const mysql = require("mysql2"); // Using mysql2 for better compatibility

// Sử dụng Connection Pool thay vì một kết nối đơn.
// Đây là cách tốt nhất để xử lý lỗi ECONNRESET do timeout.
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true, // Nếu không có kết nối nào có sẵn, đợi cho đến khi có
  connectionLimit: 10, // Giới hạn số lượng kết nối tối đa trong pool
  queueLimit: 0, // Giới hạn hàng đợi cho các request nếu connectionLimit đạt đến. 0 là không giới hạn.
  // Optional: Cấu hình thêm để quản lý kết nối hiệu quả hơn và tránh ECONNRESET
  // acquireTimeout: 10000, // Thời gian chờ (ms) để có được một kết nối từ pool
  // enableKeepAlive: true, // Giữ kết nối hoạt động. (Thường được xử lý bởi pool nội bộ)
  // keepAliveInitialDelay: 0, // Không cần thiết nếu pool đã quản lý tự động reconnect
  // idleTimeout: 60000 // Thêm nếu thư viện pool hỗ trợ đóng kết nối idle sau X ms
});

// Kiểm tra kết nối pool khi khởi động ứng dụng
pool.getConnection((err, connection) => {
  if (err) {
    console.error("Database pool connection failed:", err.message);
    // Đây là lỗi nghiêm trọng, bạn có thể muốn thoát ứng dụng hoặc thông báo lỗi rõ ràng
    // process.exit(1); // Thoát ứng dụng nếu không thể kết nối DB
    return;
  }
  console.log("Successfully connected to the database using connection pool.");
  connection.release(); // Luôn giải phóng kết nối về pool sau khi kiểm tra
});

// Xử lý lỗi từ pool (ví dụ: mất kết nối toàn bộ pool, lỗi cấu hình)
pool.on("error", (err) => {
  //console.error("Database pool error:", err);
  if (err.code === "PROTOCOL_CONNECTION_LOST") {
    //console.error("Database connection in pool was lost.");
    // Logic để thử tái kết nối hoặc thông báo cho admin
  } else if (err.code === "ER_CON_COUNT_ERROR") {
    //console.error("Database has too many connections in the pool.");
  } else if (err.code === "ECONNREFUSED") {
    //console.error("Database connection refused by server.");
  }
  // Các lỗi khác có thể xảy ra trong quá trình quản lý pool
});

module.exports = pool; // Export pool thay vì direct connection
