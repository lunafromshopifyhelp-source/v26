const mongoose = require('mongoose');

const meetingSchema = new mongoose.Schema(
  {
    mentorEmail: {
      type: String,
      required: [true, 'Mentor email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    menteeEmail: {
      type: String,
      required: [true, 'Mentee email is required'],
      trim: true,
      lowercase: true,
      index: true,
    },
    topic: {
      type: String,
      required: [true, 'Meeting topic is required'],
      trim: true,
      maxlength: [120, 'Topic cannot exceed 120 characters'],
    },
    craftDomain: {
      type: String,
      enum: ['Music Architecture', 'Visual Arts & Design', 'Enterprise & Strategy', 'Systems & Software', 'General Mentorship'],
      default: 'General Mentorship',
    },
    scheduledDateTime: {
      type: Date,
      required: [true, 'Scheduled date and time is required'],
      index: true,
    },
    durationMinutes: {
      type: Number,
      default: 30,
      min: [10, 'Duration must be at least 10 minutes'],
      max: [180, 'Duration cannot exceed 180 minutes'],
    },
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'in_progress', 'completed', 'cancelled'],
      default: 'confirmed',
      index: true,
    },
    roomToken: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    agendaItems: [
      {
        text: { type: String, trim: true },
        completed: { type: Boolean, default: false },
      },
    ],
    sessionNotes: {
      type: String,
      default: '',
    },
    callStartedAt: {
      type: Date,
      default: null,
    },
    callEndedAt: {
      type: Date,
      default: null,
    },
  },
  { 
    timestamps: true 
  }
);

// Compound index for efficient participant session queries
meetingSchema.index({ mentorEmail: 1, scheduledDateTime: -1 });
meetingSchema.index({ menteeEmail: 1, scheduledDateTime: -1 });

module.exports = mongoose.model('Meeting', meetingSchema);