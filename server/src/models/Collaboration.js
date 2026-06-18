const Project = require("./projectModel");
const Collaboration = require("./Collaboration");

/* --- 1. PROJECT CORE LOGIC --- */

// @desc    Create new project
exports.createProject = async (req, res) => {
  try {
    const { title, description, skillsRequired } = req.body;

    const project = new Project({
      title,
      description,
      skillsRequired,
      owner: req.user.id // Automatically linked via authMiddleware
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all projects
exports.getProjects = async (req, res) => {
  try {
    const projects = await Project.find()
      .populate("owner", ["name", "email"])
      .populate("collaborators.user", ["name", "email"]);
    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get project by ID
exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", ["name", "email"])
      .populate("collaborators.user", ["name", "email"]);

    if (!project) return res.status(404).json({ message: "Project not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* --- 2. COLLABORATION ENGINE (The "Vision 2026" Core) --- */

// @desc    Request to join (Creates a separate Collaboration record)
exports.requestToJoin = async (req, res) => {
  try {
    const projectId = req.params.id;
    const senderId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Project not found" });

    // Security Check: Don't let owner join own project
    if (project.owner.toString() === senderId) {
      return res.status(400).json({ message: "Owners cannot join their own projects" });
    }

    // Check for existing pending request
    const existing = await Collaboration.findOne({ project: projectId, sender: senderId });
    if (existing) return res.status(400).json({ message: "Request already pending or sent" });

    const newRequest = await Collaboration.create({
      project: projectId,
      sender: senderId,
      receiver: project.owner,
      status: "pending"
    });

    res.status(201).json({ message: "Request sent successfully", data: newRequest });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Accept Request (Moves sender into Project.collaborators)
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params; 
    const userId = req.user.id; 

    const request = await Collaboration.findById(requestId);
    if (!request || request.receiver.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized or request not found" });
    }

    request.status = "accepted";
    await request.save();

    // Update the Project to include the new collaborator
    await Project.findByIdAndUpdate(request.project, {
      $addToSet: { 
        collaborators: { user: request.sender, role: "collaborator" } 
      }
    });

    res.status(200).json({ message: "Collaborator accepted and added to project!" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Reject Request
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const request = await Collaboration.findById(requestId);
    if (!request || request.receiver.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized or not found" });
    }

    request.status = "rejected";
    await request.save();

    res.status(200).json({ message: "Collaboration request rejected" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};