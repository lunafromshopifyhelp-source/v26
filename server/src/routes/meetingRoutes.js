const express = require('express');
const router = express.Router();
const {
  scheduleMeeting,
  getUserMeetings,
  getMeetingByRoomToken,
  updateMeeting,
} = require('../controllers/meetingController');

// Define API routes
router.post('/schedule', scheduleMeeting);
router.get('/user/:email', getUserMeetings);
router.get('/room/:roomToken', getMeetingByRoomToken);
router.patch('/:id', updateMeeting);

module.exports = router;