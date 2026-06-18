const express = require("express");
const router = express.Router();
const projectController = require("../controllers/projectController");
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../middleware/upload"); 

/* =========================================================================
   1. THE VAULT: TALENT STORAGE PIPELINE
   ========================================================================= */

// @route   POST /api/projects/deposit
// Securely binds incoming multipart files via multer before recording file parameters
router.post("/deposit", authMiddleware, upload.single("file"), projectController.depositProject);

// @route   GET /api/projects/vault/:email
// Pulls personal assets straight into the local Command Center layout
router.get("/vault/:email", authMiddleware, projectController.getVault);


/* =========================================================================
   2. COLLABORATION ENGINE ROUTES (HANDSHAKES)
   ========================================================================= */

// @route   POST /api/projects/:id/join
// Initiates a request to link up on a workspace file instance
router.post("/:id/join", authMiddleware, projectController.requestToJoin);

// @route   POST /api/projects/requests/:requestId/accept
// Approves proposal and automatically bridges peer into collaborator array
router.post("/requests/:requestId/accept", authMiddleware, projectController.acceptRequest);

// @route   POST /api/projects/requests/:requestId/reject
// Safely declines request thread and records rejection state
router.post("/requests/:requestId/reject", authMiddleware, projectController.rejectRequest);


/* =========================================================================
   3. FALLBACK MATRIX CRUD MANAGEMENT
   ========================================================================= */

router.post("/", authMiddleware, projectController.createProject);
router.get("/", authMiddleware, projectController.getProjects);
router.get("/:id", authMiddleware, projectController.getProjectById);

module.exports = router;