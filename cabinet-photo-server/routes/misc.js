// This file contains utility endpoints: health check, sitemap, robots.txt, etc.
// REQUIRED IMPORTS
const express = require("express");
const router = express.Router();
const fs = require("fs").promises;
const path = require("path");
const { getDb, photoDb, testimonialDb } = require("../db-helpers");
const { authenticateUser, requireRole } = require("../middleware/auth");
const PORT = process.env.PORT || 3001;
// Gets the storage info
router.get("/api/storage-info", async (req, res) => {
  try {
    const db = await getDb();

    const stats = await db.get(`
      SELECT 
        COUNT(*) as total_photos,
        SUM(file_size) as total_size,
        COUNT(CASE WHEN featured = 1 THEN 1 END) as featured_count
      FROM photos
    `);

    const categoryStats = await db.all(`
      SELECT category, COUNT(*) as count
      FROM photos
      GROUP BY category
    `);

    //await db.close();

    const categoryBreakdown = {};
    categoryStats.forEach((stat) => {
      categoryBreakdown[stat.category] = stat.count;
    });

    res.json({
      totalPhotos: stats.total_photos || 0,
      totalStorageUsed: stats.total_size
        ? `${(stats.total_size / 1024 / 1024).toFixed(2)} MB`
        : "0 MB",
      featuredCount: stats.featured_count || 0,
      byCategory: categoryBreakdown,
      storagePath: path.resolve("uploads"),
      serverUrl: `https://api.gudinocustom.com:${PORT}`,
    });
  } catch (error) {
    console.error("Storage info error:", error);
    res.status(500).json({ error: "Failed to get storage info" });
  }
});
// Add authentication to debug uploads
router.get("/api/debug/uploads",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
    try {
      const uploadsDir = path.join(__dirname, "uploads");
      const categories = await fs.readdir(uploadsDir);

      const structure = {};
      for (const category of categories) {
        const categoryPath = path.join(uploadsDir, category);
        const stat = await fs.stat(categoryPath);
        if (stat.isDirectory()) {
          const files = await fs.readdir(categoryPath);
          structure[category] = files;
        }
      }

      res.json({ uploadsDir, structure });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

// Health check endpoint
router.get("/api/health", async (req, res) => {
  try {
    const health = {
      status: "OK",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      environment: process.env.NODE_ENV || "development",
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      checks: {},
    };

    // Database connectivity check
    try {
      const testQuery = await photoDb.get("SELECT 1 as test");
      health.checks.database = {
        status: "OK",
        message: "Database connection successful",
      };
    } catch (error) {
      health.checks.database = {
        status: "ERROR",
        message: `Database error: ${error.message}`,
      };
      health.status = "DEGRADED";
    }

    // File system checks
    try {
      const uploadsDir = path.join(__dirname, "uploads");
      await fs.access(uploadsDir);
      health.checks.uploads = {
        status: "OK",
        message: "Uploads directory accessible",
      };
    } catch (error) {
      health.checks.uploads = {
        status: "ERROR",
        message: `Uploads directory error: ${error.message}`,
      };
      health.status = "DEGRADED";
    }

    // Dependencies check
    health.checks.dependencies = {
      status: "OK",
      express: require("express/package.json").version,
      sharp: require("sharp/package.json").version,
    };

    // Set appropriate HTTP status code
    const statusCode =
      health.status === "OK" ? 200 : health.status === "DEGRADED" ? 200 : 503;

    res.status(statusCode).json(health);
  } catch (error) {
    res.status(503).json({
      status: "ERROR",
      timestamp: new Date().toISOString(),
      error: error.message,
    });
  }
});
// Dynamic sitemap generation
router.get("/sitemap.xml", async (req, res) => {
  try {
    const baseUrl = "https://gudinocustom.com";
    const currentDate = new Date().toISOString();

    // Get all photos to extract categories and recent updates
    const photos = await photoDb.getAllPhotos();
    const categories = [...new Set(photos.map((photo) => photo.category))];
    const latestPhotoDate =
      photos.length > 0
        ? new Date(
            Math.max(...photos.map((photo) => new Date(photo.uploaded_at)))
          ).toISOString()
        : currentDate;

    // Get testimonials for last modified date
    const testimonials = await testimonialDb.getAllTestimonials(true);
    const latestTestimonialDate =
      testimonials.length > 0
        ? new Date(
            Math.max(...testimonials.map((t) => new Date(t.created_at)))
          ).toISOString()
        : currentDate;

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <!-- Main Pages -->
  <url>
    <loc>${baseUrl}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>${baseUrl}/portfolio</loc>
    <lastmod>${latestPhotoDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/design</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/about</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/contact</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  
  <!-- Portfolio Category Pages -->
${categories
  .map((category) => {
    const categoryPhotos = photos.filter((p) => p.category === category);
    const latestCategoryUpdate =
      categoryPhotos.length > 0
        ? new Date(
            Math.max(...categoryPhotos.map((p) => new Date(p.uploaded_at)))
          ).toISOString()
        : currentDate;

    return `  <url>
    <loc>${baseUrl}/portfolio?category=${encodeURIComponent(category)}</loc>
    <lastmod>${latestCategoryUpdate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
  })
  .join("\n")}

  <!-- Services Pages (inferred from categories) -->
  <url>
    <loc>${baseUrl}/services/kitchen-cabinets</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/services/bathroom-vanities</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/services/custom-woodworking</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/services/cabinet-design</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Testimonials Page -->
  <url>
    <loc>${baseUrl}/testimonials</loc>
    <lastmod>${latestTestimonialDate}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- FAQ and Info Pages -->
  <url>
    <loc>${baseUrl}/faq</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>${baseUrl}/process</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
</urlset>`;

    res.set("Content-Type", "application/xml");
    res.send(sitemap);
  } catch (error) {
    console.error("Sitemap generation error:", error);
    res.status(500).json({ error: "Failed to generate sitemap" });
  }
});
// Robots.txt for SEO
router.get("/robots.txt", (req, res) => {
  const robotsTxt = `User-agent: *
Allow: /

# Sitemap
Sitemap: https://gudinocustom.com/sitemap.xml

# Disallow admin and private areas
Disallow: /admin
Disallow: /api/
Disallow: /reset-password

# Allow specific API endpoints that should be crawled
Allow: /api/photos
Allow: /api/testimonials

# Crawl delay (optional)
Crawl-delay: 1`;

  res.set("Content-Type", "text/plain");
  res.send(robotsTxt);
});
// List uploads directory (for debugging)
router.get("/api/debug/uploads", async (req, res) => {
  try {
    const uploadsDir = path.join(__dirname, "uploads");
    const categories = await fs.readdir(uploadsDir);

    const structure = {};
    for (const category of categories) {
      const categoryPath = path.join(uploadsDir, category);
      const stat = await fs.stat(categoryPath);
      if (stat.isDirectory()) {
        const files = await fs.readdir(categoryPath);
        structure[category] = files;
      }
    }

    res.json({ uploadsDir, structure });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// EXPORTS
module.exports = router;
