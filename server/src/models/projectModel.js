const mongoose = require("mongoose");

// Sub-schema for asset discussion threads
const discussionSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  userName: { type: String, required: true },
  text: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    ownerEmail: { 
      type: String, 
      required: true,
      lowercase: true,
      trim: true
    },
    category: { 
      type: String, 
      enum: [
        'Chemistry', 'Music', 'Development', 'Design', 
        'Art', 'Writing', 'Film', 'Science', 'Dev', 
        'Business', 'Spiritual', 'Agri', 'Athletics', 'Other'
      ],
      default: 'Other'
    },
    // Platform Lexicon state parameter rules
    status: {
      type: String,
      enum: ["active", "manifested", "open", "in-progress"],
      default: "active", // active = Unfinished Work, manifested = Finished Asset
    },
    fileUrl: { 
      type: String 
    }, 
    fileType: { 
      type: String 
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    inspirations: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    ],
    discussions: [discussionSchema],
    collaborators: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        role: { type: String, default: "collaborator" },
        joinedAt: { type: Date, default: Date.now },
      },
    ],
    skillsRequired: [
      {
        type: String,
        trim: true,
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.models.Project || mongoose.model("Project", projectSchema);