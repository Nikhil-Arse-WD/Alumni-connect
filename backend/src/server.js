require("dotenv").config();
const express = require("express");
const cors = require("cors");
const http = require("http");
const path = require("path");

const db = require("./config/db"); // Ensures DB connection is initialized
const errorHandler = require("./middlewares/errorHandler");
const { generalLimiter } = require("./middlewares/rateLimiter");
const socketService = require("./services/socketService");

// Import Routers
const authRoutes = require("./routes/authRoutes");
const alumniRoutes = require("./routes/alumniRoutes");
const forumRoutes = require("./routes/forumRoutes");
const jobRoutes = require("./routes/jobRoutes");
const eventRoutes = require("./routes/eventRoutes");
const contributionRoutes = require("./routes/contributionRoutes");
const adminRoutes = require("./routes/adminRoutes");
const bannerRoutes = require("./routes/bannerRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const paymentRoutes = require("./routes/paymentRoutes");

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
socketService.initializeSocket(server, app);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(generalLimiter);
app.use("/api/uploads", express.static(path.join(__dirname, "../uploads")));

// Health Check
app.get("/", (req, res) => {
  res.send("SVIMAA API Backend is Running 🚀");
});

// API Routes
app.use("/api/auth", authRoutes);
app.use("/api/alumni", alumniRoutes);
app.use("/api/forum", forumRoutes);
app.use("/api/jobs", jobRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/contributions", contributionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/banners", bannerRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/pay", paymentRoutes);

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 2000;
server.listen(PORT, "0.0.0.0", () => {
  console.log(`Server Running on Port ${PORT} 🚀`);
});