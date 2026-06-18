const Profile = require("../models/profileModel"); 
const Project = require("../models/projectModel");

// @desc    CREATE or UPDATE profile
// @route   POST /api/profiles
exports.createOrUpdateProfile = async (req, res) => {
  try {
    const { bio, skills, genres, socialLinks } = req.body;

    const profileData = {
      user: req.user.id,
      bio,
      skills,
      genres,
      socialLinks
    };

    // This findOneAndUpdate with 'upsert: true' handles both create and update
    let profile = await Profile.findOneAndUpdate(
      { user: req.user.id },
      { $set: profileData },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    GET logged-in user's full dashboard (Profile + Projects)
// @route   GET /api/profiles/me
exports.getMyProfile = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id })
      .populate("user", ["name", "email"]);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // This finds projects where you are the owner OR a collaborator
    const myProjects = await Project.find({
      $or: [
        { owner: req.user.id },
        { "collaborators.user": req.user.id }
      ]
    }).populate("owner", ["name", "email"]);

    res.json({
      profile,
      myProjects
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    GET all profiles
// @route   GET /api/profiles
exports.getAllProfiles = async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "email"]);
    res.json(profiles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    GET profile by User ID
// @route   GET /api/profiles/user/:userId
exports.getProfileByUserId = async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.params.userId })
      .populate("user", ["name", "email"]);

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.json(profile);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};