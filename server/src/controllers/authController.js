const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// Temporary in-memory storage for verification codes (Email -> Code mapping)
const verificationCodes = new Map();

// --- NEW: SEND VERIFICATION CODE ---
exports.sendVerification = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Email is required" });

    // Generate a simple 6-digit random code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    
    // Save it to memory so the subsequent registration step can check it
    verificationCodes.set(email, code);

    // 🎯 LOG THE CODE IN YOUR SERVER TERMINAL SO YOU CAN RETRIEVE IT INSTANTLY TO TEST
    console.log(`\n============== v26 VERIFICATION CODE ==============`);
    console.log(`Email Target: ${email}`);
    console.log(`Your 6-Digit Code: ${code}`);
    console.log(`====================================================\n`);

    // Return success to the frontend
    res.status(200).json({ message: "Verification code initialized!" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to process verification request" });
  }
};

// --- UPDATED SIGNUP (Validates the Code!) ---
exports.signup = async (req, res) => {
  try {
    const { name, email, password, code } = req.body;
    
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    // Check code matches what we stored in sendVerification
    const correctCode = verificationCodes.get(email);
    if (!correctCode || correctCode !== code) {
      return res.status(400).json({ message: "Invalid or expired verification code." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

    // Clear verification code from memory once used
    verificationCodes.delete(email);

    res.status(201).json({
      message: "User created",
      user: { id: newUser._id, name: newUser.name, email: newUser.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- EXISTING LOGIN ---
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid email" });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET || "fallback_secret",
      { expiresIn: "7d" }
    );

    res.json({
      message: "Login successful",
      token,
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

// --- GET PROFILE ---
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- LINK PARTNER ---
exports.linkPartner = async (req, res) => {
  const { myEmail, partnerEmail } = req.body;
  try {
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) return res.status(404).json({ message: "Partner not found in v26" });

    await User.findOneAndUpdate(
      { email: myEmail },
      { partnerEmail, partnerStatus: 'pending' }
    );

    await User.findOneAndUpdate(
      { email: partnerEmail },
      { incomingRequest: myEmail }
    );

    res.status(200).json({ message: "Invitation sent!" });
  } catch (error) {
    res.status(500).json({ message: "Handshake initiation failed" });
  }
};

// --- ACCEPT MISSION ---
exports.acceptMission = async (req, res) => {
  const { myEmail, requesterEmail } = req.body;
  try {
    await User.findOneAndUpdate(
      { email: myEmail },
      { 
        partnerEmail: requesterEmail, 
        partnerStatus: 'active', 
        incomingRequest: null 
      }
    );

    await User.findOneAndUpdate(
      { email: requesterEmail },
      { partnerStatus: 'active' }
    );

    res.status(200).json({ message: "Mission Bridge Established!" });
  } catch (error) {
    res.status(500).json({ message: "Handshake completion failed" });
  }
};