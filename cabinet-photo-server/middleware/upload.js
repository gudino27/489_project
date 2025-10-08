// ============================================================================
// UPLOAD MIDDLEWARE CONFIGURATIONS
// ============================================================================

// REQUIRED IMPORTS 
const multer = require("multer");
const path = require("path");
const fs = require("fs").promises;
const sharp = require("sharp");

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // This function runs AFTER multer has parsed the multipart form
    // So req.body should have the category currently does not
    const category = req.body.category || "showcase";
    console.log("[MULTER] Upload category from form:", category);

    const uploadPath = path.join(__dirname, "..", "uploads", category);
    await fs.mkdir(uploadPath, { recursive: true });

    // Store the category in the file object for later use
    file.uploadCategory = category;

    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  },
});

// Get the image dimensions
async function getImageDimensions(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    return { width: null, height: null };
  }
}

// ============================================================================
// EXPORTS (add at the bottom):
module.exports = {
  upload,              // For photo uploads with disk storage
  uploadMemory,        // For in-memory uploads (like PDFs)
  getImageDimensions   // Helper function for getting image dimensions
};
// ============================================================================
