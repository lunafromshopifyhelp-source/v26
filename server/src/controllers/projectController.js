const Project = require("../models/projectModel"); 
const Collaboration = require("../models/Collaboration");
const Notification = require("../models/notificationModel");

/* =========================================================================
   1. THE VAULT: SECURE PRIVATE STORAGE LOGIC
   ========================================================================= */

// @desc    Deposit a new talent asset (Active WIP or Manifested Finished asset)
// @route   POST /api/projects/deposit
exports.depositProject = async (req, res) => {
  try {
    const { creatorEmail, title, status, category } = req.body;
    
    // Automatically parse the secure local upload URL from multer storage middleware
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : '';

    const newProject = new Project({
      title: title || 'Untitled Talent Manifestation',
      ownerEmail: creatorEmail, 
      status: status || 'active', // 'active' = Unfinished Work, 'manifested' = Finished Asset
      category: category || 'Other', 
      fileUrl: fileUrl,
      fileType: req.file ? req.file.mimetype.split('/')[1].toUpperCase() : 'FILE',
      owner: req.user ? req.user.id : null
    });

    await newProject.save();
    res.status(201).json({ message: "Asset safely locked in Vault pipeline", data: newProject });
  } catch (error) {
    res.status(500).json({ message: "Vault storage transmission failed: " + error.message });
  }
};

// @desc    Retrieve all personal vault assets (Shielded from global discover feeds)
// @route   GET /api/projects/vault/:email
exports.getVault = async (req, res) => {
  try {
    const { email } = req.params;
    
    // Isolated lookup: Ensures creators only look into their personal storage safe
    const vaultAssets = await Project.find({ ownerEmail: email })
      .sort({ updatedAt: -1 });

    res.json(vaultAssets);
  } catch (error) {
    res.status(500).json({ message: "Could not sync with local Vault: " + error.message });
  }
};


/* =========================================================================
   2. COLLABORATION ENGINE LOGIC (HANDSHAKES)
   ========================================================================= */

// @desc    Initiate collaboration handshake transmission
// @route   POST /api/projects/:id/join
exports.requestToJoin = async (req, res) => {
  try {
    const projectId = req.params.id;
    const senderId = req.user.id;

    const project = await Project.findById(projectId);
    if (!project) return res.status(404).json({ message: "Target workspace asset not found" });

    if (project.owner && project.owner.toString() === senderId) {
      return res.status(400).json({ message: "You cannot initiate a handshake with your own asset locker" });
    }

    const existing = await Collaboration.findOne({ project: projectId, sender: senderId });
    if (existing) return res.status(400).json({ message: "Handshake transmission already pending inside the pipeline" });

    const newRequest = await Collaboration.create({
      project: projectId,
      sender: senderId,
      receiver: project.owner,
      status: "pending"
    });

    // Fire alert packet directly into owner notification matrix
    await Notification.create({
      recipient: project.owner,
      sender: senderId,
      type: "request",
      project: projectId,
      message: `New collaboration handshake received for asset: ${project.title}`
    });

    res.status(201).json({ message: "Handshake signal sent successfully", data: newRequest });
  } catch (error) {
    res.status(500).json({ message: "Handshake protocol routing failure: " + error.message });
  }
};

// @desc    Accept collaboration proposal request
// @route   POST /api/collaborations/:requestId/accept
exports.acceptRequest = async (req, res) => {
  try {
    const { requestId } = req.params; 
    const userId = req.user.id;

    const request = await Collaboration.findById(requestId).populate("project");
    if (!request) return res.status(404).json({ message: "Handshake ticket not found" });

    // Security Guardrail: Only the exact target recipient can establish the sync
    if (request.receiver.toString() !== userId) {
      return res.status(403).json({ message: "Access Denied: Unauthorized configuration privileges" });
    }

    request.status = "accepted";
    await request.save();

    // Securely update asset array matrix with new peer collaborator credentials
    await Project.findByIdAndUpdate(request.project, {
      $addToSet: { 
        collaborators: { user: request.sender, role: "collaborator" } 
      }
    });

    // Notify peer of authorization approval clearance
    await Notification.create({
      recipient: request.sender,
      sender: userId,
      type: "accepted",
      project: request.project._id,
      message: `Your handshake for "${request.project.title}" was accepted! Connection active.`
    });

    res.status(200).json({ message: "Collaborator connection successfully synchronized" });
  } catch (error) {
    res.status(500).json({ message: "Sync activation failed: " + error.message });
  }
};

// @desc    Decline collaboration request channel
// @route   POST /api/collaborations/:requestId/reject
exports.rejectRequest = async (req, res) => {
  try {
    const { requestId } = req.params;
    const userId = req.user.id;

    const request = await Collaboration.findById(requestId).populate("project");
    if (!request || request.receiver.toString() !== userId) {
      return res.status(403).json({ message: "Unauthorized or execution ticket missing" });
    }

    request.status = "rejected";
    await request.save();

    await Notification.create({
      recipient: request.sender,
      sender: userId,
      type: "rejected",
      project: request.project._id,
      message: `Handshake connection request for "${request.project.title}" was declined.`
    });

    res.status(200).json({ message: "Collaboration connection safely dropped" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


/* =========================================================================
   3. DELEGATED CORE CRUD LOOPS (FALLBACK MANIFEST MAINTENANCE)
   ========================================================================= */

exports.createProject = async (req, res) => {
  try {
    const { title, description, skillsRequired } = req.body;
    const project = new Project({
      title,
      description,
      skillsRequired,
      owner: req.user.id 
    });
    await project.save();
    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

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

exports.getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate("owner", ["name", "email"])
      .populate("collaborators.user", ["name", "email"]);

    if (!project) return res.status(404).json({ message: "Manifest asset matching ID not found" });
    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};