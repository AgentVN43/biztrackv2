const mysql = require("mysql2"); // Using mysql2 for better compatibility

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  // Optional: Connection pool settings
  // connectionLimit: 10,
  // queueLimit: 0
});

// Open the MySQL connection
connection.connect(error => {
  if (error) {
    console.error('Database connection failed:', error.message);
    // Don't throw here - better to handle gracefully
    return;
  }
  console.log("Successfully connected to the database.");
});

// Ping database to check for common exception errors on startup
connection.query('SELECT 1', (err) => {
  if (err) {
    console.error('Database ping failed:', err.message);
  }
});

// Handle unexpected disconnects
connection.on('error', (err) => {
  console.error('Database error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.error('Database connection was closed.');
  } else if (err.code === 'ER_CON_COUNT_ERROR') {
    console.error('Database has too many connections.');
  } else if (err.code === 'ECONNREFUSED') {
    console.error('Database connection was refused.');
  }
});

module.exports = connection;