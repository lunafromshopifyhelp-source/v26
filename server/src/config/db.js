const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Temporarily hardcode the connection string to test authentication directly
    await mongoose.connect("mongodb+srv://Vision:12dm8Ujmj2RBKnw4@cluster0.brvhymq.mongodb.net/v26?appName=Cluster0");

    console.log("MongoDB connected");
  } catch (error) {
    console.error("Database connection error:", error);
    process.exit(1);
  }
};

module.exports = connectDB; 