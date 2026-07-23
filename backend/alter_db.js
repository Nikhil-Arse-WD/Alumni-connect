require('dotenv').config();
const db = require("./src/config/db");

db.query(
  "ALTER TABLE banner_requests ADD COLUMN expires_at DATETIME",
  (err, results) => {
    if (err) {
      if (err.code === "ER_DUP_FIELDNAME") {
        console.log("Column 'expires_at' already exists.");
      } else {
        console.error("Error altering table:", err);
      }
    } else {
      console.log("Successfully added 'expires_at' column.");
    }
    process.exit(0);
  }
);
