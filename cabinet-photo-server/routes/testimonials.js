// This file contains all testimonial-related API endpoints
// REQUIRED IMPORTS
const express = require("express");
const router = express.Router();
const { testimonialDb } = require("../db-helpers");
const { authenticateUser } = require("../middleware/auth");
const { emailTransporter } = require("../utils/email");
const { uploadMemory } = require("../middleware/upload");
// Public endpoint - Get all visible testimonials
router.get("/", async (req, res) => {
  try {
    const testimonials = await testimonialDb.getAllTestimonials(true);
    res.json(testimonials);
  } catch (error) {
    console.error("Error getting testimonials:", error);
    res.status(500).json({ error: "Failed to get testimonials" });
  }
});
// Public endpoint - Validate testimonial token
router.get("/validate-token/:token", async (req, res) => {
  try {
    const tokenData = await testimonialDb.validateToken(req.params.token);
    res.json({ valid: !!tokenData });
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(500).json({ error: "Failed to validate token" });
  }
});
// Public endpoint - Submit testimonial with photos
router.post("/submit",uploadMemory.array("photos", 5),async (req, res) => {
    try {
      const { client_name, message, rating, project_type, token } = req.body;
      // Validate token
      let tokenData;
      tokenData = await testimonialDb.validateToken(token);
      if (!tokenData) {
        return res.status(400).json({ error: "Invalid or expired token" });
      }
      // Create testimonial
      const testimonial = await testimonialDb.createTestimonial({
        client_name,
        message,
        rating: parseInt(rating),
        project_type,
        client_email: tokenData.client_email,
        token_id: tokenData.id,
      });
      // Process and save photos if any
      if (req.files && req.files.length > 0) {
        for (let i = 0; i < req.files.length; i++) {
          const file = req.files[i];
          const timestamp = Date.now();
          const filename = `testimonial_${testimonial.id}_${timestamp}_${i}.jpg`;
          const thumbnailFilename = `testimonial_${testimonial.id}_${timestamp}_${i}_thumb.jpg`;
          const filePath = `/testimonial-photos/${filename}`;
          const thumbnailPath = `/testimonial-photos/${thumbnailFilename}`;
          const fullPath = path.join(
            __dirname,
            "public",
            "testimonial-photos",
            filename
          );
          const thumbnailFullPath = path.join(
            __dirname,
            "public",
            "testimonial-photos",
            thumbnailFilename
          );
          // Ensure directory exists
          await fs.mkdir(path.dirname(fullPath), { recursive: true });
          // Process main image
          const processedImage = await sharp(file.buffer)
            .jpeg({ quality: 85 })
            .resize(1200, 1200, { fit: "inside", withoutEnlargement: true });
          const metadata = await processedImage.metadata();
          await processedImage.toFile(fullPath);
          // Create thumbnail
          await sharp(file.buffer)
            .jpeg({ quality: 80 })
            .resize(300, 300, { fit: "cover" })
            .toFile(thumbnailFullPath);
          // Save to database
          await testimonialDb.addTestimonialPhoto(testimonial.id, {
            filename,
            original_name: file.originalname,
            file_path: filePath,
            thumbnail_path: thumbnailPath,
            file_size: file.size,
            mime_type: "image/jpeg",
            width: metadata.width,
            height: metadata.height,
            display_order: i,
          });
        }
      }
      // Mark token as used
      await testimonialDb.markTokenUsed(token);
      res.json({ success: true, testimonial_id: testimonial.id });
    } catch (error) {
      console.error("Error submitting testimonial:", error);
      res.status(500).json({ error: "Failed to submit testimonial" });
    }
  }
);
// EXPORTS
module.exports = router;
// 
