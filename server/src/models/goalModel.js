const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  partnerEmail: { type: String, default: "" }, // The person watching you
  text: { type: String, required: true },
  timeframe: { 
    type: String, 
    enum: ['daily', 'weekly', 'monthly', 'yearly'], 
    required: true 
  },
  mediaUrl: { type: String, default: "" }, // Link to Video/Audio/Image
  mediaType: { type: String, default: "text" }, // 'video', 'audio', 'image', or 'text'
  status: { type: String, default: "pending" }, // 'pending', 'completed', 'verified'
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Goal", goalSchema);