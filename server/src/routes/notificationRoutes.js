const express = require('express');
const router = express.Router();
const Notification = require('../models/notificationModel');

// Fetch notifications for a specific user
router.get('/:email', async (req, res) => {
  try {
    // We'll use email for now to keep it simple with your localStorage
    const notifications = await Notification.find({ recipientEmail: req.params.email })
      .sort({ createdAt: -1 }); // Newest first
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch signals" });
  }
});

// Mark as read
router.put('/read/:id', async (req, res) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { read: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Update failed" });
  }
});

module.exports = router;