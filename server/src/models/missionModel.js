const mongoose = require("mongoose");

const missionSchema = new mongoose.Schema({
  creatorEmail: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String },
  status: { type: String, default: "Active" }, // Active, Completed, Paused
  progress: { type: Number, default: 0 }, // 0 to 100
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Mission", missionSchema);