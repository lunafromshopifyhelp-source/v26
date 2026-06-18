const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/userModel");

// --- EXISTING SIGNUP ---
exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new User({ name, email, password: hashedPassword });
    await newUser.save();

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
      process.env.JWT_SECRET,
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

// --- NEW: GET PROFILE (Needed for Workspace to see partner status) ---
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findOne({ email: req.params.email });
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

// --- NEW: LINK PARTNER (Step 1 of the Handshake) ---
exports.linkPartner = async (req, res) => {
  const { myEmail, partnerEmail } = req.body;
  try {
    const partner = await User.findOne({ email: partnerEmail });
    if (!partner) return res.status(404).json({ message: "Partner not found in v26" });

    // 1. Update your record to 'pending'
    await User.findOneAndUpdate(
      { email: myEmail },
      { partnerEmail, partnerStatus: 'pending' }
    );

    // 2. Set the 'incomingRequest' on the partner's record
    await User.findOneAndUpdate(
      { email: partnerEmail },
      { incomingRequest: myEmail }
    );

    res.status(200).json({ message: "Invitation sent!" });
  } catch (error) {
    res.status(500).json({ message: "Handshake initiation failed" });
  }
};

// --- NEW: ACCEPT MISSION (Step 2 of the Handshake) ---
exports.acceptMission = async (req, res) => {
  const { myEmail, requesterEmail } = req.body;
  try {
    // 1. Update your status to 'active' and clear the request
    await User.findOneAndUpdate(
      { email: myEmail },
      { 
        partnerEmail: requesterEmail, 
        partnerStatus: 'active', 
        incomingRequest: null 
      }
    );

    // 2. Update the requester's status to 'active'
    await User.findOneAndUpdate(
      { email: requesterEmail },
      { partnerStatus: 'active' }
    );

    res.status(200).json({ message: "Mission Bridge Established!" });
  } catch (error) {
    res.status(500).json({ message: "Handshake completion failed" });
  }
};