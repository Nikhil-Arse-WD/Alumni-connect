const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");
if (!fs.existsSync("uploads/events")) fs.mkdirSync("uploads/events", { recursive: true });
if (!fs.existsSync("uploads/event-gallery")) fs.mkdirSync("uploads/event-gallery", { recursive: true });

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

const eventStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/events"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const uploadEvent = multer({ storage: eventStorage });

const galleryStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/event-gallery"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + Math.round(Math.random() * 1e9) + path.extname(file.originalname)),
});
const uploadGallery = multer({ storage: galleryStorage });

// ── Helper: notification insert
const sendNotification = (alumni_id, title, message, type = "general") => {
  db.query(
    `INSERT INTO notifications (alumni_id, title, message, type) VALUES (?, ?, ?, ?)`,
    [alumni_id, title, message, type],
    (err) => { if (err) console.log("Notification Error:", err); }
  );
};

// =====================================
// MYSQL CONNECTION
// =====================================
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "diya7067",
  database: "alumni_db",
});

db.connect((err) => {
  if (err) { console.log("DB Error", err); return; }
  console.log("MySQL Connected ✅");
});

app.get("/", (req, res) => res.send("API Running ✅"));

// =====================================
// REGISTER
// =====================================
app.post("/register", upload.single("profile_photo"), async (req, res) => {
  try {
    const {
      full_name, mobile, email, gender, dob, batch_year, programme,
      employment_type, organisation, designation, years_of_experience,
      industry, married, spouse_name, anniversary_date, address, city,
      country, payment_status,
    } = req.body;

    const member_id = "ALUMNI" + Date.now();
    const receipt_number = "RCPT" + Math.floor(100000 + Math.random() * 900000);
    const password = await bcrypt.hash(receipt_number, 10);
    const profile_photo = req.file ? req.file.filename : null;

    const sql = `
      INSERT INTO alumni_members (
        full_name, mobile, email, gender, dob, batch_year, programme, profile_photo,
        password, employment_type, organisation, designation, years_of_experience,
        industry, married, spouse_name, anniversary_date, address, city, country,
        payment_status, member_id, receipt_number
      ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
    `;

    db.query(sql, [
      full_name, mobile, email, gender, dob, batch_year, programme, profile_photo,
      password, employment_type, organisation, designation, years_of_experience,
      industry, married, spouse_name || null, anniversary_date || null,
      address, city, country, payment_status, member_id, receipt_number,
    ], (err) => {
      if (err) return res.status(500).json({ success: false, message: "Database Error", error: err });
      res.json({ success: true, message: "Registration Successful ✅", member_id, receipt_number, login_password: receipt_number });
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

// =====================================
// LOGIN
// =====================================
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM alumni_members WHERE email = ?", [email], async (err, result) => {
    if (err) return res.status(500).json({ success: false, message: "Server Error" });
    if (result.length === 0) return res.status(401).json({ success: false, message: "Email not found" });
    const user = result[0];
    let isMatch = false;
    try { isMatch = await bcrypt.compare(password, user.password); } catch (e) { isMatch = false; }
    if (!isMatch) return res.status(401).json({ success: false, message: "Invalid credentials" });
    res.json({
      success: true, message: "Login Successful ✅",
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        profile_photo: user.profile_photo,
        role: user.role || "user",
      },
      token: "123",
    });
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

app.put("/member/update/:email", (req, res) => {
  const { full_name, mobile, city, country, designation, organisation } = req.body;
  db.query(
    "UPDATE alumni_members SET full_name=?, mobile=?, city=?, country=?, designation=?, organisation=? WHERE email=?",
    [full_name, mobile, city, country, designation, organisation, req.params.email],
    (err) => {
      if (err) return res.status(500).json({ success: false, message: "Database Error" });
      res.json({ success: true, message: "Profile Updated Successfully ✅" });
    }
  );
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
  const sql = `
    SELECT forum_posts.*, alumni_members.full_name, alumni_members.profile_photo,
      alumni_members.programme, alumni_members.batch_year
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

// ======================================================
// FORUM COUNT — FIXED
//
// Problem tha:
//   Frontend se last_seen milliseconds (JS Date.now()) aata tha
//   MySQL FROM_UNIXTIME() seconds expect karta hai
//   Toh 1748000000000 ms / 1000 = 1748000000 seconds — ye sahi hai
//   Lekin agar last_seen = 0 aaye (pehli baar) toh
//   FROM_UNIXTIME(0) = '1970-01-01 00:00:00' — ye bhi sahi hai
//
// ACTUAL FIX:
//   Pehle UNIX_TIMESTAMP(created_at) use karo — timezone safe
//   FROM_UNIXTIME() mein timezone conversion ho sakta tha agar
//   MySQL server timezone alag ho
//   UNIX_TIMESTAMP(created_at) > ? directly compare karo seconds se
// ======================================================
// forum/count — seen_at ke baad created posts count karo
// ── FORUM COUNT
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
        // Pehli baar user — insert karo, count = total active posts
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

// ── FORUM SEEN
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
    return res.json({ success: true, message: "Login success", token: "dummy-admin-token", admin: { id: admin.id, name: admin.name, email: admin.email, role: "admin" } });
  });
});

app.post("/admin/create-event", uploadEvent.single("cover_photo"), (req, res) => {
  const { title, description, venue, event_date, event_time, capacity } = req.body;
  const cover_photo = req.file ? `/uploads/events/${req.file.filename}` : null;
  db.query(
    "INSERT INTO events (title, description, venue, event_date, event_time, capacity, cover_photo) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [title, description, venue, event_date, event_time, capacity, cover_photo],
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
    (err) => {
      if (err) return res.status(500).json({ success: false });
      res.json({ success: true, message: "Donation submitted ✅", receipt_number });
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
  const dQ = new Promise((resolve, reject) => db.query(`SELECT 'donation' as type, id, donation_type as title, status, created_at, amount, receipt_number FROM donations WHERE alumni_id = ? ORDER BY id DESC`, [id], (e,r) => e?reject(e):resolve(r)));
  Promise.all([lQ, mQ, dQ]).then(([lectures, mentors, donations]) => res.json({ success: true, lectures, mentors, donations })).catch(() => res.status(500).json({ success: false }));
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
      ? { title: "✅ Registration Approved!", message: "Welcome to SVIMSAA Alumni Network! Your profile is now live." }
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
  const { title, message, target } = req.body;
  let sql = `SELECT id FROM alumni_members WHERE 1=1`;
  if (target === "Approved Only") sql += ` AND approved = 1`;
  if (target === "Pending Only") sql += ` AND approved = 0`;
  db.query(sql, (err, members) => {
    if (err) return res.status(500).json({ success: false });
    members.forEach(m => sendNotification(m.id, title, message, "general"));
    db.query(`INSERT INTO bulk_notifications (title, message, target, sent_count) VALUES (?, ?, ?, ?)`, [title, message, target, members.length]);
    res.json({ success: true, sent_count: members.length });
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
// SERVER
// =====================================
app.listen(2000, "0.0.0.0", () => {
  console.log("Server Running on Port 2000 🚀");
});