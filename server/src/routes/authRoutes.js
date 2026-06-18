const express = require("express");
const router = express.Router();

// CHANGE THIS LINE BELOW to match your actual file name
const User = require("../models/userModel"); 

const { signup, login } = require("../controllers/authController");

// 1. Existing Routes
router.post("/register", signup); 
router.post("/login", login);

// 2. New Onboarding Route
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





// GET USER PROFILE
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

module.exports = router;


// LINK ACCOUNTABILITY PARTNER
router.put('/link-partner', async (req, res) => {
  try {
    const { myEmail, partnerEmail } = req.body;
    
    // Update both users (Optional: you can just update the one seeking accountability)
    await User.findOneAndUpdate({ email: myEmail }, { partnerEmail: partnerEmail });
    
    res.status(200).json({ message: "Partner Linked! They can now see your progress." });
  } catch (err) {
    res.status(500).json(err);
  }
});

// LINK A PARTNER
router.put('/link-partner', async (req, res) => {
  try {
    const { myEmail, partnerEmail } = req.body;
    
    // Check if the partner actually exists in v26
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) return res.status(404).json("Partner not found in v26 system.");

    // Update your profile with their email
    await User.findOneAndUpdate({ email: myEmail }, { partnerEmail: partnerEmail });
    
    res.status(200).json("Bridge established! You are now linked.");
  } catch (err) {
    res.status(500).json(err);
  }
});


// 1. SEND INVITE
router.put('/invite-partner', async (req, res) => {
  const { myEmail, partnerEmail } = req.body;
  // Set my status to 'pending' and store who I invited
  await User.findOneAndUpdate({ email: myEmail }, { partnerEmail, partnerStatus: 'pending' });
  // Also alert the partner (we'll look for this on their login)
  res.status(200).json("Invite Sent!");
});

// 2. ACCEPT INVITE
router.put('/accept-partner', async (req, res) => {
  const { myEmail, partnerEmail } = req.body;
  // Both users now get 'accepted' status
  await User.findOneAndUpdate({ email: myEmail }, { partnerEmail, partnerStatus: 'accepted' });
  await User.findOneAndUpdate({ email: partnerEmail }, { partnerEmail: myEmail, partnerStatus: 'accepted' });
  res.status(200).json("Bridge Activated!");
});

router.put('/disconnect-partner', async (req, res) => {
  const { myEmail } = req.body;
  try {
    const user = await User.findOne({ email: myEmail });
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