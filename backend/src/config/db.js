const mysql = require("mysql2");

// =====================================
// MYSQL CONNECTION for multiple user base 
// =====================================
const db = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10, // Adjust based on your server capacity
  queueLimit: 0
});

db.getConnection((err, connection) => {
  if (err) { 
    console.error("DB Pool Connection Error:", err); 
    return; 
  }
  // Release the connection back to the pool immediately after a successful test
  if (connection) connection.release();
  console.log("MySQL Pool Connected ✅");
});

module.exports = db;
