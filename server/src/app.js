const http = require("http");
const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");
const initSignalingServer = require("./socket");

// Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const projectRoutes = require("./routes/projectRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const postRoutes = require("./routes/postRoutes");
const missionRoutes = require("./routes/missionRoutes");
const meetingRoutes = require("./routes/meetingRoutes");

// Initialize Express App & Database
const app = express();
connectDB();

// Global Middleware
app.use(cors());
app.use(express.json());

// Root route
app.get("/", (req, res) => {
  res.send("v26 API is running");
});

// Connect API Routes
app.use("/api/auth", authRoutes);
app.use("/api/profiles", profileRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/missions", missionRoutes);
app.use("/api/meetings", meetingRoutes); // Mounted correctly after app initialization

// Create HTTP & WebSocket Signaling Server
const server = http.createServer(app);
initSignalingServer(server);

// Start Server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`v26 server & signaling running on port ${PORT}`);
});