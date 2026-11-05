const crypto = require('crypto');
const Meeting = require('../models/meetingModel');

// @desc    Schedule a new mentorship session
// @route   POST /api/meetings/schedule
// @access  Public / Protected
exports.scheduleMeeting = async (req, res) => {
  try {
    const { mentorEmail, menteeEmail, scheduledDateTime, topic, craftDomain, durationMinutes, agendaItems } = req.body;

    if (!mentorEmail || !menteeEmail || !scheduledDateTime || !topic) {
      return res.status(400).json({
        success: false,
        message: 'mentorEmail, menteeEmail, scheduledDateTime, and topic are required fields.',
      });
    }

    const scheduledDate = new Date(scheduledDateTime);
    if (isNaN(scheduledDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: 'Invalid date/time format provided.',
      });
    }

    // Generate collision-resistant WebRTC room token
    const roomToken = `v26-${crypto.randomBytes(8).toString('hex')}`;

    const meeting = await Meeting.create({
      mentorEmail: mentorEmail.toLowerCase().trim(),
      menteeEmail: menteeEmail.toLowerCase().trim(),
      scheduledDateTime: scheduledDate,
      topic: topic.trim(),
      craftDomain: craftDomain || 'General Mentorship',
      durationMinutes: durationMinutes || 30,
      agendaItems: Array.isArray(agendaItems) ? agendaItems : [],
      roomToken,
      status: 'confirmed',
    });

    return res.status(201).json({
      success: true,
      data: meeting,
    });
  } catch (err) {
    console.error('Schedule Meeting Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while scheduling mentorship meeting.',
    });
  }
};

// @desc    Get all meetings for a user (as mentor or mentee)
// @route   GET /api/meetings/user/:email
// @access  Public / Protected
exports.getUserMeetings = async (req, res) => {
  try {
    const email = req.params.email.toLowerCase().trim();

    const meetings = await Meeting.find({
      $or: [{ mentorEmail: email }, { menteeEmail: email }],
    }).sort({ scheduledDateTime: 1 });

    return res.status(200).json({
      success: true,
      count: meetings.length,
      data: meetings,
    });
  } catch (err) {
    console.error('Get User Meetings Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching mentorship meetings.',
    });
  }
};

// @desc    Get meeting details by unique WebRTC room token
// @route   GET /api/meetings/room/:roomToken
// @access  Public / Protected
exports.getMeetingByRoomToken = async (req, res) => {
  try {
    const { roomToken } = req.params;

    const meeting = await Meeting.findOne({ roomToken });
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'No mentorship room found matching this access token.',
      });
    }

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (err) {
    console.error('Get Room Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while loading meeting room.',
    });
  }
};

// @desc    Update meeting status or log session notes
// @route   PATCH /api/meetings/:id
// @access  Public / Protected
exports.updateMeeting = async (req, res) => {
  try {
    const { status, sessionNotes, callStartedAt, callEndedAt } = req.body;

    const updates = {};
    if (status) updates.status = status;
    if (typeof sessionNotes === 'string') updates.sessionNotes = sessionNotes;
    if (callStartedAt) updates.callStartedAt = new Date(callStartedAt);
    if (callEndedAt) updates.callEndedAt = new Date(callEndedAt);

    const meeting = await Meeting.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    });

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: 'Meeting not found.',
      });
    }

    return res.status(200).json({
      success: true,
      data: meeting,
    });
  } catch (err) {
    console.error('Update Meeting Error:', err);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating meeting.',
    });
  }
};