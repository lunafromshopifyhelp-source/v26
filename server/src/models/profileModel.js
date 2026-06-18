const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // MUST match the "User" in your projectModel
    required: true
  },
  bio: { type: String },
  skills: [String],
  genres: [String],
  socialLinks: {
    twitter: String,
    linkedin: String
  }
}, { timestamps: true });

module.exports = mongoose.model("Profile", profileSchema);