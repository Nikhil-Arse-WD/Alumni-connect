const mysql = require("mysql2/promise");

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

(async () => {
  try {
    const connection = await db.getConnection();
    console.log("MySQL Pool Connected ✅");
    connection.release();
  } catch (err) {
    console.error("DB Pool Connection Error:", err);
  }
})();

module.exports = db;
