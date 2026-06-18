const mongoose = require('mongoose');

// Define the schema once
const userSchema = new mongoose.Schema({
  email: { 
    type: String, 
    required: true, 
    unique: true 
  },
  password: { 
    type: String, 
    required: true 
  },
  displayName: { 
    type: String, 
    default: "New Creator" 
  },
  partnerEmail: { 
    type: String, 
    default: null 
  },
  partnerStatus: { 
    type: String, 
    enum: ['none', 'pending', 'active'], 
    default: 'none' 
  },
  incomingRequest: { 
    type: String, 
    default: null 
  },
  visionRank: { 
    type: Number, 
    default: 0 
  }
}, { timestamps: true });

// Export the model
module.exports = mongoose.model('User', userSchema);