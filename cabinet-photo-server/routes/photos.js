// This file contains all photo-related API endpoints
// REQUIRED IMPORTS
const express = require("express");
const router = express.Router();
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const { photoDb } = require("../db-helpers");
const { authenticateUser } = require("../middleware/auth");
const { upload } = require("../middleware/upload");

async function getImageDimensions(filePath) {
  try {
    const metadata = await sharp(filePath).metadata();
    return { width: metadata.width, height: metadata.height };
  } catch (error) {
    console.error("Error getting image dimensions:", error);
    return { width: null, height: null };
  }
}

// Gets all photos
router.get("/", async (req, res) => {
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");

  try {
    const photos = await photoDb.getAllPhotos();
    // Sort by display_order first, then by uploaded_at
    const sortedPhotos = photos.sort((a, b) => {
      if (a.category === b.category) {
        return (a.display_order || 999) - (b.display_order || 999);
      }
      return a.category.localeCompare(b.category);
    });
    const formattedPhotos = sortedPhotos.map((photo) => {
      const filePath = photo.file_path.replace(/\\/g, "/");
      const thumbnailPath = photo.thumbnail_path
        ? `thumbnails/${photo.thumbnail_path.split("/").pop()}`
        : null;
      return {
        ...photo,
        full: `/${filePath}`,
        thumbnail: thumbnailPath ? `/photos/${thumbnailPath}` : null,
        url: `/photos/${filePath}`,
        featured: photo.featured === 1,
      };
    });
    res.json(formattedPhotos);
  } catch (error) {
    console.error("Error fetching photos:", error);
    res.status(500).json({ error: "Failed to fetch photos" });
  }
});
// Upload photo
router.post("/", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }
    const category = req.file.uploadCategory || req.body.category || "showcase";
    console.log("[UPLOAD] Final category:", category);
    console.log("[UPLOAD] File saved to:", req.file.path);
    console.log("[UPLOAD] Filename:", req.file.filename);
    const relativePath = `${category}/${req.file.filename}`;
    // Generate thumbnails
    const thumbnailDir = path.join(__dirname, "..", "uploads", "thumbnails");
    await fs.mkdir(thumbnailDir, { recursive: true });
    const thumbnailFilename = `thumb_${req.file.filename}`;
    const thumbnailPath = `thumbnails/${thumbnailFilename}`;
    const thumbnailFullPath = path.join(
      __dirname,
      "..",
      "uploads",
      thumbnailPath
    );
    try {
      await sharp(req.file.path)
        .resize(400, 300, { fit: "inside" })
        .jpeg({ quality: 100 })
        .toFile(thumbnailFullPath);
      console.log("[THUMBNAIL] Created:", thumbnailFullPath);
    } catch (err) {
      console.error("[THUMBNAIL] Error:", err);
    }
    const dimensions = await getImageDimensions(req.file.path);
    const photoId = await photoDb.createPhoto({
      title: req.body.title || req.file.originalname.split(".")[0],
      filename: req.file.filename,
      original_name: req.file.originalname,
      category: category,
      file_path: relativePath,
      thumbnail_path: thumbnailPath,
      file_size: req.file.size,
      mime_type: req.file.mimetype,
      width: dimensions.width,
      height: dimensions.height,
      featured: req.body.featured === "true",
    });

    console.log("[DATABASE] Saved with ID:", photoId);

    const photo = await photoDb.getPhoto(photoId);

    res.json({
      success: true,
      photo: {
        ...photo,
        full: `/${relativePath}`,
        thumbnail: `photos/thumbnails/${thumbnailPath}`,
        url: `/photos/${relativePath}`,
        featured: photo.featured === 1,
      },
    });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ error: "Failed to upload photo: " + error.message });
  }
});
router.put("/reorder", async (req, res) => {
  try {
    const { photoIds } = req.body;

    if (!Array.isArray(photoIds) || photoIds.length === 0) {
      return res.status(400).json({ error: "Invalid photo IDs array" });
    }

    console.log("[REORDER] Updating order for photos:", photoIds);

    await photoDb.updatePhotoOrder(photoIds);

    res.json({ success: true, message: "Photo order updated successfully" });
  } catch (error) {
    console.error("[REORDER] Error:", error);
    res
      .status(500)
      .json({ error: "Failed to update photo order: " + error.message });
  }
});
// Updates the photo
router.put("/:id", async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);
    const updates = {};

    // Only update allowed fields
    const allowedFields = ["title", "category", "featured", "display_order"];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
        // Convert boolean featured to integer
        if (field === "featured") {
          updates[field] = req.body[field] ? 1 : 0;
        }
      }
    });
    // Handle category change file moving logic
    if (updates.category) {
      const photo = await photoDb.getPhoto(photoId);
      if (photo && photo.category !== updates.category) {
        const oldPath = path.join(
          __dirname,
          "..",
          "uploads",
          photo.category,
          photo.filename
        );
        console.log("[MOVE] Old path:", oldPath);
        console.log("[MOVE] New category:", updates.category);
        console.log("[MOVE] Filename:", photo.filename);
        const newPath = path.join(
          __dirname,
          "..",
          "uploads",
          updates.category,
          photo.filename
        );
        await fs.mkdir(
          path.join(__dirname, "..", "uploads", updates.category),
          {
            recursive: true,
          }
        );

        try {
          await fs.rename(oldPath, newPath);
          console.log(`[MOVE] Moved file from ${oldPath} to ${newPath}`);
          updates.file_path = `${updates.category}/${photo.filename}`;
          console.log("[MOVE] Updated file_path to:", updates.file_path);
        } catch (error) {
          console.error("[MOVE] Error moving file:", error);
        }
      }
    }

    const success = await photoDb.updatePhoto(photoId, updates);

    if (success) {
      const photo = await photoDb.getPhoto(photoId);
      const filePath = photo.file_path.replace(/\\/g, "/");
      const thumbnailPath = photo.thumbnail_path
        ? photo.thumbnail_path.replace(/\\/g, "/")
        : null;

      res.json({
        success: true,
        photo: {
          ...photo,
          full: `/photos/${filePath}`,
          thumbnail: thumbnailPath ? `/photos/${thumbnailPath}` : null,
          url: `/photos/${filePath}`,
          featured: photo.featured === 1,
        },
      });
    } else {
      res.status(404).json({ error: "Photo not found" });
    }
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update photo" });
  }
});
// Delete photo
router.delete("/:id", async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);

    const photo = await photoDb.getPhoto(photoId);
    if (!photo) {
      return res.status(404).json({ error: "Photo not found" });
    }
    console.log("[DELETE] Photo info:", photo);
    // Delete files from filesystem (existing logic)
    try {
      const mainFilePath = path.join(
        __dirname,
        "..",
        "uploads",
        photo.file_path.replace(/\\/g, "/")
      );
      console.log("[DELETE] Attempting to delete:", mainFilePath);

      try {
        await fs.unlink(mainFilePath);
        console.log("[DELETE] Successfully deleted main file");
      } catch (err) {
        const altPath = path.join(
          __dirname,
          "..",
          "uploads",
          photo.category,
          photo.filename
        );
        console.log("[DELETE] First attempt failed, trying:", altPath);
        await fs.unlink(altPath);
        console.log("[DELETE] Successfully deleted main file (alt path)");
      }

      if (photo.thumbnail_path) {
        const thumbnailFilePath = path.join(
          __dirname,
          "..",
          "uploads",
          photo.thumbnail_path.replace(/\\/g, "/")
        );
        try {
          await fs.unlink(thumbnailFilePath);
          console.log("[DELETE] Successfully deleted thumbnail");
        } catch (err) {
          console.warn("[DELETE] Could not delete thumbnail:", err.message);
        }
      }
    } catch (fileError) {
      console.warn("[DELETE] Error deleting files:", fileError.message);
    }

    const success = await photoDb.deletePhoto(photoId);

    if (success) {
      res.json({ success: true, message: "Photo deleted successfully" });
    } else {
      res.status(404).json({ error: "Photo not found in database" });
    }
  } catch (error) {
    console.error("Delete error:", error);
    res.status(500).json({ error: "Failed to delete photo" });
  }
});
// Get a single photo
router.get("/:id", async (req, res) => {
  try {
    const photoId = parseInt(req.params.id);
    const photo = await photoDb.getPhoto(photoId);

    if (photo) {
      const filePath = photo.file_path.replace(/\\/g, "/");
      const thumbnailPath = photo.thumbnail_path
        ? photo.thumbnail_path.replace(/\\/g, "/")
        : null;

      res.json({
        ...photo,
        full: `/photos/${filePath}`,
        thumbnail: thumbnailPath ? `/photos/${thumbnailPath}` : null,
        url: `/photos/${filePath}`,
        featured: photo.featured === 1,
      });
    } else {
      res.status(404).json({ error: "Photo not found" });
    }
  } catch (error) {
    console.error("Error fetching photo:", error);
    res.status(500).json({ error: "Failed to fetch photo" });
  }
});
// EXPORT
module.exports = router;
