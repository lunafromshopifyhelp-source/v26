const express = require("express");
const cors = require("cors");
require("dotenv").config();
const connectDB = require("./config/db");

// Routes
const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const projectRoutes = require("./routes/projectRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const postRoutes = require('./routes/postRoutes');
const missionRoutes = require("./routes/missionRoutes"); // ⬅️ IMPORT MISSIONS ROUTER

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
app.use("/api/notifications", notificationRoutes); 
app.use('/api/posts', postRoutes);
app.use("/api/missions", missionRoutes); // ⬅️ MAP MISSIONS PREFIX SIZED PERFECTLY FOR THE FRONTEND

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});