const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const projectRoutes = require("./routes/projectRoutes");
const notificationRoutes = require("./routes/notificationRoutes"); // ⬅️ ADD THIS

const app = express();
connectDB();

// Middleware
app.use(cors()); // This allows your Port 3000 (v26 Frontend) to talk to this server
app.use(express.json()); 

// Root route
app.get("/", (req, res) => {
  res.send("v26 API is running");
});

// Connect routes
app.use("/api/auth", authRoutes);           
app.use("/api/profiles", profileRoutes);  
app.use("/api/projects", projectRoutes);  
app.use("/api/notifications", notificationRoutes); // ⬅️ ADD THIS

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// 1. Import the routes (place near your other route imports)
const postRoutes = require('./routes/postRoutes');

// 2. Use the routes (place near your other app.use lines)
app.use('/api/posts', postRoutes);