const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema({
  creatorEmail: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  
  // 🎯 ADDED TIMEFRAME: Crucial for the daily/weekly/monthly/yearly filtering
  timeframe: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'yearly'], 
    default: 'daily' 
  },
  
  // 🎯 UPDATED STATUS: Clean lowercase strings to match the workspace metrics
  status: { 
    type: String, 
    enum: ['active', 'completed'], 
    default: 'active' 
  }, 
  
  progress: { type: Number, default: 0 }, // 0 to 100
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Mission", missionSchema);