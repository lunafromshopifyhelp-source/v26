// server/src/app.js
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db"); // Ensure this path is correct
require("dotenv").config();

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// Routes - Linking the "Brain" to the "Nervous System"
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/profiles", require("./routes/profileRoutes"));
app.use("/api/projects", require("./routes/projectRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes")); // Added for Screen 13 

// Test endpoint
app.get("/", (req, res) => {
  res.send("Vision 2026 API is running");
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});