const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create the 'uploads' folder if it doesn't exist
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Saves file with a timestamp to prevent name conflicts
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 1024 * 1024 * 100 } // 100MB limit for high-res projects
});

module.exports = upload;