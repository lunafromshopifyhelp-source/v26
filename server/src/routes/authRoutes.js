const express = require("express");
const router = express.Router();

// CHANGE THIS LINE BELOW to match your actual file name
const User = require("../models/userModel"); 

// 🎯 Step A: Imported sendVerification right here along with signup and login
const { signup, login, sendVerification } = require("../controllers/authController");

// 1. Core Authentication Routes
router.post("/register", signup); 
router.post("/login", login);
router.post("/send-verification", sendVerification); // ⬅️ Step B: Wired up the verification endpoint

// 2. Onboarding Route
router.put('/update-profile', async (req, res) => {
  try {
    const { email, talent, vision } = req.body;
    
    const user = await User.findOneAndUpdate(
      { email: email }, 
      { 
        talent: talent, 
        vision: vision,
        onboarded: true 
      }, 
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ message: "Profile Updated!", user });
  } catch (err) {
    console.error("Update Profile Error:", err);
    res.status(500).json({ message: "Server error", error: err });
  }
});

// 3. GET USER PROFILE
router.get('/profile/:email', async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json("User not found");
    
    // We only send back what we need for the dashboard
    const { password, ...others } = user._doc;
    res.status(200).json(others);
  } catch (err) {
    res.status(500).json(err);
  }
});

// 4. LINK ACCOUNTABILITY PARTNER (With Complete Existence Validation Loop)
router.put('/link-partner', async (req, res) => {
  try {
    const { myEmail, partnerEmail } = req.body;
    
    // 🎯 STEP 1: Check if the partner actually exists in the v26 database
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) {
      return res.status(404).json({ message: "Partner not found in v26 system." });
    }

    // STEP 2: Update your profile with their email safely if they exist
    await User.findOneAndUpdate({ email: myEmail }, { partnerEmail: partnerEmail });
    
    res.status(200).json("Bridge established! You are now linked.");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 5. SEND INVITE
router.put('/invite-partner', async (req, res) => {
  try {
    const { myEmail, partnerEmail } = req.body;
    
    // Check partner existence prior to passing invite flags
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) {
      return res.status(404).json({ message: "Requested user does not exist." });
    }

    // Set my status to 'pending' and store who I invited
    await User.findOneAndUpdate({ email: myEmail }, { partnerEmail, partnerStatus: 'pending' });
    res.status(200).json("Invite Sent!");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 6. ACCEPT INVITE
router.put('/accept-partner', async (req, res) => {
  try {
    const { myEmail, partnerEmail } = req.body;
    // Both users now get 'accepted' status
    await User.findOneAndUpdate({ email: myEmail }, { partnerEmail, partnerStatus: 'accepted' });
    await User.findOneAndUpdate({ email: partnerEmail }, { partnerEmail: myEmail, partnerStatus: 'accepted' });
    res.status(200).json("Bridge Activated!");
  } catch (err) {
    res.status(500).json(err);
  }
});

// 7. DISCONNECT PARTNER
router.put('/disconnect-partner', async (req, res) => {
  const { myEmail } = req.body;
  try {
    const user = await User.findOne({ email: myEmail });
    if (!user) return res.status(404).send("User not found");
    const partnerEmail = user.partnerEmail;

    // Reset both users
    await User.updateMany(
      { email: { $in: [myEmail, partnerEmail] } },
      { 
        $set: { 
          partnerEmail: null, 
          partnerStatus: 'none', 
          incomingRequest: null 
        } 
      }
    );
    res.json({ message: "Disconnected successfully" });
  } catch (err) {
    res.status(500).send("Error disconnecting partner");
  }
});

// 🎯 ALWAYS PLACE THIS AT THE VERY BOTTOM OF THE FILE
module.exports = router;