const mongoose = require('mongoose');

const postSchema = new mongoose.Schema({
  authorEmail: { 
    type: String, 
    required: true,
    index: true 
  },
  authorName: { 
    type: String, 
    required: true 
  },
  authorRank: {
    type: Number,
    default: 1
  },
  text: { 
    type: String 
  },
  // Supports multiple Cloudinary URLs
  media: [{ 
    type: String 
  }], 
  // For searching specific vibes like #Chemistry or #Soulful
  tags: [{
    type: String
  }],
  visibility: { 
    type: String, 
    enum: ['private', 'partner', 'public'], 
    default: 'partner' 
  },
  // INSPIRATION SYSTEM: Stores emails of users who liked the post
  likes: [{
    type: String
  }],
  // ECHOES SYSTEM: Nested comments
  comments: [{
    userEmail: String,
    userName: String,
    text: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Post', postSchema);