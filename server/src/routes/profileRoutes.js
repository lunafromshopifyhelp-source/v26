const express = require("express");
const router = express.Router();
const { 
  createOrUpdateProfile, 
  getMyProfile, 
  getAllProfiles, 
  getProfileByUserId 
} = require("../controllers/profileController");
const auth = require("../middleware/authMiddleware");
const User = require('../models/userModel'); // Import for the Manifest logic

// --- Existing Profile Management ---

// @route    GET api/profiles/me
// @desc     Get current user's profile
// @access   Private
router.get("/me", auth, getMyProfile);

// @route    POST api/profiles
// @desc     Create or update user profile
// @access   Private
router.post("/", auth, createOrUpdateProfile);

// @route    GET api/profiles
// @desc     Get all profiles
// @access   Public
router.get("/", getAllProfiles);

// @route    GET api/profiles/user/:userId
// @desc     Get profile by user ID
// @access   Public
router.get("/user/:userId", getProfileByUserId);


// --- v26 Creative Lexicon: Vision Ranking ---

// @route    PUT api/profiles/manifest/:email
// @desc     Increase Vision Rank (Level Up)
// @access   Private (Recommended to add auth here later)
router.put('/manifest/:email', async (req, res) => {
  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: req.params.email },
      { $inc: { visionRank: 1 } }, // Adds 1 to the current rank
      { new: true }
    );
    
    if (!updatedUser) return res.status(404).json({ error: "Identity not found" });

    res.json({ 
      message: "Vision Manifested. Your frequency has shifted.",
      newRank: updatedUser.visionRank 
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to sync vision rank" });
  }
});

module.exports = router;