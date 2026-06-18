const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    // ADDED: "like" and "comment" to support the new social features
    enum: ["request", "accepted", "rejected", "message", "like", "comment"],
    required: true
  },
  // This can link to a Project OR a Post
  relatedId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false 
  },
  message: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model("Notification", notificationSchema);