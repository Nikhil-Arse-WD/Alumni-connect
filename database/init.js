require("dotenv").config();
const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("uploads/events")) fs.mkdirSync("uploads/events", { recursive: true });
if (!fs.existsSync("uploads/event-gallery")) fs.mkdirSync("uploads/event-gallery", { recursive: true });
if (!fs.existsSync("uploads/banners")) fs.mkdirSync("uploads/banners", { recursive: true });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// const rateLimit = require("express-rate-limit");

// // 1. General limiter: Increased to 1500 requests per 15 mins
// // (This safely allows your 5-second polling + normal app navigation)
// const generalLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 15000, // <-- INCREASED FROM 100 TO 1500
//   handler: (req, res) => {
//     // FORCE JSON RESPONSE
//     res.status(429).json({ success: false, message: "Too many requests from this IP, please try again after 15 minutes" });
//   }
// });

// // 2. Strict limiter specifically for Login and Payment routes to prevent brute-forcing
// const strictLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000, 
//   max: 10, // Only 10 attempts allowed
//   handler: (req, res) => {
//     // FORCE JSON RESPONSE
//     res.status(429).json({ success: false, message: "Too many attempts, please try again later." });
//   }
// });

// // Apply general limiter to all routes
// app.use(generalLimiter);

// // Apply strict limiter ONLY to sensitive routes
// // Note: These routes will hit BOTH limiters, but the strict one (10 max) will trigger first.
// app.use("/login", strictLimiter);
// app.use("/admin/login", strictLimiter);
// app.use("/pay/initiate", strictLimiter);
// ── 1. PROFILE PHOTOS STORAGE (UPDATED) ──
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ── 2. EVENT COVER PHOTOS STORAGE (UPDATED) ──
const eventStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/events"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadEvent = multer({ storage: eventStorage });

// ── 3. EVENT GALLERY STORAGE (ALREADY GOOD - KEPT CLEAN) ──
const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/event-gallery"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadGallery = multer({ storage: galleryStorage });

// ── 4. BANNER AD STORAGE (ALREADY GOOD - KEPT CLEAN) ──
const bannerStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/banners"),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const uploadBanner = multer({ storage: bannerStorage });
// ── Helper: notification insert
const sendNotification = (alumni_id, title, message, type = "general") => {
  db.query(
    `INSERT INTO notifications (alumni_id, title, message, type) VALUES (?, ?, ?, ?)`,
    [alumni_id, title, message, type],
    (err) => { if (err) console.log("Notification Error:", err); }
  );
};

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

// =====================================
// SETUP NODEMAILER TRANSPORTER
// =====================================
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── REUSABLE EMAIL FUNCTION ──
const sendWelcomeEmail = async (userEmail, fullName, tempPassword) => {
  const mailOptions = {
    from: `"SVIMAA" <${process.env.EMAIL_USER}>`,
    to: userEmail,
    subject: "Welcome to SVIMAA  Alumni Connect! 🎓",
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #E2E8F0; border-radius: 10px;">
        <h2 style="color: #4F46E5;">Welcome to the SVIMAA Family, ${fullName}!</h2>
        <p style="color: #475569; font-size: 16px;">
          Thank you for registering with the Shri Vaishnav Institute of Management Alumni Association (SVIMAA). We are thrilled to have you!
        </p>
        <div style="background-color: #F8FAFC; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #0F172A;">Your Login Credentials:</h3>
          <p style="margin: 5px 0;"><strong>Email:</strong> ${userEmail}</p>
          <p style="margin: 5px 0;"><strong>Temporary Password:</strong> ${tempPassword}</p>
        </div>
        <p style="color: #DC2626; font-weight: bold; font-size: 14px;">
          ⚠️ For your security, you will be required to change this temporary password immediately upon your first login.
        </p>
        <p style="color: #475569; font-size: 16px; margin-top: 30px;">
          Best Regards,<br/>
          <strong>SVIMAA Admin Team</strong>
        </p>
      </div>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Welcome email successfully sent to ${userEmail}`);
  } catch (error) {
    console.error(`Failed to send email to ${userEmail}:`, error);
  }
};

app.get("/", (req, res) => res.send("API Running ✅"));

// =====================================
// REGISTER (With Retry Logic & Strict Mode)
// =====================================
app.post("/register", upload.single("profile_photo"), async (req, res) => {
  try {
    const {
      full_name, mobile, email, gender, dob, batch_year, programme,
      employment_type, organisation, designation, years_of_experience,
      industry, married, spouse_name, anniversary_date, address, city,
      country, payment_status,
    } = req.body;

    db.query("SELECT id, payment_status, receipt_number, member_id FROM alumni_members WHERE email = ?", [email], async (err, existingUsers) => {
      if (err) return res.status(500).json({ success: false, message: "Database Error", error: err });

      const profile_photo = req.file ? req.file.filename : null;

      // Abandoned Cart Logic
      if (existingUsers.length > 0) {
        const user = existingUsers[0];

        if (user.payment_status === "YES") {
          return res.status(400).json({ success: false, message: "This email is already registered and paid. Please login." });
        }

        const sqlUpdate = `
          UPDATE alumni_members SET 
            full_name=?, mobile=?, gender=?, dob=?, batch_year=?, programme=?, 
            ${profile_photo ? "profile_photo=?," : ""} 
            employment_type=?, organisation=?, designation=?, years_of_experience=?, 
            industry=?, married=?, spouse_name=?, anniversary_date=?, address=?, city=?, country=?
          WHERE email=?
        `;
        
        const updateParams = profile_photo 
          ? [full_name, mobile, gender, dob, batch_year, programme || null, profile_photo, employment_type || null, organisation || null, designation || null, years_of_experience || null, industry || null, married || "NO", spouse_name || null, anniversary_date || null, address || null, city || null, country || null, email]
          : [full_name, mobile, gender, dob, batch_year, programme || null, employment_type || null, organisation || null, designation || null, years_of_experience || null, industry || null, married || "NO", spouse_name || null, anniversary_date || null, address || null, city || null, country || null, email];

        db.query(sqlUpdate, updateParams, (updateErr) => {
          if (updateErr) return res.status(500).json({ success: false, message: "Failed to update existing record" });
          return res.json({ success: true, message: "Record updated, ready for payment ✅", member_id: user.member_id, receipt_number: user.receipt_number });
        });
        return; // Exits the function so it doesn't try to insert a new user below
      }

      // New User Logic
      const member_id = "ALUMNI" + Date.now();
      const receipt_number = "RCPT" + Math.floor(100000 + Math.random() * 900000);
      const password = await bcrypt.hash(receipt_number, 10);

      const sqlInsert = `
        INSERT INTO alumni_members (
          full_name, mobile, email, gender, dob, batch_year, programme, profile_photo,
          password, employment_type, organisation, designation, years_of_experience,
          industry, married, spouse_name, anniversary_date, address, city, country,
          payment_status, member_id, receipt_number
        ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
      `;

      db.query(sqlInsert, [
        full_name, mobile, email, gender, dob, batch_year, programme || null, profile_photo,
        password, employment_type || null, organisation || null, designation || null, years_of_experience || null,
        industry || null, married || "NO", spouse_name || null, anniversary_date || null,
        address || null, city || null, country || null, payment_status || "NO", member_id, receipt_number,
      ], (insertErr) => {
        if (insertErr) return res.status(500).json({ success: false, message: "Database Error" });
        res.json({ success: true, message: "Registration Saved ✅", member_id, receipt_number });
      });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error: error.message });
  }
});

// =====================================
// SECURE LOGIN
// =====================================
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM alumni_members WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Server Error" });
    if (result.length === 0) return res.status(401).json({ success: false, message: "Email not found" });
    
    const user = result[0];

    // ---> RESTRICT UNPAID LOGINS <---
    if (user.payment_status !== "YES") {
      return res.status(402).json({ 
        success: false, 
        message: "Membership payment pending. Please complete your registration payment to activate your account." 
      });
    }

    let isMatch = false;
// Wrapping in String() guarantees bcrypt won't crash if the password is numbers only
try { isMatch = await bcrypt.compare(String(password), String(user.password)); } catch (e) { isMatch = false; }
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });
    
    res.json({
      success: true, message: "Login Successful ✅",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        profile_photo: user.profile_photo,
        role: user.role || "user",
        is_password_changed: user.is_password_changed,
      },
      token: "123",
    });
  });
});
// =====================================
// CHANGE PASSWORD
// =====================================
app.post("/change-password", async (req, res) => {
  const { email, current_password, new_password, confirm_password } = req.body;

  if (!email || !current_password || !new_password || !confirm_password) {
    return res.status(400).json({ success: false, message: "All fields are required" });
  }
  if (new_password !== confirm_password) {
    return res.status(400).json({ success: false, message: "New password and confirm password do not match" });
  }
  if (new_password.length < 6) {
    return res.status(400).json({ success: false, message: "New password must be at least 6 characters" });
  }
  if (new_password === current_password) {
    return res.status(400).json({ success: false, message: "New password must be different from current password" });
  }

  db.query("SELECT * FROM alumni_members WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Server Error" });
    if (result.length === 0) return res.status(404).json({ success: false, message: "User not found" });

    const user = result[0];

    let isMatch = false;
    try {
      isMatch = await bcrypt.compare(current_password, user.password);
    } catch (e) {
      isMatch = false;
    }
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect" });
    }

    try {
      const hashedPassword = await bcrypt.hash(new_password, 10);
      db.query(
        "UPDATE alumni_members SET password = ?, is_password_changed = 1 WHERE email = ?",
        [hashedPassword, email],
        (err2) => {
          if (err2) return res.status(500).json({ success: false, message: "Failed to update password" });
          res.json({ success: true, message: "Password changed successfully ✅" });
        }
      );
    } catch (e) {
      res.status(500).json({ success: false, message: "Error hashing password" });
    }
  });
});

// =====================================
// MEMBER ROUTES
// =====================================
app.get("/member/:email", (req, res) => {
  db.query("SELECT * FROM alumni_members WHERE email = ?", [req.params.email], (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result[0] });
  });
});

app.put("/member/update/:email", upload.single("profile_photo"), (req, res) => {
  const {
    full_name, mobile, city, country, designation, organisation,
    address, employment_type, years_of_experience, industry,
    married, spouse_name, anniversary_date,
  } = req.body;

  db.query("SELECT profile_photo FROM alumni_members WHERE email = ?", [req.params.email], (err, rows) => {
    if (err) return res.status(500).json({ success: false });

    const oldPhoto   = rows[0]?.profile_photo || null;
    const newPhoto   = req.file ? req.file.filename : oldPhoto;

    db.query(
      `UPDATE alumni_members SET
        full_name=?, mobile=?, city=?, country=?,
        designation=?, organisation=?, address=?,
        employment_type=?, years_of_experience=?, industry=?,
        married=?, spouse_name=?, anniversary_date=?,
        profile_photo=?
       WHERE email=?`,
      [
        full_name, mobile, city || null, country || null,
        designation || null, organisation || null, address || null,
        employment_type || null, years_of_experience || null, industry || null,
        married || "NO", spouse_name || null, anniversary_date || null,
        newPhoto, req.params.email,
      ],
      (err2) => {
        if (err2) return res.status(500).json({ success: false, message: "Database Error" });
        res.json({ success: true, message: "Profile Updated Successfully ✅" });
      }
    );
  });
});

// =====================================
// ALUMNI ROUTES
// =====================================
app.get("/alumni", (req, res) => {
  const { programme, batch_year, city, industry, organisation, search } = req.query;
  let sql = `
    SELECT id, full_name, profile_photo, batch_year, programme, city, industry,
      CASE WHEN show_organisation = 1 THEN organisation ELSE NULL END AS organisation, designation
    FROM alumni_members WHERE approved = 1
  `;
  const values = [];
  if (programme)    { sql += " AND programme = ?";    values.push(programme); }
  if (batch_year)   { sql += " AND batch_year = ?";   values.push(batch_year); }
  if (city)         { sql += " AND city = ?";         values.push(city); }
  if (industry)     { sql += " AND industry = ?";     values.push(industry); }
  if (organisation) { sql += " AND organisation = ?"; values.push(organisation); }
  if (search)       { sql += " AND full_name LIKE ?"; values.push(`%${search}%`); }
  db.query(sql, values, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.get("/alumni/profile/:id", (req, res) => {
  const sql = `
    SELECT id, full_name, profile_photo, programme, batch_year, city, country, designation, industry,
      CASE WHEN show_email = 1 THEN email ELSE NULL END AS email,
      CASE WHEN show_mobile = 1 THEN mobile ELSE NULL END AS mobile,
      CASE WHEN show_organisation = 1 THEN organisation ELSE NULL END AS organisation
    FROM alumni_members WHERE id = ? AND approved = 1
  `;
  db.query(sql, [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result[0] });
  });
});

app.put("/privacy/:email", (req, res) => {
  const { show_email, show_mobile, show_organisation } = req.body;
  db.query(
    "UPDATE alumni_members SET show_email=?, show_mobile=?, show_organisation=? WHERE email=?",
    [show_email, show_mobile, show_organisation, req.params.email],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, message: "Privacy updated" });
    }
  );
});

// =====================================
// FORUM ROUTES
// =====================================
app.post("/forum/create", (req, res) => {
  const { user_id, category, subject, body, image } = req.body;
  db.query(
    "INSERT INTO forum_posts (user_id, category, subject, body, image) VALUES (?, ?, ?, ?, ?)",
    [user_id, category, subject, body, image || null],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: "Database Error" });
      res.json({ success: true, message: "Post Created ✅" });
    }
  );
});

app.get("/forum/posts", (req, res) => {
  const user_id = req.query.user_id || null;
  const escapedId = user_id ? db.escape(user_id) : null;

  const sql = `
    SELECT 
      forum_posts.*, 
      alumni_members.full_name, 
      alumni_members.profile_photo,
      alumni_members.programme, 
      alumni_members.batch_year,
      ${escapedId
        ? `(SELECT COUNT(*) FROM forum_likes fl WHERE fl.post_id = forum_posts.id AND fl.user_id = ${escapedId}) AS liked_by_user,
           (SELECT COUNT(*) FROM forum_reports fr WHERE fr.post_id = forum_posts.id AND fr.reported_by = ${escapedId}) AS reported_by_user`
        : `0 AS liked_by_user, 0 AS reported_by_user`
      }
    FROM forum_posts
    JOIN alumni_members ON forum_posts.user_id = alumni_members.id
    WHERE forum_posts.status = 'ACTIVE'
    ORDER BY forum_posts.id DESC
  `;

  db.query(sql, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.post("/forum/like", (req, res) => {
  const { post_id, user_id } = req.body;
  db.query("SELECT * FROM forum_likes WHERE post_id=? AND user_id=?", [post_id, user_id], (err, result) => {
    if (result.length > 0) {
      db.query("DELETE FROM forum_likes WHERE post_id=? AND user_id=?", [post_id, user_id]);
      db.query("UPDATE forum_posts SET likes_count = likes_count - 1 WHERE id=?", [post_id]);
      return res.json({ liked: false });
    }
    db.query("INSERT INTO forum_likes (post_id, user_id) VALUES (?,?)", [post_id, user_id]);
    db.query("UPDATE forum_posts SET likes_count = likes_count + 1 WHERE id=?", [post_id]);
    res.json({ liked: true });
  });
});

app.post("/forum/reply", (req, res) => {
  const { post_id, user_id, reply } = req.body;
  db.query("INSERT INTO forum_replies (post_id, user_id, reply) VALUES (?, ?, ?)", [post_id, user_id, reply], (err) => {
    if (err) return res.status(500).json({ success: false });
    db.query("UPDATE forum_posts SET replies_count = replies_count + 1 WHERE id=?", [post_id]);
    res.json({ success: true, message: "Reply Added ✅" });
  });
});

app.get("/forum/replies/:postId", (req, res) => {
  const sql = `
    SELECT forum_replies.*, alumni_members.full_name, alumni_members.profile_photo
    FROM forum_replies JOIN alumni_members ON forum_replies.user_id = alumni_members.id
    WHERE post_id = ? ORDER BY forum_replies.id DESC
  `;
  db.query(sql, [req.params.postId], (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.post("/forum/report", (req, res) => {
  const { post_id, reported_by, reason } = req.body;
  db.query("SELECT * FROM forum_reports WHERE post_id=? AND reported_by=?", [post_id, reported_by], (err, result) => {
    if (err) return res.status(500).json({ success: false });
    if (result.length > 0) return res.json({ success: false, message: "You already reported this post" });
    db.query("INSERT INTO forum_reports (post_id, reported_by, reason) VALUES (?,?,?)", [post_id, reported_by, reason], (err2) => {
      if (err2) return res.status(500).json({ success: false });
      db.query("UPDATE forum_posts SET reports_count = reports_count + 1 WHERE id=?", [post_id]);
      res.json({ success: true, message: "Post reported successfully" });
    });
  });
});

app.get("/forum/count/:userId", (req, res) => {
  const userId = req.params.userId;
  db.query(
    `SELECT seen_at FROM forum_user_seen WHERE user_id = ?`,
    [userId],
    (err, result) => {
      if (err) {
        console.log("forum/count DB error:", err);
        return res.status(500).json({ success: false, count: 0 });
      }

      if (result.length === 0) {
        db.query(
          `INSERT INTO forum_user_seen (user_id, seen_at) VALUES (?, '2000-01-01 00:00:00')`,
          [userId],
          () => {}
        );

        db.query(
          `SELECT COUNT(*) AS count FROM forum_posts
           WHERE status = 'ACTIVE' AND user_id != ?`,
          [userId],
          (err2, r) => {
            if (err2) return res.json({ success: true, count: 0 });
            console.log(`[forum/count] userId=${userId} firstTime count=${r[0].count}`);
            return res.json({ success: true, count: r[0].count });
          }
        );
        return;
      }

      const seenAt = result[0].seen_at;
      console.log(`[forum/count] userId=${userId} seenAt=${seenAt}`);

      db.query(
        `SELECT COUNT(*) AS count FROM forum_posts
         WHERE status = 'ACTIVE'
           AND user_id != ?
           AND created_at > ?`,
        [userId, seenAt],
        (err2, r) => {
          if (err2) return res.json({ success: true, count: 0 });
          console.log(`[forum/count] count=${r[0].count}`);
          res.json({ success: true, count: r[0].count });
        }
      );
    }
  );
});

app.post("/forum/seen/:userId", (req, res) => {
  db.query(
    `INSERT INTO forum_user_seen (user_id, seen_at)
     VALUES (?, NOW())
     ON DUPLICATE KEY UPDATE seen_at = NOW()`,
    [req.params.userId],
    (err) => {
      if (err) {
        console.log("forum/seen error:", err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true });
    }
  );
});

// =====================================
// NOTIFICATIONS
// =====================================
app.get("/notifications/unread-count/:alumni_id", (req, res) => {
  db.query(
    `SELECT COUNT(*) as count FROM notifications WHERE alumni_id = ? AND is_read = 0`,
    [req.params.alumni_id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, count: result[0].count });
    }
  );
});

app.patch("/notifications/mark-read/:userId", (req, res) => {
  db.query(
    "UPDATE notifications SET is_read = 1 WHERE alumni_id = ?",
    [req.params.userId],
    (err) => {
      if (err) return res.status(500).json({ success: false, error: err.message });
      res.json({ success: true });
    }
  );
});

app.get("/notifications/:alumni_id", (req, res) => {
  db.query(
    `SELECT * FROM notifications WHERE alumni_id = ? ORDER BY id DESC LIMIT 30`,
    [req.params.alumni_id],
    (err, result) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, data: result });
    }
  );
});

app.put("/notifications/read/:alumni_id", (req, res) => {
  db.query(
    `UPDATE notifications SET is_read = 1 WHERE alumni_id = ?`,
    [req.params.alumni_id],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true });
    }
  );
});

// =====================================
// JOBS ROUTES
// =====================================
app.post("/jobs/create", (req, res) => {
  const { title, company, location, experience_range, function_name, skills, job_description, apply_url, apply_email, expires_on, posted_by_user_id } = req.body;
  if (!title || !company || !location || !job_description) return res.status(400).json({ success: false, message: "Required fields missing" });
  if (!posted_by_user_id) return res.status(400).json({ success: false, message: "User not logged in" });
  db.query(
    `INSERT INTO jobs (title, company, location, experience_range, function_name, skills, job_description, apply_url, apply_email, expires_on, posted_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [title, company, location, experience_range||null, function_name||null, skills||null, job_description, apply_url||null, apply_email||null, expires_on||"2026-12-31", posted_by_user_id],
    (err) => {
      if (err) { console.log("CREATE JOB ERROR:", err); return res.status(500).json({ success: false }); }
      res.json({ success: true, message: "Job posted successfully" });
    }
  );
});

app.get("/jobs", (req, res) => {
  const { search="", location="", experience="", function_name="" } = req.query;
  let sql = `
    SELECT jobs.*, alumni_members.full_name AS posted_by_name, alumni_members.profile_photo AS posted_by_photo
    FROM jobs LEFT JOIN alumni_members ON jobs.posted_by_user_id = alumni_members.id WHERE 1=1
  `;
  const values = [];
  if (search)        { sql += " AND (jobs.title LIKE ? OR jobs.company LIKE ? OR jobs.skills LIKE ?)"; values.push(`%${search}%`,`%${search}%`,`%${search}%`); }
  if (location)      { sql += " AND jobs.location LIKE ?"; values.push(`%${location}%`); }
  if (experience)    { sql += " AND jobs.experience_range = ?"; values.push(experience); }
  if (function_name) { sql += " AND jobs.function_name = ?"; values.push(function_name); }
  sql += " ORDER BY jobs.is_featured DESC, jobs.id DESC";
  db.query(sql, values, (err, result) => {
    if (err) { console.log("GET JOBS ERROR:", err); return res.status(500).json({ success: false }); }
    res.json({ success: true, jobs: result });
  });
});

app.put("/jobs/:id", (req, res) => {
  const { title, company, location, experience_range, function_name, skills, job_description, apply_url, apply_email, expires_on } = req.body;
  db.query(
    `UPDATE jobs SET title=?, company=?, location=?, experience_range=?, function_name=?, skills=?, job_description=?, apply_url=?, apply_email=?, expires_on=? WHERE id=?`,
    [title, company, location, experience_range||null, function_name||null, skills||null, job_description, apply_url||null, apply_email||null, expires_on||null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, message: "Job updated successfully" });
    }
  );
});

app.patch("/jobs/:id/close", (req, res) => {
  db.query("UPDATE jobs SET is_closed = 1 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.patch("/jobs/:id/feature", (req, res) => {
  db.query("UPDATE jobs SET is_featured = NOT is_featured WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.patch("/jobs/:id/flag", (req, res) => {
  db.query("UPDATE jobs SET is_flagged = NOT is_flagged WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.delete("/jobs/:id", (req, res) => {
  db.query("DELETE FROM jobs WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// =====================================
// ADMIN ROUTES
// =====================================
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM admins WHERE email = ?", [email], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "DB Error" });
    if (!result || result.length === 0) return res.status(401).json({ success: false, message: "Invalid email" });
    const admin = result[0];
    if (password !== admin.password) return res.status(401).json({ success: false, message: "Invalid password" });
    return res.json({
      success: true,
      message: "Login success",
      token: "dummy-admin-token",
      admin: {
        id: admin.id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    });
  });
});

app.post("/admin/create-event", uploadEvent.single("cover_photo"), (req, res) => {
  const { title, description, venue, event_date, event_time, capacity,status } = req.body;
  const cover_photo = req.file ? `/uploads/events/${req.file.filename}` : null;
  db.query(
    "INSERT INTO events (title, description, venue, event_date, event_time, capacity, cover_photo,status) VALUES (?, ?, ?, ?, ?, ?, ?,?)",
    [title, description, venue, event_date, event_time, capacity, cover_photo,status],
    (err) => {
      if (err) return res.json({ success: false, message: "Database Error" });
      res.json({ success: true, message: "Event Created Successfully", token: "321" });
    }
  );
});

app.get("/events", (req, res) => {
  db.query("SELECT * FROM events ORDER BY event_date DESC", (err, result) => {
    if (err) return res.json({ success: false, message: "Database Error" });
    res.json({ success: true, events: result });
  });
});

app.post("/admin/add-gallery", uploadGallery.single("photo"), (req, res) => {
  const { event_id } = req.body;
  const photo_url = req.file ? `/uploads/event-gallery/${req.file.filename}` : null;
  db.query("INSERT INTO event_gallery (event_id, photo_url) VALUES (?, ?)", [event_id, photo_url], (err) => {
    if (err) return res.json({ success: false });
    res.json({ success: true, message: "Gallery Added" });
  });
});

app.get("/event-gallery/:event_id", (req, res) => {
  db.query("SELECT * FROM event_gallery WHERE event_id = ?", [req.params.event_id], (err, result) => {
    if (err) return res.json({ success: false, message: "Database Error" });
    res.json({ success: true, gallery: result });
  });
});

app.post("/rsvp", (req, res) => {
  const { event_id, alumni_id, response } = req.body;
  db.query("SELECT * FROM event_rsvp WHERE event_id=? AND alumni_id=?", [event_id, alumni_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database Error" });
    if (result.length > 0) {
      db.query("UPDATE event_rsvp SET response=?, responded_at=CURRENT_TIMESTAMP WHERE event_id=? AND alumni_id=?", [response, event_id, alumni_id], (err2) => {
        if (err2) return res.status(500).json({ success: false });
        return res.json({ success: true, message: "RSVP Updated ✅" });
      });
    } else {
      db.query("INSERT INTO event_rsvp (event_id, alumni_id, response) VALUES (?, ?, ?)", [event_id, alumni_id, response], (err3) => {
        if (err3) return res.status(500).json({ success: false });
        res.json({ success: true, message: "RSVP Saved ✅" });
      });
    }
  });
});

app.get("/rsvp/:alumni_id", (req, res) => {
  const sql = `
    SELECT event_rsvp.rsvp_id, event_rsvp.response, event_rsvp.responded_at,
      events.event_id, events.title, events.description, events.cover_photo,
      events.event_date, events.event_time, events.venue,
      alumni_members.full_name
    FROM event_rsvp
    INNER JOIN events ON events.event_id = event_rsvp.event_id
    INNER JOIN alumni_members ON alumni_members.id = event_rsvp.alumni_id
    WHERE event_rsvp.alumni_id = ? ORDER BY event_rsvp.rsvp_id DESC
  `;
  db.query(sql, [req.params.alumni_id], (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Database Error" });
    res.json({ success: true, rsvps: result });
  });
});

app.get("/rsvp/summary/:event_id", (req, res) => {
  db.query("SELECT response, COUNT(*) as count FROM event_rsvp WHERE event_id=? GROUP BY response", [req.params.event_id], (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.delete("/admin/delete-event/:id", (req, res) => {
  db.query("DELETE FROM events WHERE event_id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false, message: "Database Error" });
    res.status(200).json({ success: true, message: "Event Deleted Successfully" });
  });
});

app.put("/admin/update-event/:id", upload.single("cover_photo"), (req, res) => {
  const { id } = req.params;
  const { title, description, venue, event_date, event_time, capacity, status } = req.body;
  db.query("SELECT * FROM events WHERE event_id=?", [id], (err, oldData) => {
    if (err) return res.status(500).json({ success: false });
    let coverPhoto = oldData[0].cover_photo;
    if (req.file) coverPhoto = "/uploads/" + req.file.filename;
    db.query(
      "UPDATE events SET title=?, description=?, venue=?, event_date=?, event_time=?, capacity=?, status=?, cover_photo=? WHERE event_id=?",
      [title, description, venue, event_date, event_time, capacity, status, coverPhoto, id],
      (err2) => {
        if (err2) return res.status(500).json({ success: false });
        res.status(200).json({ success: true, message: "Event Updated Successfully" });
      }
    );
  });
});

app.post("/admin/upload-gallery/:id", uploadGallery.array("gallery_images", 20), (req, res) => {
  const eventId = req.params.id;
  const files = req.files;
  if (!files || files.length === 0) return res.status(400).json({ success: false, message: "No images selected" });
  for (const file of files) {
    db.query("INSERT INTO event_gallery (event_id, photo_url) VALUES (?, ?)", [eventId, `/uploads/event-gallery/${file.filename}`]);
  }
  res.json({ success: true, message: "Gallery Uploaded" });
});

app.put("/admin/update-event-status/:id", (req, res) => {
  db.query("UPDATE events SET status=? WHERE event_id=?", [req.body.status, req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Database error" });
    res.json({ success: true });
  });
});

app.put("/events/:id", (req, res) => {
  db.query("UPDATE events SET status=? WHERE event_id=?", [req.body.status, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// =====================================
// CONTRIBUTIONS
// =====================================
app.post("/contributions/lecture", (req, res) => {
  const { alumni_id, topic, description, available_from, available_to, target_batches, mode } = req.body;
  if (!alumni_id || !topic) return res.status(400).json({ success: false, message: "Required fields missing" });
  db.query(
    `INSERT INTO guest_lectures (alumni_id, topic, description, available_from, available_to, target_batches, mode) VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [alumni_id, topic, description||null, available_from||null, available_to||null, target_batches||null, mode||"Both"],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, message: "Lecture submitted for review ✅" });
    }
  );
});

app.get("/contributions/lecture/:alumni_id", (req, res) => {
  db.query(`SELECT * FROM guest_lectures WHERE alumni_id = ? ORDER BY id DESC`, [req.params.alumni_id], (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.post("/contributions/mentor", (req, res) => {
  const { alumni_id, expertise, max_mentees } = req.body;
  if (!alumni_id || !expertise) return res.status(400).json({ success: false, message: "Required fields missing" });
  db.query(`SELECT id FROM mentorships WHERE alumni_id = ?`, [alumni_id], (err, existing) => {
    if (existing && existing.length > 0) {
      db.query(`UPDATE mentorships SET expertise=?, max_mentees=?, is_available=1, status='Pending' WHERE alumni_id=?`, [expertise, max_mentees||3, alumni_id], (err2) => {
        if (err2) return res.status(500).json({ success: false });
        return res.json({ success: true, message: "Mentorship updated ✅" });
      });
    } else {
      db.query(`INSERT INTO mentorships (alumni_id, expertise, max_mentees) VALUES (?, ?, ?)`, [alumni_id, expertise, max_mentees||3], (err2) => {
        if (err2) return res.status(500).json({ success: false });
        res.json({ success: true, message: "Mentorship submitted for review ✅" });
      });
    }
  });
});

app.get("/contributions/mentor/:alumni_id", (req, res) => {
  db.query(`SELECT * FROM mentorships WHERE alumni_id = ?`, [req.params.alumni_id], (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result[0] || null });
  });
});

app.get("/mentors", (req, res) => {
  db.query(`SELECT m.*, a.full_name, a.profile_photo, a.designation, a.organisation, a.batch_year FROM mentorships m JOIN alumni_members a ON m.alumni_id = a.id WHERE m.status = 'Approved' AND m.is_available = 1 ORDER BY m.id DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.post("/mentorship/request", (req, res) => {
  const { mentor_id, requester_id, message } = req.body;
  db.query(`INSERT INTO mentorship_requests (mentor_id, requester_id, message) VALUES (?, ?, ?)`, [mentor_id, requester_id, message||null], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, message: "Request sent ✅" });
  });
});

app.post("/contributions/donate", (req, res) => {
  const { alumni_id, donation_type, amount, equipment_description, scholarship_description, message } = req.body;
  if (!alumni_id || !donation_type) return res.status(400).json({ success: false, message: "Required fields missing" });
  
  const receipt_number = donation_type === "Money" ? "DON-" + Date.now() + "-" + Math.floor(Math.random() * 9000 + 1000) : null;
  
  db.query(
    `INSERT INTO donations (alumni_id, donation_type, amount, equipment_description, scholarship_description, message, receipt_number, payment_status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [alumni_id, donation_type, amount||null, equipment_description||null, scholarship_description||null, message||null, receipt_number, donation_type==="Money"?"Pending":"Paid"],
    (err, result) => { // <--- Notice 'result' is added here!
      if (err) return res.status(500).json({ success: false });
      
      res.json({ 
        success: true, 
        message: "Donation submitted ✅", 
        receipt_number,
        donation_id: result.insertId // <--- Easebuzz needs this ID!
      });
    }
  );
});

app.get("/contributions/donate/:alumni_id", (req, res) => {
  db.query(`SELECT * FROM donations WHERE alumni_id = ? ORDER BY id DESC`, [req.params.alumni_id], (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.get("/contributions/all/:alumni_id", (req, res) => {
  const id = req.params.alumni_id;
  const lQ = new Promise((resolve, reject) => db.query(`SELECT 'lecture' as type, id, topic as title, status, created_at FROM guest_lectures WHERE alumni_id = ? ORDER BY id DESC`, [id], (e,r) => e?reject(e):resolve(r)));
  const mQ = new Promise((resolve, reject) => db.query(`SELECT 'mentor' as type, id, expertise as title, status, created_at FROM mentorships WHERE alumni_id = ? ORDER BY id DESC`, [id], (e,r) => e?reject(e):resolve(r)));
  const dQ = new Promise((resolve, reject) => db.query(
    `SELECT 'donation' as type, id, donation_type as title, status, created_at, amount, receipt_number 
     FROM donations 
     WHERE alumni_id = ? AND (donation_type != 'Money' OR payment_status = 'Paid') 
     ORDER BY id DESC`, 
     [id], (e,r) => e?reject(e):resolve(r)
  ));
  Promise.all([lQ, mQ, dQ])
    .then(([lectures, mentors, donations]) => res.json({ success: true, lectures, mentors, donations }))
    .catch(() => res.status(500).json({ success: false }));
});

app.put("/admin/contribution/:type/:id", (req, res) => {
  const { type, id } = req.params;
  const { status } = req.body;
  const tableMap = { lecture: "guest_lectures", mentor: "mentorships", donation: "donations" };
  const table = tableMap[type];
  if (!table) return res.status(400).json({ success: false, message: "Invalid type" });
  db.query(`UPDATE ${table} SET status = ? WHERE id = ?`, [status, id], (err) => {
    if (err) return res.status(500).json({ success: false });
    if (type === "mentor" && status === "Approved") db.query(`UPDATE mentorships SET is_available = 1 WHERE id = ?`, [id]);
    res.json({ success: true, message: `${type} ${status}` });
  });
});

app.get("/admin/contributions/pending", (req, res) => {
  const lQ = new Promise((resolve, reject) => db.query(`SELECT gl.*, a.full_name, a.profile_photo, 'lecture' as type FROM guest_lectures gl JOIN alumni_members a ON gl.alumni_id = a.id WHERE gl.status = 'Pending' ORDER BY gl.id DESC`, (e,r) => e?reject(e):resolve(r)));
  const mQ = new Promise((resolve, reject) => db.query(`SELECT m.*, a.full_name, a.profile_photo, 'mentor' as type FROM mentorships m JOIN alumni_members a ON m.alumni_id = a.id WHERE m.status = 'Pending' ORDER BY m.id DESC`, (e,r) => e?reject(e):resolve(r)));
  const dQ = new Promise((resolve, reject) => db.query(`SELECT d.*, a.full_name, a.profile_photo, 'donation' as type FROM donations d JOIN alumni_members a ON d.alumni_id = a.id WHERE d.status = 'Pending' ORDER BY d.id DESC`, (e,r) => e?reject(e):resolve(r)));
  Promise.all([lQ, mQ, dQ]).then(([lectures, mentors, donations]) => res.json({ success: true, lectures, mentors, donations, total: lectures.length+mentors.length+donations.length })).catch(() => res.status(500).json({ success: false }));
});

app.get("/admin/contributions/lectures", (req, res) => {
  db.query(`SELECT gl.*, a.full_name, a.profile_photo, a.batch_year, a.designation FROM guest_lectures gl JOIN alumni_members a ON gl.alumni_id = a.id ORDER BY gl.id DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.get("/admin/contributions/mentors", (req, res) => {
  db.query(`SELECT m.*, a.full_name, a.profile_photo, a.batch_year, a.designation FROM mentorships m JOIN alumni_members a ON m.alumni_id = a.id ORDER BY m.id DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.get("/admin/contributions/donations", (req, res) => {
  db.query(`SELECT d.*, a.full_name, a.profile_photo FROM donations d JOIN alumni_members a ON d.alumni_id = a.id ORDER BY d.id DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.get("/admin/mentorship/requests", (req, res) => {
  db.query(`SELECT mr.*, mentor.full_name AS mentor_name, mentor.profile_photo AS mentor_photo, mentor.designation AS mentor_designation, req.full_name AS requester_name, req.profile_photo AS requester_photo, req.programme AS requester_programme, m.expertise FROM mentorship_requests mr JOIN alumni_members mentor ON mr.mentor_id = mentor.id JOIN alumni_members req ON mr.requester_id = req.id JOIN mentorships m ON m.alumni_id = mr.mentor_id ORDER BY mr.id DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.put("/admin/mentorship/match/:id", (req, res) => {
  db.query(`UPDATE mentorship_requests SET status = ? WHERE id = ?`, [req.body.status, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, message: `Request ${req.body.status}` });
  });
});

app.get("/admin/stats", (req, res) => {
  const queries = {
    total_members:   `SELECT COUNT(*) as c FROM alumni_members`,
    pending_members: `SELECT COUNT(*) as c FROM alumni_members WHERE approved = 0`,
    total_events:    `SELECT COUNT(*) as c FROM events`,
    active_jobs:     `SELECT COUNT(*) as c FROM jobs WHERE is_closed = 0`,
    total_posts:     `SELECT COUNT(*) as c FROM forum_posts`,
    total_donations: `SELECT SUM(amount) as c FROM donations WHERE status = 'Approved'`,
  };
  const promises = Object.entries(queries).map(([key, sql]) =>
    new Promise((resolve) => db.query(sql, (err, r) => resolve({ key, val: r?.[0]?.c || 0 })))
  );
  Promise.all(promises).then((results) => {
    const data = {};
    results.forEach(({ key, val }) => (data[key] = val));
    res.json({ success: true, data });
  });
});

app.get("/admin/members", (req, res) => {
  db.query(`SELECT * FROM alumni_members ORDER BY id DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.put("/admin/member/approve/:id", (req, res) => {
  const { approved } = req.body;
  db.query(`UPDATE alumni_members SET approved = ? WHERE id = ?`, [approved, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    const msg = approved === 1
      ? { title: "✅ Registration Approved!", message: "Welcome to SVIMAA Alumni Network! Your profile is now live." }
      : { title: "❌ Registration Rejected", message: "Your registration was not approved. Please contact admin." };
    sendNotification(req.params.id, msg.title, msg.message, "general");
    res.json({ success: true });
  });
});

app.delete("/admin/member/:id", (req, res) => {
  db.query(`DELETE FROM alumni_members WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.post("/admin/notifications/bulk", (req, res) => {

  const { title, message, target, batch_year } = req.body;

  let sql = `SELECT id FROM alumni_members WHERE 1=1`;
  let values = [];

  if (target === "Approved Only") {
    sql += ` AND approved = 1`;
  }

  if (target === "Batch Only") {
    sql += ` AND batch_year = ?`;
    values.push(batch_year);
  }

  db.query(sql, values, (err, members) => {

    if (err) {
      console.log(err);
      return res.status(500).json({ success: false });
    }

    members.forEach((m) => {
      sendNotification(
        m.id,
        title,
        message,
        "general"
      );
    });

    db.query(
      `INSERT INTO bulk_notifications
      (title, message, target, batch_year, sent_count)
      VALUES (?, ?, ?, ?, ?)`,
      [
        title,
        message,
        target,
        batch_year || null,
        members.length
      ]
    );

    res.json({
      success: true,
      sent_count: members.length
    });

  });

});

app.get("/admin/notifications/history", (req, res) => {
  db.query(`SELECT * FROM bulk_notifications ORDER BY id DESC LIMIT 20`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.get("/admin/jobs", (req, res) => {
  db.query(`SELECT j.*, a.full_name, a.profile_photo FROM jobs j JOIN alumni_members a ON j.posted_by_user_id = a.id ORDER BY j.is_flagged DESC, j.id DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.put("/admin/jobs/flag/:id", (req, res) => {
  db.query(`UPDATE jobs SET is_flagged = ? WHERE id = ?`, [req.body.is_flagged, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.delete("/admin/jobs/:id", (req, res) => {
  db.query(`DELETE FROM jobs WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.get("/admin/forum/posts", (req, res) => {
  db.query(`SELECT fp.*, a.full_name, a.profile_photo, a.programme, a.batch_year FROM forum_posts fp JOIN alumni_members a ON fp.user_id = a.id ORDER BY fp.reports_count DESC, fp.id DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});

app.put("/admin/forum/post/:id", (req, res) => {
  db.query(`UPDATE forum_posts SET status = ? WHERE id = ?`, [req.body.status, req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.get("/contributions/community", (req, res) => {
  const sql = `
    SELECT 
      d.id,
      d.donation_type,
      d.amount,
      d.equipment_description,
      d.scholarship_description,
      d.message,
      d.created_at,

      a.full_name,
      a.designation,
      a.organisation,
      a.profile_photo

    FROM donations d
    JOIN alumni_members a ON d.alumni_id = a.id

    WHERE d.status = 'Approved'
   

    ORDER BY d.created_at DESC
  `;

  db.query(sql, (err, result) => {
    if (err) {
      return res.json({ success: false });
    }

    res.json({
      success: true,
      data: result,
    });
  });
});

// =====================================
// ADMIN MANAGEMENT ROUTES
// =====================================

// GET all admins
app.get("/admin/admins", (req, res) => {
  db.query(
    `SELECT id, name, email, phone, role, last_login, created_at
     FROM admins ORDER BY id DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, data: result });
    }
  );
});

// POST create admin
app.post("/admin/admins", async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  if (!name || !email || !password)
    return res.status(400).json({ success: false, message: "Name, email and password required" });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      `INSERT INTO admins (name, email, password, phone, role)
       VALUES (?, ?, ?, ?, ?)`,
      [name, email, hashedPassword, phone || null, role || "admin"],
      (err) => {
        if (err) {
          if (err.code === "ER_DUP_ENTRY")
            return res.status(409).json({ success: false, message: "Email already exists" });
          return res.status(500).json({ success: false, message: "Database Error" });
        }
        res.json({ success: true, message: "Admin created ✅" });
      }
    );
  } catch {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// PUT update admin
app.put("/admin/admins/:id", async (req, res) => {
  const { name, email, password, phone, role } = req.body;
  try {
    if (password && password.trim()) {
      const hashedPassword = await bcrypt.hash(password, 10);
      db.query(
        `UPDATE admins SET name=?, email=?, password=?, phone=?, role=? WHERE id=?`,
        [name, email, hashedPassword, phone || null, role, req.params.id],
        (err) => {
          if (err) return res.status(500).json({ success: false });
          res.json({ success: true, message: "Admin updated ✅" });
        }
      );
    } else {
      db.query(
        `UPDATE admins SET name=?, email=?, phone=?, role=? WHERE id=?`,
        [name, email, phone || null, role, req.params.id],
        (err) => {
          if (err) return res.status(500).json({ success: false });
          res.json({ success: true, message: "Admin updated ✅" });
        }
      );
    }
  } catch {
    res.status(500).json({ success: false, message: "Server Error" });
  }
});

// DELETE admin
app.delete("/admin/admins/:id", (req, res) => {
  db.query(`DELETE FROM admins WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, message: "Admin deleted" });
  });
});

app.post("/admin/delete-request", (req, res) => {
  const { requester_id } = req.body;
  db.query(
    `SELECT * FROM admin_delete_requests WHERE requester_id = ? AND status = 'Pending'`,
    [requester_id],
    (err, result) => {
      if (result && result.length > 0)
        return res.json({ success: false, message: "Request already pending" });
      db.query(
        `INSERT INTO admin_delete_requests (requester_id) VALUES (?)`,
        [requester_id],
        (err2) => {
          if (err2) return res.status(500).json({ success: false });
          res.json({ success: true, message: "Delete request sent to Super Admin" });
        }
      );
    }
  );
});


app.get("/admin/delete-requests", (req, res) => {
  db.query(
    `SELECT r.*, a.name, a.email, a.role 
     FROM admin_delete_requests r
     JOIN admins a ON r.requester_id = a.id
     WHERE r.status = 'Pending'
     ORDER BY r.created_at DESC`,
    (err, result) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, data: result });
    }
  );
});


app.put("/admin/delete-request/:id", (req, res) => {
  const { status, requester_id } = req.body; // status: 'Approved' or 'Rejected'
  db.query(
    `UPDATE admin_delete_requests SET status = ? WHERE id = ?`,
    [status, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false });
      if (status === "Approved") {
        db.query(`DELETE FROM admins WHERE id = ?`, [requester_id], (err2) => {
          if (err2) return res.status(500).json({ success: false });
          res.json({ success: true, message: "Admin deleted after approval" });
        });
      } else {
        res.json({ success: true, message: "Request rejected" });
      }
    }
  );
});

// =====================================
// BANNER ROUTES
// =====================================

// ── ALUMNI: naya banner request submit karo ──
app.post("/banner-request", uploadBanner.single("banner_image"), (req, res) => {
  const {
    full_name, email, mobile, organisation_name, banner_title,
    banner_description, website_link, preferred_duration,
    preferred_start_date, additional_notes,
  } = req.body;
 
  if (!full_name || !email || !mobile || !banner_title || !banner_description) {
    return res.status(400).json({ success: false, message: "Required fields missing" });
  }
 
  const banner_image = req.file ? `/uploads/banners/${req.file.filename}` : null;
 
  db.query(
    `INSERT INTO banner_requests
      (full_name, email, mobile, organisation_name, banner_title, banner_description,
       website_link, preferred_duration, preferred_start_date, additional_notes, banner_image)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      full_name, email, mobile, organisation_name || null, banner_title, banner_description,
      website_link || null, preferred_duration || null, preferred_start_date || null,
      additional_notes || null, banner_image,
    ],
    (err, result) => {
      if (err) return res.status(500).json({ success: false, message: "Database Error", error: err });
 
      db.query("SELECT id FROM alumni_members WHERE email = ?", [email], (e2, rows) => {
        if (!e2 && rows.length > 0) {
          sendNotification(
            rows[0].id,
            "📢 Banner Request Received",
            "Your ad banner request has been sent to admin for review.",
            "general"
          );
        }
      });
 
      res.json({ success: true, message: "Banner request submitted ✅", id: result.insertId });
    }
  );
});
 
// ── ALUMNI: apni request(s) ka status/payment dekhna ──
app.get("/banner-request/mine/:email", (req, res) => {
  db.query(
    `SELECT * FROM banner_requests WHERE email = ? ORDER BY id DESC`,
    [req.params.email],
    (err, result) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, data: result });
    }
  );
});
 
// ── PUBLIC / HOME PAGE: sirf approved banners ──
app.get("/banners/active", (req, res) => {
  db.query(
    `SELECT id, banner_title, banner_description, website_link, banner_image,
            organisation_name, preferred_start_date, additional_notes
     FROM banner_requests
     WHERE status = 'Approved'
     ORDER BY id DESC`,
    (err, result) => {
      if (err) {
        console.log("banners/active DB error:", err);
        return res.status(500).json({ success: false });
      }
      res.json({ success: true, data: result });
    }
  );
});

// ── ADMIN: saare banner requests list karo ──
app.get("/admin/banner-requests", (req, res) => {
  db.query(`SELECT * FROM banner_requests ORDER BY id DESC`, (err, result) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true, data: result });
  });
});
 
// ── ADMIN: approve karne se pehle payment maango ──
app.put("/admin/banner-request/request-payment/:id", (req, res) => {
  const { amount, payment_note } = req.body;
  if (!amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, message: "Valid amount is required" });
  }
 
  db.query(
    `UPDATE banner_requests
     SET status = 'Payment Requested', amount_requested = ?, payment_note = ?, payment_status = 'Pending'
     WHERE id = ?`,
    [amount, payment_note || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false });
 
      db.query("SELECT email FROM banner_requests WHERE id = ?", [req.params.id], (e2, rows) => {
        if (!e2 && rows.length > 0) {
          db.query("SELECT id FROM alumni_members WHERE email = ?", [rows[0].email], (e3, urows) => {
            if (!e3 && urows.length > 0) {
              sendNotification(
                urows[0].id,
                "💳 Payment Required for Banner Approval",
                `Please pay ₹${amount} to get your banner approved.${payment_note ? " Note: " + payment_note : ""}`,
                "general"
              );
            }
          });
        }
      });
 
      res.json({ success: true, message: "Payment request sent to alumni ✅" });
    }
  );
});
 
// ── ADMIN: payment mil gaya, ab banner approve karo ──
app.put("/admin/banner-request/approve/:id", (req, res) => {
  db.query(
    `UPDATE banner_requests SET status = 'Approved', payment_status = 'Paid' WHERE id = ?`,
    [req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false });
 
      db.query("SELECT email FROM banner_requests WHERE id = ?", [req.params.id], (e2, rows) => {
        if (!e2 && rows.length > 0) {
          db.query("SELECT id FROM alumni_members WHERE email = ?", [rows[0].email], (e3, urows) => {
            if (!e3 && urows.length > 0) {
              sendNotification(
                urows[0].id,
                "✅ Banner Approved!",
                "Your ad banner is now live on the Home page.",
                "general"
              );
            }
          });
        }
      });
 
      res.json({ success: true, message: "Banner Approved ✅" });
    }
  );
});
 
// ── ADMIN: reject karo ──
app.put("/admin/banner-request/reject/:id", (req, res) => {
  const { admin_remarks } = req.body;
  db.query(
    `UPDATE banner_requests SET status = 'Rejected', admin_remarks = ? WHERE id = ?`,
    [admin_remarks || null, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ success: false });
 
      db.query("SELECT email FROM banner_requests WHERE id = ?", [req.params.id], (e2, rows) => {
        if (!e2 && rows.length > 0) {
          db.query("SELECT id FROM alumni_members WHERE email = ?", [rows[0].email], (e3, urows) => {
            if (!e3 && urows.length > 0) {
              sendNotification(
                urows[0].id,
                "❌ Banner Request Rejected",
                admin_remarks || "Your banner request was not approved by admin.",
                "general"
              );
            }
          });
        }
      });
 
      res.json({ success: true, message: "Banner Rejected" });
    }
  );
});
 
// ── ADMIN: request delete karo ──
app.delete("/admin/banner-request/:id", (req, res) => {
  db.query(`DELETE FROM banner_requests WHERE id = ?`, [req.params.id], (err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

// ======================================================
// BIRTHDAYS + ANNIVERSARIES
// ======================================================

app.get("/birthdays/today", (req, res) => {
  const birthdayQ = new Promise((resolve, reject) => {
    db.query(
      `SELECT id, full_name, profile_photo, dob, batch_year
       FROM alumni_members
       WHERE dob IS NOT NULL
         AND DAY(dob) = DAY(CURDATE())
         AND MONTH(dob) = MONTH(CURDATE())
       ORDER BY full_name`,
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });

  const anniversaryQ = new Promise((resolve, reject) => {
    db.query(
      `SELECT id, full_name, profile_photo, anniversary_date, spouse_name
       FROM alumni_members
       WHERE married = 'YES'
         AND anniversary_date IS NOT NULL
         AND DAY(anniversary_date) = DAY(CURDATE())
         AND MONTH(anniversary_date) = MONTH(CURDATE())
       ORDER BY full_name`,
      (err, rows) => (err ? reject(err) : resolve(rows))
    );
  });

  Promise.all([birthdayQ, anniversaryQ])
    .then(([birthdays, anniversaries]) => {

      const birthdayData = birthdays.map((b) => ({
        id: b.id,
        full_name: b.full_name,
        profile_photo: b.profile_photo,
        batch_year: b.batch_year,
        dob: b.dob,
      }));

      const anniversaryData = anniversaries.map((a) => ({
        id: a.id,
        full_name: a.full_name,
        profile_photo: a.profile_photo,
        spouse_name: a.spouse_name,
        anniversary_date: a.anniversary_date,
      }));

      res.json({
        success: true,
        birthdays: birthdayData,
        anniversaries: anniversaryData,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(500).json({
        success: false,
        message: "Server Error",
      });
    });
});
// ======================================================
// UNIFIED EASEBUZZ PAYMENT GATEWAY PIPELINE
// ======================================================

app.post("/pay/initiate", async (req, res) => {
  const { amount, firstname, email, phone, productinfo, payment_type, reference_id, return_url } = req.body;

  const key = process.env.EASEBUZZ_KEY;
  const salt = process.env.EASEBUZZ_SALT;
  const env = process.env.EASEBUZZ_ENV || "test";
  const baseUrl = env === "prod" ? "https://pay.easebuzz.in" : "https://testpay.easebuzz.in";

  // ── 0. SAFETY CHECK ──
  if (!key || !salt) {
    console.error("CRITICAL ERROR: Easebuzz Key or Salt is missing from your .env file!");
    return res.status(500).json({ success: false, message: "Payment Gateway configuration error on server." });
  }

  // ── 1. FIX SURL/FURL LOCALHOST REJECTION ──
  let serverIp = process.env.SERVER_URL; 
  serverIp = serverIp.replace(/\/+$/, ""); // Removes any accidental trailing slashes
  serverIp = serverIp.replace("localhost", "127.0.0.1"); // Easebuzz rejects 'localhost', so we disguise it!
  if (!serverIp.startsWith("http")) serverIp = `http://${serverIp}`;

  const txnid = `${payment_type}_${Date.now()}`;
  const amountStr = parseFloat(amount).toFixed(2);
  
  const udf1 = payment_type || ""; 
  const udf2 = reference_id || ""; 
  
  // ── THE FIX: HEX ENCODE THE URL SO EASEBUZZ FIREWALL ACCEPTS IT ──
  const udf3 = return_url ? Buffer.from(return_url).toString("hex") : "";

  // ── 2. THE CORRECTED HASH (EXACTLY 8 PIPES AFTER UDF3) ──
  // Sequence: key|txnid|amount|productinfo|firstname|email|udf1|udf2|udf3|udf4|udf5|udf6|udf7|udf8|udf9|udf10|salt
  const hashString = `${key}|${txnid}|${amountStr}|${productinfo}|${firstname}|${email}|${udf1}|${udf2}|${udf3}||||||||${salt}`;
  const hash = crypto.createHash("sha512").update(hashString).digest("hex");

  // ── 3. LEDGER INSERT ──
  db.query(
    `INSERT INTO transactions (txnid, payment_type, reference_id, amount, status) VALUES (?, ?, ?, ?, 'Pending')`,
    [txnid, payment_type, reference_id, amountStr],
    async (dbErr) => {
      if (dbErr) {
        console.error("Ledger Insert Error:", dbErr);
        return res.status(500).json({ success: false, message: "Database Error" });
      }

      // ── 4. BUILD EASEBUZZ FORM ──
      const form = new URLSearchParams();
      form.append("key", key);
      form.append("txnid", txnid);
      form.append("amount", amountStr);
      form.append("productinfo", productinfo);
      form.append("firstname", firstname);
      form.append("email", email);
      form.append("phone", phone);
      form.append("surl", `${serverIp}/pay/success`); 
      form.append("furl", `${serverIp}/pay/failed`);  
      form.append("udf1", udf1);
      form.append("udf2", udf2);
      form.append("udf3", udf3);
      form.append("hash", hash);
      
      try {
        const response = await fetch(`${baseUrl}/payment/initiateLink`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
          body: form.toString(),
        });
        
        const data = await response.json();

        if (data.status === 1) {
          res.json({ success: true, txnid, checkout_url: `${baseUrl}/pay/${data.data}` });
        } else {
          console.error("Easebuzz Rejection Data:", data); // Logs the exact reason to your terminal if it fails again
          db.query(`UPDATE transactions SET status = 'Failed', error_message = ? WHERE txnid = ?`, [data.data, txnid]);
          res.status(400).json({ success: false, message: data.data || "Gateway connection failed" });
        }
      } catch (err) {
        console.error("Easebuzz Init Error:", err);
        res.status(500).json({ success: false, message: "Server network error" });
      }
    }
  );
});// ── WEBHOOK: PAYMENT SUCCESS ──
app.post("/pay/success", (req, res) => {
  const { status, txnid, easepayid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10, hash, key } = req.body;
  const salt = process.env.EASEBUZZ_SALT;
  const reverseHashString = `${salt}|${status}|${udf10 || ""}|${udf9 || ""}|${udf8 || ""}|${udf7 || ""}|${udf6 || ""}|${udf5 || ""}|${udf4 || ""}|${udf3 || ""}|${udf2 || ""}|${udf1 || ""}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const calculatedHash = crypto.createHash("sha512").update(reverseHashString).digest("hex");

  if (calculatedHash !== hash) return res.status(403).send("Hash mismatch.");

  const decodedUrl = udf3 ? Buffer.from(udf3, "hex").toString("utf-8") : "";

  if (status === "success") {
    db.query(`UPDATE transactions SET status = 'Success', easebuzz_payid = ? WHERE txnid = ?`, [easepayid, txnid]);

    if (udf1 === "REG") {
      db.query("UPDATE alumni_members SET payment_status = 'YES' WHERE email = ?", [udf2], (err) => {
        if (!err) {
          db.query("SELECT full_name, receipt_number FROM alumni_members WHERE email = ?", [udf2], (err2, rows) => {
            if (!err2 && rows.length > 0) sendWelcomeEmail(udf2, rows[0].full_name, rows[0].receipt_number);
          });
        }
      });
    } else if (udf1 === "DON") {
      db.query("UPDATE donations SET payment_status = 'Paid' WHERE id = ?", [udf2]);
    } else if (udf1 === "BAN") {
      db.query("UPDATE banner_requests SET payment_status = 'Paid', status = 'Approved' WHERE id = ?", [udf2]);
    }

    res.send(`
      <html><body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#F8FAFC;font-family:sans-serif;text-align:center;">
        <script>
          if (window.opener) {
            // WEB POPUP MODE: Send hidden success message to the main app and auto-close!
            window.opener.postMessage({ type: 'PAYMENT_RETURN', status: 'success' }, "*");
            window.close();
          } else {
            // MOBILE MODE: Attach status to the deep link and trigger it
            if ("${decodedUrl}") { 
              const separator = "${decodedUrl}".includes("?") ? "&" : "?";
              window.location.href = "${decodedUrl}" + separator + "status=success"; 
            }
          }
        </script>
        <h2 style="color:#16A34A;font-size:32px;">Payment Successful ✅</h2>
        <p style="color:#475569;font-size:18px;">Verifying transaction...</p>
      </body></html>
    `);
  } else {
    res.redirect(307, "/pay/failed");
  }
});

// ── WEBHOOK: PAYMENT FAILED ──
app.post("/pay/failed", (req, res) => {
  const { status, txnid, amount, productinfo, firstname, email, udf1, udf2, udf3, udf4, udf5, udf6, udf7, udf8, udf9, udf10, hash, key, error_Message } = req.body;
  const salt = process.env.EASEBUZZ_SALT;
  const reverseHashString = `${salt}|${status}|${udf10 || ""}|${udf9 || ""}|${udf8 || ""}|${udf7 || ""}|${udf6 || ""}|${udf5 || ""}|${udf4 || ""}|${udf3 || ""}|${udf2 || ""}|${udf1 || ""}|${email}|${firstname}|${productinfo}|${amount}|${txnid}|${key}`;
  const calculatedHash = crypto.createHash("sha512").update(reverseHashString).digest("hex");

  if (calculatedHash !== hash) return res.status(403).send("Hash mismatch.");

  const decodedUrl = udf3 ? Buffer.from(udf3, "hex").toString("utf-8") : "";
  db.query(`UPDATE transactions SET status = 'Failed', error_message = ? WHERE txnid = ?`, [error_Message || "Failed", txnid]);
  if (udf1 === "DON") db.query("UPDATE donations SET payment_status = 'Failed' WHERE id = ?", [udf2]);

  res.send(`
    <html><body style="display:flex;flex-direction:column;justify-content:center;align-items:center;height:100vh;background:#F8FAFC;font-family:sans-serif;text-align:center;">
      <script>
        if (window.opener) {
          window.opener.postMessage({ type: 'PAYMENT_RETURN', status: 'failed' }, "*");
          window.close();
        } else {
          if ("${decodedUrl}") { 
            const separator = "${decodedUrl}".includes("?") ? "&" : "?";
            window.location.href = "${decodedUrl}" + separator + "status=failed"; 
          }
        }
      </script>
      <h2 style="color:#DC2626;font-size:32px;">Payment Failed ❌</h2>
      <p style="color:#475569;font-size:18px;">Returning to application...</p>
    </body></html>
  `);
});
// =====================================
// SERVER
// =====================================
const PORT = process.env.PORT || 2000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Running on Port ${PORT} 🚀`);
});