const express = require("express");
const router = express.Router();
const Mission = require("../models/missionModel");

// CREATE A NEW MISSION (LEXICON: INITIALIZE VISION)
router.post("/create-mission", async (req, res) => {
  try {
    // Ensuring we capture timeframe (daily, weekly, yearly) for the circles
    const { creatorEmail, title, timeframe, status } = req.body;
    const newMission = new Mission({
      creatorEmail,
      title,
      timeframe: timeframe || 'daily', 
      status: status || 'active'
    });
    
    const savedMission = await newMission.save();
    res.status(200).json(savedMission);
  } catch (err) {
    res.status(500).json({ error: "Failed to initialize vision in the network." });
  }
});

// GET ALL MISSIONS FOR A SPECIFIC USER
router.get("/my-missions/:email", async (req, res) => {
  try {
    const missions = await Mission.find({ creatorEmail: req.params.email });
    res.status(200).json(missions);
  } catch (err) {
    res.status(500).json({ error: "Signal lost while fetching missions." });
  }
});


// TOGGLE MISSION STATUS (ACTIVE VS COMPLETED)
router.put("/update-status/:id", async (req, res) => {
  try {
    const { status } = req.body;
    const updatedMission = await Mission.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.status(200).json(updatedMission);
  } catch (err) {
    res.status(500).json({ error: "Failed to update mission state." });
  }
});


// 🗑️ DELETE AN INDIVIDUAL MISSION FILE
router.delete("/delete/:id", async (req, res) => {
  try {
    const deletedMission = await Mission.findByIdAndDelete(req.params.id);
    if (!deletedMission) {
      return res.status(404).json({ error: "Mission goal not found." });
    }
    res.status(200).json({ message: "Mission cleared successfully from network." });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete mission from database." });
  }
});
module.exports = router;
