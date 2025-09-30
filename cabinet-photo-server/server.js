require("dotenv").config();
const express = require("express");
const multer = require("multer");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const cors = require("cors");
const {
  photoDb,
  employeeDb,
  designDb,
  userDb,
  analyticsDb,
  testimonialDb,
  invoiceDb,
} = require("./db-helpers");
const nodemailer = require("nodemailer");
const twilio = require("twilio");
const htmlPdf = require("html-pdf-node");

// PDF generation helper with retry mechanism
async function generatePdfWithRetry(htmlContent, options, maxRetries = 3) {
  let pdfBuffer;
  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`PDF generation attempt ${attempt}/${maxRetries}...`);
      const file = { content: htmlContent };
      pdfBuffer = await htmlPdf.generatePdf(file, options);
      console.log(
        `PDF generated successfully on attempt ${attempt}, size: ${pdfBuffer.length} bytes`
      );
      return pdfBuffer;
    } catch (error) {
      lastError = error;
      console.error(`PDF generation attempt ${attempt} failed:`, error.message);

      if (attempt < maxRetries) {
        const delay = attempt * 2000; // 2s, 4s delays
        console.log(`Retrying in ${delay / 1000} seconds...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw new Error(
    `PDF generation failed after ${maxRetries} attempts. Last error: ${lastError.message}`
  );
}
const app = express();
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "https://gudinocustom.com",
      "https://www.gudinocustom.com",
      "https://api.gudinocustom.com",
    ],
    credentials: true, // Allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());
// Middleware to handle sendBeacon requests (sent as text/plain)
app.use("/api/analytics/time", express.text({ type: "text/plain" }));
app.use("/api/analytics/time", (req, res, next) => {
  if (
    req.headers["content-type"] === "text/plain" &&
    typeof req.body === "string"
  ) {
    try {
      req.body = JSON.parse(req.body);
    } catch (e) {
      return res.status(400).json({ error: "Invalid JSON in request body" });
    }
  }
  next();
});

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});
const emailTransporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: process.env.EMAIL_SECURE === "true",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Initialize Twilio client
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    if (process.env.TWILIO_ACCOUNT_SID.startsWith("AC")) {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log("✅ Twilio client initialized successfully");
    } else {
      console.warn(
        '⚠️  Invalid Twilio Account SID format. Account SID must start with "AC"'
      );
    }
  } catch (error) {
    console.error("⚠️  Failed to initialize Twilio client:", error.message);
  }
}

// SMS routing helper functions
async function getSmsRoutingRecipients(messageType) {
  const db = await getDb();
  try {
    const recipients = await db.all(
      `SELECT phone_number, name FROM sms_routing_recipients
       WHERE message_type = ? AND is_active = 1
       ORDER BY priority_order ASC`,
      [messageType]
    );
    return recipients;
  } catch (error) {
    console.error("Error getting SMS routing recipients:", error);
    return [];
  }
}

async function getSmsRoutingSettings(messageType) {
  const db = await getDb();
  try {
    const settings = await db.get(
      "SELECT * FROM sms_routing_settings WHERE message_type = ?",
      [messageType]
    );
    return settings || { is_enabled: true, routing_mode: "single" };
  } catch (error) {
    console.error("Error getting SMS routing settings:", error);
    return { is_enabled: true, routing_mode: "single" };
  }
}

async function sendSmsWithRouting(messageType, messageBody, options = {}) {
  if (!twilioClient) {
    console.warn("⚠️  Twilio client not available for SMS routing");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const settings = await getSmsRoutingSettings(messageType);

    if (!settings.is_enabled) {
      console.log(`📱 SMS routing disabled for ${messageType}`);
      return { success: true, message: "SMS routing disabled" };
    }

    const recipients = await getSmsRoutingRecipients(messageType);

    if (recipients.length === 0) {
      console.warn(`⚠️  No SMS recipients configured for ${messageType}`);
      return { success: false, error: "No recipients configured" };
    }

    const results = [];
    const targetRecipients =
      settings.routing_mode === "single" ? [recipients[0]] : recipients;

    for (const recipient of targetRecipients) {
      try {
        const smsOptions = {
          body: messageBody,
          to: recipient.phone_number,
        };

        if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
          smsOptions.messagingServiceSid =
            process.env.TWILIO_MESSAGING_SERVICE_SID;
        } else if (process.env.TWILIO_PHONE_NUMBER) {
          smsOptions.from = process.env.TWILIO_PHONE_NUMBER;
        }

        const result = await twilioClient.messages.create(smsOptions);

        // Log to SMS routing history
        const db = await getDb();
        await db.run(
          `INSERT INTO sms_routing_history
           (message_type, recipient_phone, recipient_name, message_content, twilio_sid, delivery_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            messageType,
            recipient.phone_number,
            recipient.name,
            messageBody,
            result.sid,
            "sent",
          ]
        );

        results.push({
          success: true,
          recipient: recipient.name,
          phone: recipient.phone_number,
          sid: result.sid,
        });

        console.log(
          `📱 SMS sent to ${recipient.name} (${recipient.phone_number}) - SID: ${result.sid}`
        );
      } catch (error) {
        const db = await getDb();
        await db.run(
          `INSERT INTO sms_routing_history
           (message_type, recipient_phone, recipient_name, message_content, delivery_status, error_message)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            messageType,
            recipient.phone_number,
            recipient.name,
            messageBody,
            "failed",
            error.message,
          ]
        );

        results.push({
          success: false,
          recipient: recipient.name,
          phone: recipient.phone_number,
          error: error.message,
        });

        console.error(`⚠️  SMS failed to ${recipient.name}: ${error.message}`);
      }
    }

    return {
      success: results.some((r) => r.success),
      results,
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
    };
  } catch (error) {
    console.error("SMS routing error:", error);
    return { success: false, error: error.message };
  }
}

// Middleware for authentication
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ error: "No authentication token provided" });
  }

  try {
    const user = await userDb.validateSession(token);

    if (!user) {
      return res.status(401).json({ error: "Invalid or expired token" });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Auth error:", error);
    res.status(500).json({ error: "Authentication failed" });
  }
};

// Middleware for role-based access control
const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Authentication required" });
    }

    const userRole = req.user.role;
    const roles = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

    if (!roles.includes(userRole)) {
      return res.status(403).json({ error: "Insufficient permissions" });
    }

    next();
  };
};
// IMPORTANT: Serve static files from uploads directory
app.use("/photos", express.static(path.join(__dirname, "uploads")));

//fully working to sort the photos by category on upload
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    // This function runs AFTER multer has parsed the multipart form
    // So req.body should have the category currently does not
    const category = req.body.category || "showcase";
    console.log("[MULTER] Upload category from form:", category);

    const uploadPath = path.join(__dirname, "uploads", category);
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

// Routes

// Gets all photos
app.get("/api/photos", async (req, res) => {
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
app.post("/api/photos", upload.single("photo"), async (req, res) => {
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
    const thumbnailDir = path.join(__dirname, "uploads", "thumbnails");
    await fs.mkdir(thumbnailDir, { recursive: true });

    const thumbnailFilename = `thumb_${req.file.filename}`;
    const thumbnailPath = `thumbnails/${thumbnailFilename}`;
    const thumbnailFullPath = path.join(__dirname, "uploads", thumbnailPath);

    try {
      await sharp(req.file.path)
        .resize(400, 300, { fit: "inside" })
        .jpeg({ quality: 80 })
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
app.put("/api/photos/reorder", async (req, res) => {
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
app.put("/api/photos/:id", async (req, res) => {
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
          "uploads",
          photo.category,
          photo.filename
        );
        const newPath = path.join(
          __dirname,
          "uploads",
          updates.category,
          photo.filename
        );

        await fs.mkdir(path.join(__dirname, "uploads", updates.category), {
          recursive: true,
        });

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
app.delete("/api/photos/:id", async (req, res) => {
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
app.get("/api/photos/:id", async (req, res) => {
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

// Gets the storage info
app.get("/api/storage-info", async (req, res) => {
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
app.get(
  "/api/debug/uploads",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
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
app.get("/api/auth/me", authenticateUser, (req, res) => {
  res.json({ user: req.user });
});
// Login route
app.post("/api/auth/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await userDb.authenticateUser(username, password);

    if (!result) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    res.json({
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Login failed" });
  }
});

app.post("/api/auth/logout", authenticateUser, async (req, res) => {
  try {
    // In a real implementation, you'd invalidate the session token
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});

// User management endpoints (super admin only)
app.get(
  "/api/users",
  authenticateUser,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const includeInactive = req.query.includeInactive === "true";
      const users = await userDb.getAllUsers();

      // Filter out inactive users unless specifically requested
      const filteredUsers = includeInactive
        ? users
        : users.filter((user) => user.is_active === 1);

      res.json(filteredUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  }
);

app.post(
  "/api/users",
  authenticateUser,
  requireRole("super_admin"),
  async (req, res) => {
    const { username, email, password, role, full_name } = req.body;

    try {
      // Validate input
      if (!username || !email || !password) {
        return res
          .status(400)
          .json({ error: "Username, email, and password are required" });
      }

      if (!["admin", "super_admin"].includes(role)) {
        return res.status(400).json({ error: "Invalid role" });
      }

      const userId = await userDb.createUser({
        username,
        email,
        password,
        role,
        full_name,
        created_by: req.user.id,
      });

      res.status(201).json({
        message: "User created successfully",
        userId,
      });
    } catch (error) {
      console.error("Error creating user:", error);
      if (error.message.includes("UNIQUE constraint failed")) {
        res.status(400).json({ error: "Username or email already exists" });
      } else {
        res.status(500).json({ error: "Failed to create user" });
      }
    }
  }
);

app.put(
  "/api/users/:id",
  authenticateUser,
  requireRole("super_admin"),
  async (req, res) => {
    const userId = parseInt(req.params.id);
    const updates = req.body;

    try {
      // Prevent super admin from demoting themselves
      if (
        userId === req.user.id &&
        updates.role &&
        updates.role !== "super_admin"
      ) {
        return res
          .status(400)
          .json({ error: "Cannot change your own role from super_admin" });
      }

      // Validate role if provided
      if (updates.role && !["admin", "super_admin"].includes(updates.role)) {
        return res
          .status(400)
          .json({ error: "Invalid role. Must be admin or super_admin" });
      }

      const success = await userDb.updateUser(userId, updates);

      if (!success) {
        return res
          .status(400)
          .json({ error: "User not found or no valid fields to update" });
      }

      res.json({ message: "User updated successfully" });
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  }
);

app.delete(
  "/api/users/:id",
  authenticateUser,
  requireRole("super_admin"),
  async (req, res) => {
    const userId = parseInt(req.params.id);

    try {
      // Prevent super admin from deleting themselves
      if (userId === req.user.id) {
        return res
          .status(400)
          .json({ error: "Cannot delete your own account" });
      }

      // delete the user
      const db = await getDb();
      const result = await db.run("DELETE FROM users WHERE id = ?", userId);
      //await db.close();

      if (result.changes > 0) {
        res.json({ message: "User deleted successfully" });
      } else {
        res.status(404).json({ error: "User not found" });
      }
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  }
);

// Get all employees
app.get("/api/employees", async (req, res) => {
  try {
    const includeInactive = req.query.includeInactive === "true";
    const employees = await employeeDb.getAllEmployees(includeInactive);

    // Add full photo URL to each employee
    const employeesWithPhotos = employees.map((emp) => ({
      ...emp,
      photo_url: emp.photo_path
        ? `/photos/employees/${emp.photo_filename}`
        : null,
      is_active: emp.is_active === 1,
    }));

    res.json(employeesWithPhotos);
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ error: "Failed to fetch employees" });
  }
});

// Get single employee
app.get("/api/employees/:id", async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const employee = await employeeDb.getEmployee(employeeId);

    if (employee) {
      employee.photo_url = employee.photo_path
        ? `/photos/employees/${employee.photo_filename}`
        : null;
      employee.is_active = employee.is_active === 1;
      res.json(employee);
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ error: "Failed to fetch employee" });
  }
});

// Create new employee with photo upload
app.post("/api/employees", upload.single("photo"), async (req, res) => {
  try {
    let photoPath = null;
    let photoFilename = null;

    // Handle photo upload if provided
    if (req.file) {
      // Create employees directory
      const employeesDir = path.join(__dirname, "uploads", "employees");
      await fs.mkdir(employeesDir, { recursive: true });

      // Generate unique filename
      const uniqueName = `emp_${Date.now()}_${Math.round(
        Math.random() * 1e9
      )}${path.extname(req.file.originalname)}`;
      const filePath = path.join(employeesDir, uniqueName);

      // Move/save the file
      if (req.file.buffer) {
        // If using memory storage
        await fs.writeFile(filePath, req.file.buffer);
      } else {
        // If using disk storage, move the file
        await fs.rename(req.file.path, filePath);
      }

      // Create thumbnail
      const thumbnailDir = path.join(
        __dirname,
        "uploads",
        "employees",
        "thumbnails"
      );
      await fs.mkdir(thumbnailDir, { recursive: true });

      const thumbnailPath = path.join(thumbnailDir, `thumb_${uniqueName}`);

      try {
        await sharp(filePath)
          .resize(200, 200, {
            fit: "cover",
            position: "center",
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
      } catch (err) {
        console.error("[THUMBNAIL] Error creating employee thumbnail:", err);
      }

      photoPath = `employees/${uniqueName}`;
      photoFilename = uniqueName;
    }

    // Save employee to database
    const employeeData = {
      name: req.body.name,
      position: req.body.position,
      bio: req.body.bio || "",
      email: req.body.email || "",
      phone: req.body.phone || "",
      photo_path: photoPath,
      photo_filename: photoFilename,
      joined_date: req.body.joined_date || null,
      display_order: req.body.display_order || 999,
    };

    const employeeId = await employeeDb.insertEmployee(employeeData);
    const newEmployee = await employeeDb.getEmployee(employeeId);

    res.json({
      success: true,
      employee: {
        ...newEmployee,
        photo_url: photoPath ? `/photos/${photoPath}` : null,
        is_active: newEmployee.is_active === 1,
      },
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res
      .status(500)
      .json({ error: "Failed to create employee: " + error.message });
  }
});
app.put("/api/employees/reorder", async (req, res) => {
  try {
    const { employeeIds } = req.body;

    if (!Array.isArray(employeeIds) || employeeIds.length === 0) {
      return res.status(400).json({ error: "Invalid employee IDs array" });
    }

    await employeeDb.updateEmployeeOrder(employeeIds);

    res.json({ success: true, message: "Employee order updated successfully" });
  } catch (error) {
    console.error("[REORDER] Error:", error);
    res.status(500).json({ error: "Failed to update employee order" });
  }
});
// Update employee
app.put("/api/employees/:id", upload.single("photo"), async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const updates = {};

    // Handle text fields
    const allowedFields = [
      "name",
      "position",
      "bio",
      "email",
      "phone",
      "joined_date",
      "display_order",
      "is_active",
    ];
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
        // Convert boolean is_active to integer
        if (field === "is_active") {
          updates[field] =
            req.body[field] === "true" || req.body[field] === true ? 1 : 0;
        }
      }
    });

    // Handle photo upload if provided
    if (req.file) {
      // Get current employee to delete old photo
      const currentEmployee = await employeeDb.getEmployee(employeeId);

      // Delete old photo if exists
      if (currentEmployee && currentEmployee.photo_path) {
        const oldPhotoPath = path.join(
          __dirname,
          "uploads",
          currentEmployee.photo_path
        );
        try {
          await fs.unlink(oldPhotoPath);
          // Also delete old thumbnail
          const oldThumbPath = path.join(
            __dirname,
            "uploads",
            "employees",
            "thumbnails",
            `thumb_${currentEmployee.photo_filename}`
          );
          await fs.unlink(oldThumbPath).catch(() => {});
        } catch (err) {
          console.log("Could not delete old photo:", err.message);
        }
      }

      // Save new photo
      const employeesDir = path.join(__dirname, "uploads", "employees");
      await fs.mkdir(employeesDir, { recursive: true });

      const uniqueName = `emp_${Date.now()}_${Math.round(
        Math.random() * 1e9
      )}${path.extname(req.file.originalname)}`;
      const filePath = path.join(employeesDir, uniqueName);

      if (req.file.buffer) {
        await fs.writeFile(filePath, req.file.buffer);
      } else {
        await fs.rename(req.file.path, filePath);
      }

      // Create thumbnail
      const thumbnailDir = path.join(
        __dirname,
        "uploads",
        "employees",
        "thumbnails"
      );
      await fs.mkdir(thumbnailDir, { recursive: true });

      const thumbnailPath = path.join(thumbnailDir, `thumb_${uniqueName}`);

      try {
        await sharp(filePath)
          .resize(200, 200, {
            fit: "cover",
            position: "center",
          })
          .jpeg({ quality: 80 })
          .toFile(thumbnailPath);
      } catch (err) {
        console.error("[THUMBNAIL] Error:", err);
      }

      updates.photo_path = `employees/${uniqueName}`;
      updates.photo_filename = uniqueName;
    }

    const success = await employeeDb.updateEmployee(employeeId, updates);

    if (success) {
      const employee = await employeeDb.getEmployee(employeeId);
      res.json({
        success: true,
        employee: {
          ...employee,
          photo_url: employee.photo_path
            ? `/photos/${employee.photo_path}`
            : null,
          is_active: employee.is_active === 1,
        },
      });
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  } catch (error) {
    console.error("Update employee error:", error);
    res.status(500).json({ error: "Failed to update employee" });
  }
});

// Delete employee
app.delete("/api/employees/:id", async (req, res) => {
  try {
    const employeeId = parseInt(req.params.id);
    const hardDelete = req.query.hard === "true";

    if (hardDelete) {
      // Get employee to delete photo
      const employee = await employeeDb.getEmployee(employeeId);
      if (employee && employee.photo_path) {
        const photoPath = path.join(__dirname, "uploads", employee.photo_path);
        try {
          await fs.unlink(photoPath);
          // Delete thumbnail too
          const thumbPath = path.join(
            __dirname,
            "uploads",
            "employees",
            "thumbnails",
            `thumb_${employee.photo_filename}`
          );
          await fs.unlink(thumbPath).catch(() => {});
        } catch (err) {
          console.log("Could not delete photo:", err.message);
        }
      }
    }

    const success = await employeeDb.deleteEmployee(employeeId, hardDelete);

    if (success) {
      res.json({ success: true, message: "Employee deleted successfully" });
    } else {
      res.status(404).json({ error: "Employee not found" });
    }
  } catch (error) {
    console.error("Delete employee error:", error);
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

// Database connection pool and helper
let dbInstance = null;
const dbOperationQueue = [];
let isProcessingQueue = false;

async function getDb() {
  if (!dbInstance) {
    const sqlite3 = require("sqlite3").verbose();
    const { open } = require("sqlite");

    dbInstance = await open({
      filename: path.join(__dirname, "database", "cabinet_photos.db"),
      driver: sqlite3.Database,
    });

    // Enable WAL mode for better concurrent access
    await dbInstance.exec("PRAGMA journal_mode = WAL;");
    await dbInstance.exec("PRAGMA synchronous = NORMAL;");
    await dbInstance.exec("PRAGMA cache_size = 1000;");
    await dbInstance.exec("PRAGMA temp_store = memory;");
  }

  return dbInstance;
}

// Queue database operations to prevent SQLITE_BUSY errors
async function queueDbOperation(operation) {
  return new Promise((resolve, reject) => {
    dbOperationQueue.push({ operation, resolve, reject });
    processQueue();
  });
}

async function processQueue() {
  if (isProcessingQueue || dbOperationQueue.length === 0) {
    return;
  }

  isProcessingQueue = true;

  while (dbOperationQueue.length > 0) {
    const { operation, resolve, reject } = dbOperationQueue.shift();

    try {
      const result = await operation();
      resolve(result);
    } catch (error) {
      reject(error);
    }

    // Small delay to prevent overwhelming the database
    await new Promise((resolve) => setTimeout(resolve, 10));
  }

  isProcessingQueue = false;
}

// Get all the pricing data
app.get("/api/prices", async (req, res) => {
  try {
    const db = await getDb();

    // Get cabinet prices
    const cabinetPrices = await db.all("SELECT * FROM cabinet_prices");
    const basePrices = {};
    cabinetPrices.forEach((item) => {
      basePrices[item.cabinet_type] = parseFloat(item.base_price);
    });

    // Get material multipliers - return new bilingual array format
    const materials = await db.all("SELECT * FROM material_pricing");
    const materialMultipliers = materials.map((item) => ({
      id: item.id,
      nameEn: item.material_name_en,
      nameEs: item.material_name_es,
      multiplier: parseFloat(item.multiplier),
    }));

    // Get color pricing
    const colors = await db.all("SELECT * FROM color_pricing");
    const colorPricing = {};
    colors.forEach((item) => {
      const key = isNaN(item.color_count)
        ? item.color_count
        : parseInt(item.color_count);
      colorPricing[key] = parseFloat(item.price_addition);
    });

    // Get wall pricing
    let wallPricing = { addWall: 1500, removeWall: 2000 };
    try {
      const walls = await db.all("SELECT * FROM wall_pricing");
      if (walls.length > 0) {
        wallPricing = {};
        walls.forEach((item) => {
          wallPricing[item.modification_type] = parseFloat(item.price);
        });
      }
    } catch (wallError) {
      console.log("Wall pricing table does not exist yet, using defaults");
    }

    //await db.close();

    console.log("Loaded prices with materials:", {
      basePrices,
      materialMultipliers,
      colorPricing,
      wallPricing,
    });

    res.json({
      basePrices,
      materialMultipliers,
      colorPricing,
      wallPricing,
    });
  } catch (error) {
    console.error("Error loading prices:", error);
    res.status(500).json({ error: "Failed to load prices" });
  }
});
// Update the cabinet prices
app.put("/api/prices/cabinets", async (req, res) => {
  try {
    const prices = req.body;
    console.log("Updating cabinet prices:", prices);

    await queueDbOperation(async () => {
      const db = await getDb();

      // Use a transaction for consistency
      await db.run("BEGIN TRANSACTION");

      try {
        // Update each cabinet price
        for (const [cabinetType, price] of Object.entries(prices)) {
          await db.run(
            `UPDATE cabinet_prices 
             SET base_price = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE cabinet_type = ?`,
            [price, cabinetType]
          );
        }

        await db.run("COMMIT");
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    });

    res.json({ success: true, message: "Cabinet prices updated successfully" });
  } catch (error) {
    console.error("Error updating cabinet prices:", error);
    res.status(500).json({ error: "Failed to update cabinet prices" });
  }
});
app.get("/api/prices/cabinets", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      "SELECT * FROM cabinet_prices ORDER BY cabinet_type"
    );

    const cabinets = {};
    rows.forEach((row) => {
      cabinets[row.cabinet_type] = parseFloat(row.base_price);
    });

    //await db.close();

    console.log("Loaded cabinet prices:", cabinets);
    res.json(cabinets);
  } catch (error) {
    console.error("Error fetching cabinet prices:", error);
    res.status(500).json({ error: "Failed to fetch cabinet prices" });
  }
});
app.get("/api/prices/materials", async (req, res) => {
  try {
    const db = await getDb();
    const materials = await db.all(
      "SELECT * FROM material_pricing ORDER BY material_name_en"
    );

    // Return bilingual format for frontend
    const materialArray = materials.map((m) => ({
      id: m.id,
      nameEn: m.material_name_en,
      nameEs: m.material_name_es,
      multiplier: parseFloat(m.multiplier),
      updated_at: m.updated_at,
      updated_by: m.updated_by,
    }));

    //await db.close();
    console.log("Loaded materials:", materialArray);
    res.json(materialArray);
  } catch (error) {
    console.error("Error fetching materials:", error);
    res.status(500).json({ error: "Failed to fetch materials" });
  }
});
// Update the material multipliers
app.put("/api/prices/materials", async (req, res) => {
  try {
    const materials = req.body;
    console.log("Saving materials:", materials);

    await queueDbOperation(async () => {
      const db = await getDb();

      // Start a transaction
      await db.run("BEGIN TRANSACTION");

      try {
        // Delete all existing materials
        await db.run("DELETE FROM material_pricing");

        // Insert all materials (including new ones)
        const stmt = await db.prepare(
          "INSERT INTO material_pricing (material_name_en, material_name_es, multiplier) VALUES (?, ?, ?)"
        );

        for (const material of materials) {
          await stmt.run(material.nameEn, material.nameEs, material.multiplier);
          console.log(
            `Inserted material: ${material.nameEn}/${material.nameEs} with multiplier: ${material.multiplier}`
          );
        }

        await stmt.finalize();
        await db.run("COMMIT");

        console.log("Materials saved successfully");
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    });

    res.json({ success: true, message: "Materials saved successfully" });
  } catch (error) {
    console.error("Error saving materials:", error);
    res
      .status(500)
      .json({ error: "Failed to save materials: " + error.message });
  }
});

// Update the color pricing
app.put("/api/prices/colors", async (req, res) => {
  try {
    const colors = req.body;
    console.log("Updating color pricing:", colors);

    await queueDbOperation(async () => {
      const db = await getDb();

      // Use a transaction for consistency
      await db.run("BEGIN TRANSACTION");

      try {
        // Update each color price
        for (const [colorCount, price] of Object.entries(colors)) {
          await db.run(
            `UPDATE color_pricing 
             SET price_addition = ?, updated_at = CURRENT_TIMESTAMP 
             WHERE color_count = ?`,
            [price, colorCount]
          );
        }

        await db.run("COMMIT");
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    });

    res.json({ success: true, message: "Color pricing updated successfully" });
  } catch (error) {
    console.error("Error updating color pricing:", error);
    res.status(500).json({ error: "Failed to update color pricing" });
  }
});
app.get("/api/prices/colors", async (req, res) => {
  try {
    const db = await getDb();
    const rows = await db.all(
      "SELECT * FROM color_pricing ORDER BY color_count"
    );

    const colors = {};
    rows.forEach((row) => {
      const key = isNaN(row.color_count)
        ? row.color_count
        : parseInt(row.color_count);
      colors[key] = parseFloat(row.price_addition);
    });

    //await db.close();

    console.log("Loaded color pricing:", colors);
    res.json(colors);
  } catch (error) {
    console.error("Error fetching color pricing:", error);
    res.status(500).json({ error: "Failed to fetch color pricing" });
  }
});
app.get("/api/prices/history", async (req, res) => {
  try {
    const db = await getDb();

    const history = await db.all(`
      SELECT 'cabinet' as type, cabinet_type as item, base_price as value, updated_at 
      FROM cabinet_prices 
      UNION ALL
      SELECT 'material' as type, (material_name_en || ' / ' || material_name_es) as item, multiplier as value, updated_at 
      FROM material_pricing
      UNION ALL
      SELECT 'color' as type, color_count as item, price_addition as value, updated_at 
      FROM color_pricing
      ORDER BY updated_at DESC
      LIMIT 50
    `);

    //await db.close();

    res.json(history);
  } catch (error) {
    console.error("Error fetching price history:", error);
    res.status(500).json({ error: "Failed to fetch price history" });
  }
});

// Wall pricing endpoints
app.get("/api/prices/walls", async (req, res) => {
  try {
    const db = await getDb();

    // Ensure wall_pricing table exists
    await db.run(`
      CREATE TABLE IF NOT EXISTS wall_pricing (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        modification_type TEXT UNIQUE NOT NULL,
        price REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Try to get wall pricing from database
    const rows = await db.all(
      "SELECT * FROM wall_pricing ORDER BY modification_type"
    );

    const walls = {};
    if (rows.length > 0) {
      rows.forEach((row) => {
        walls[row.modification_type] = parseFloat(row.price);
      });
    } else {
      // Return default values if no data in database
      walls.addWall = 1500;
      walls.removeWall = 2000;
    }

    //await db.close();

    console.log("Loaded wall pricing:", walls);
    res.json(walls);
  } catch (error) {
    console.error("Error fetching wall pricing:", error);
    // Return defaults on error
    res.json({ addWall: 1500, removeWall: 2000 });
  }
});

app.put("/api/prices/walls", async (req, res) => {
  try {
    const wallPricing = req.body;
    console.log("Updating wall pricing:", wallPricing);

    await queueDbOperation(async () => {
      const db = await getDb();

      // Ensure wall_pricing table exists
      await db.run(`
        CREATE TABLE IF NOT EXISTS wall_pricing (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          modification_type TEXT UNIQUE NOT NULL,
          price REAL NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Use a transaction for better performance and consistency
      await db.run("BEGIN TRANSACTION");

      try {
        // Update each wall price (using REPLACE to handle both INSERT and UPDATE)
        for (const [modificationType, price] of Object.entries(wallPricing)) {
          await db.run(
            `
            REPLACE INTO wall_pricing (modification_type, price, updated_at) 
            VALUES (?, ?, CURRENT_TIMESTAMP)
          `,
            [modificationType, price]
          );
        }

        await db.run("COMMIT");
      } catch (error) {
        await db.run("ROLLBACK");
        throw error;
      }
    });

    console.log("Wall pricing updated successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating wall pricing:", error);
    res.status(500).json({ error: "Failed to update wall pricing" });
  }
});

// Wall availability endpoints
app.get("/api/prices/wall-availability", async (req, res) => {
  try {
    const db = await getDb();

    // Try to get wall availability from database
    const rows = await db.all(
      "SELECT * FROM wall_availability ORDER BY service_type"
    );

    const availability = {};
    if (rows.length > 0) {
      rows.forEach((row) => {
        availability[row.service_type + "Enabled"] = Boolean(row.is_enabled);
      });
    } else {
      // Default values if table is empty
      availability.addWallEnabled = true;
      availability.removeWallEnabled = true;
    }

    //await db.close();
    res.json(availability);
  } catch (error) {
    console.error("Error fetching wall availability:", error);
    // Return defaults on error
    res.json({
      addWallEnabled: true,
      removeWallEnabled: true,
    });
  }
});

app.put("/api/prices/wall-availability", async (req, res) => {
  try {
    const db = await getDb();
    const wallAvailability = req.body;
    console.log("Updating wall availability:", wallAvailability);

    // Ensure wall_availability table exists
    await db.run(`
      CREATE TABLE IF NOT EXISTS wall_availability (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        service_type TEXT UNIQUE NOT NULL,
        is_enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Update each wall availability setting
    for (const [key, enabled] of Object.entries(wallAvailability)) {
      const serviceType = key.replace("Enabled", "");
      await db.run(
        `
        REPLACE INTO wall_availability (service_type, is_enabled, updated_at) 
        VALUES (?, ?, CURRENT_TIMESTAMP)
      `,
        [serviceType, enabled ? 1 : 0]
      );
    }

    //await db.close();
    console.log("Wall availability updated successfully");
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating wall availability:", error);
    res.status(500).json({ error: "Failed to update wall availability" });
  }
});

// Get all designs (for admin panel)
app.get("/api/designs", async (req, res) => {
  try {
    const status = req.query.status || null;
    const designs = await designDb.getAllDesigns(status);

    res.json(designs);
  } catch (error) {
    console.error("Error fetching designs:", error);
    res.status(500).json({ error: "Failed to fetch designs" });
  }
});

// Send email notification
app.post("/api/designs", uploadMemory.single("pdf"), async (req, res) => {
  try {
    console.log("\n=== NEW DESIGN SUBMISSION ===");

    // Parse design data from form data
    let designData;
    try {
      designData = JSON.parse(req.body.designData);
      console.log("Parsed design data successfully");
    } catch (parseError) {
      console.error("Failed to parse design data:", parseError);
      return res.status(400).json({ error: "Invalid design data format" });
    }

    // Add PDF buffer
    if (req.file) {
      designData.pdf_data = req.file.buffer;
      console.log("PDF size:", req.file.buffer.length, "bytes");
    }

    console.log("Design images:", {
      has_floor_plan: !!designData.floor_plan_image,
      floor_plan_size: designData.floor_plan_image
        ? designData.floor_plan_image.length
        : 0,
      wall_view_count: designData.wall_view_images?.length || 0,
      total_size: JSON.stringify(designData).length,
    });

    // Check if data is too large since SQLite sadly has limnits
    const dataSize = JSON.stringify(designData).length;
    if (dataSize > 10 * 1024 * 1024) {
      // 10MB limit
      console.warn(
        "Design data very large:",
        (dataSize / 1024 / 1024).toFixed(2),
        "MB"
      );
    }
    // Save to database
    const designId = await designDb.saveDesign(designData);
    console.log(` Design #${designId} saved for ${designData.client_name}`);

    // email notification
    const notificationType = process.env.DESIGN_NOTIFICATION_TYPE || "email";
    if (
      (notificationType === "email" || notificationType === "both") &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {
      try {
        const info = await emailTransporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: "info@gudinocustom.com",
          subject: `New Cabinet Design - ${
            designData.client_name
          } - $${designData.total_price.toFixed(2)}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">New Cabinet Design Submitted</h2>
              
              <table style="width: 100%; border-collapse: collapse;">
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Client:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">${
                    designData.client_name
                  }</td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Contact:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${
                      designData.contact_preference === "email"
                        ? designData.client_email
                        : designData.client_phone
                    }
                    (prefers ${designData.contact_preference})
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Total:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee; color: #27ae60; font-size: 18px;">
                    <strong>$${designData.total_price.toFixed(2)}</strong>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Rooms:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${
                      designData.include_kitchen
                        ? `✓ Kitchen (${
                            designData.kitchen_data?.elements?.length || 0
                          } items)<br>`
                        : ""
                    }
                    ${
                      designData.include_bathroom
                        ? `✓ Bathroom (${
                            designData.bathroom_data?.elements?.length || 0
                          } items)`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;"><strong>Design Preview:</strong></td>
                  <td style="padding: 10px; border-bottom: 1px solid #eee;">
                    ${
                      designData.floor_plan_image
                        ? "✓ Floor plan included<br>"
                        : ""
                    }
                    ${
                      designData.wall_view_images?.length
                        ? `✓ ${designData.wall_view_images.length} wall views included`
                        : ""
                    }
                  </td>
                </tr>
              </table>
              
              <div style="margin-top: 30px; text-align: center;">
                <a href="${
                  process.env.ADMIN_URL || "https://gudinocustom.com"
                }/admin#designs" 
                   style="background-color: #3498db; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                  View Design in Admin Panel
                </a>
              </div>
            </div>
          `,
        });

        console.log("📧 Email sent:", info.messageId);
      } catch (emailError) {
        console.error("⚠️  Email failed:", emailError.message);
      }
    }

    // SMS notification for design submissions using routing system
    if (notificationType === "sms" || notificationType === "both") {
      try {
        const smsBody = `New cabinet design from ${
          designData.client_name
        } - $${designData.total_price.toFixed(2)}. Contact: ${
          designData.contact_preference === "email"
            ? designData.client_email
            : designData.client_phone
        }`;

        const smsResult = await sendSmsWithRouting(
          "design_submission",
          smsBody
        );

        if (smsResult.success) {
          console.log(
            `📱 Design SMS notification sent to ${smsResult.totalSent} recipient(s)`
          );
        } else {
          console.error("⚠️  Design SMS routing failed:", smsResult.error);
        }
      } catch (smsError) {
        console.error("⚠️  SMS routing error:", smsError.message);
      }
    }

    res.json({
      success: true,
      designId,
      message: "Design saved successfully",
    });
  } catch (error) {
    console.error("❌ Error saving design:", error);
    res.status(500).json({
      error: "Failed to save design",
      details: error.message,
    });
  }
});

app.get("/api/designs/stats", async (req, res) => {
  try {
    const stats = await designDb.getDesignStats();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching design stats:", error);
    res.status(500).json({ error: "Failed to fetch design statistics" });
  }
});

// Also fix the single design route
app.get("/api/designs/:id", async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const design = await designDb.getDesign(designId);

    if (design) {
      res.json(design);
    } else {
      res.status(404).json({ error: "Design not found" });
    }
  } catch (error) {
    console.error("Error fetching design:", error);
    res.status(500).json({ error: "Failed to fetch design" });
  }
});
app.delete("/api/designs/:id", async (req, res) => {
  try {
    const designId = parseInt(req.params.id);

    const db = await getDb();
    const result = await db.run("DELETE FROM designs WHERE id = ?", designId);
    //await db.close();

    if (result.changes > 0) {
      console.log(`Design #${designId} deleted`);

      res.json({ success: true, message: "Design deleted successfully" });
    } else {
      res.status(404).json({ error: "Design not found" });
    }
  } catch (error) {
    console.error("Error deleting design:", error);
    res.status(500).json({ error: "Failed to delete design" });
  }
});

// Get design PDF
app.get("/api/designs/:id/pdf", async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const pdfData = await designDb.getDesignPdf(designId);

    if (pdfData) {
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="design-${designId}.pdf"`,
      });
      res.send(pdfData);
    } else {
      res.status(404).json({ error: "PDF not found" });
    }
  } catch (error) {
    console.error("Error fetching PDF:", error);
    res.status(500).json({ error: "Failed to fetch PDF" });
  }
});

// Update design status
app.put("/api/designs/:id/status", authenticateUser, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const { status, viewedBy } = req.body;

    const success = await designDb.updateDesignStatus(
      designId,
      status,
      viewedBy || req.user.username
    );

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Design not found" });
    }
  } catch (error) {
    console.error("Error updating design status:", error);
    res.status(500).json({ error: "Failed to update design status" });
  }
});

// Update design note
app.put("/api/designs/:id/note", authenticateUser, async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const { note } = req.body;

    const success = await designDb.updateDesignNote(designId, note);

    if (success) {
      res.json({ success: true });
    } else {
      res.status(404).json({ error: "Design not found" });
    }
  } catch (error) {
    console.error("Error updating design note:", error);
    res.status(500).json({ error: "Failed to update design note" });
  }
});

app.get("/api/designs/:id/debug", async (req, res) => {
  try {
    const designId = parseInt(req.params.id);
    const db = await getDb();

    // Get raw data from database
    const design = await db.get("SELECT * FROM designs WHERE id = ?", designId);

    if (design) {
      // Check if kitchen_data and bathroom_data are stored
      const debugInfo = {
        id: design.id,
        client_name: design.client_name,
        has_kitchen_data: !!design.kitchen_data,
        has_bathroom_data: !!design.bathroom_data,
        kitchen_data_length: design.kitchen_data
          ? design.kitchen_data.length
          : 0,
        bathroom_data_length: design.bathroom_data
          ? design.bathroom_data.length
          : 0,
        kitchen_data_preview: design.kitchen_data
          ? design.kitchen_data.substring(0, 200)
          : null,
        bathroom_data_preview: design.bathroom_data
          ? design.bathroom_data.substring(0, 200)
          : null,
        pdf_data_size: design.pdf_data ? design.pdf_data.length : 0,
      };

      res.json(debugInfo);
    } else {
      res.status(404).json({ error: "Design not found" });
    }

    //await db.close();
  } catch (error) {
    console.error("Debug error:", error);
    res.status(500).json({ error: error.message });
  }
});
// Health check endpoint
app.get("/api/health", async (req, res) => {
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
app.get("/sitemap.xml", async (req, res) => {
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
app.get("/robots.txt", (req, res) => {
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
app.get("/api/debug/uploads", async (req, res) => {
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

// Password reset endpoints
app.post("/api/auth/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const resetData = await userDb.createPasswordResetToken(email);

    // Always return success to prevent email enumeration
    if (resetData) {
      // Send email with reset link
      const resetUrl = `https://gudinocustom.com/reset-password?token=${resetData.token}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: resetData.user.email,
        subject: "Password Reset - GudinoCustom Admin",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Password Reset Request</h2>
            <p>Hello ${resetData.user.username},</p>
            <p>You requested a password reset for your GudinoCustom admin account.</p>
            <p>Click the link below to reset your password:</p>
            <p><a href="${resetUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Reset Password</a></p>
            <p>This link will expire in 1 hour.</p>
            <p>If you didn't request this reset, please ignore this email.</p>
            <p>Best regards,<br>GudinoCustom Team</p>
          </div>
        `,
      };

      await emailTransporter.sendMail(mailOptions);
      console.log(`Password reset email sent to ${email}`);
    }

    // Always return success message
    res.json({
      message:
        "If an account with that email exists, a password reset link has been sent.",
    });
  } catch (error) {
    console.error("Password reset request error:", error);
    res.status(500).json({ error: "Failed to process password reset request" });
  }
});

app.post("/api/auth/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ error: "Token and password are required" });
    }

    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters long" });
    }

    const success = await userDb.resetPassword(token, password);

    if (!success) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    res.json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({ error: "Failed to reset password" });
  }
});

app.get("/api/auth/validate-reset-token/:token", async (req, res) => {
  try {
    const { token } = req.params;

    const resetRecord = await userDb.validatePasswordResetToken(token);

    if (!resetRecord) {
      return res.status(400).json({ error: "Invalid or expired token" });
    }

    res.json({
      valid: true,
      username: resetRecord.username,
      expires_at: resetRecord.expires_at,
    });
  } catch (error) {
    console.error("Token validation error:", error);
    res.status(500).json({ error: "Failed to validate token" });
  }
});

// Analytics endpoints
app.post("/api/analytics/pageview", async (req, res) => {
  try {
    const { page_path, user_agent, referrer, session_id, user_id } = req.body;

    // Get IP address from request
    const ip_address =
      req.headers["x-forwarded-for"] ||
      req.headers["x-real-ip"] ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      (req.connection.socket ? req.connection.socket.remoteAddress : null);

    const viewId = await analyticsDb.recordPageView({
      page_path,
      user_agent,
      ip_address,
      referrer,
      session_id,
      user_id,
    });

    res.json({ success: true, viewId });
  } catch (error) {
    console.error("Analytics pageview error:", error);
    res.status(500).json({ error: "Failed to record page view" });
  }
});

app.post("/api/analytics/time", async (req, res) => {
  try {
    // Validate request body
    if (!req.body || typeof req.body !== "object") {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const { viewId, timeSpent } = req.body;

    // Validate required fields
    if (!viewId || typeof timeSpent !== "number") {
      return res
        .status(400)
        .json({ error: "viewId and timeSpent are required" });
    }

    // Validate timeSpent is a reasonable value (0 to 24 hours in seconds)
    if (timeSpent < 0 || timeSpent > 86400) {
      return res
        .status(400)
        .json({ error: "timeSpent must be between 0 and 86400 seconds" });
    }

    await analyticsDb.updateTimeSpent(viewId, timeSpent);

    res.json({ success: true });
  } catch (error) {
    console.error("Analytics time tracking error:", error);
    res.status(500).json({ error: "Failed to update time spent" });
  }
});

// Analytics event tracking endpoint
app.post("/api/analytics/event", async (req, res) => {
  try {
    const { event_name, event_data, session_id, user_id, page_path } = req.body;

    if (!event_name) {
      return res.status(400).json({ error: "Event name is required" });
    }

    // Get client IP
    const clientIp =
      req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"];

    // Track the event (you can expand this to store in database if needed)
    const eventRecord = {
      event_name,
      event_data: event_data || {},
      session_id,
      user_id,
      page_path,
      ip_address: clientIp,
      user_agent: req.headers["user-agent"],
      timestamp: new Date().toISOString(),
    };

    // For now, just log the event (you can add database storage later)
    console.log("Analytics Event:", eventRecord);

    res.json({ success: true, eventId: Date.now() });
  } catch (error) {
    console.error("Analytics event error:", error);
    res.status(500).json({ error: "Failed to track event" });
  }
});

// Analytics dashboard endpoints (super admin only)
app.get(
  "/api/analytics/stats",
  authenticateUser,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const dateRange = parseInt(req.query.days) || 30;
      const stats = await analyticsDb.getPageViewStats(dateRange);

      res.json(stats);
    } catch (error) {
      console.error("Analytics stats error:", error);
      res.status(500).json({ error: "Failed to fetch analytics stats" });
    }
  }
);

app.get(
  "/api/analytics/realtime",
  authenticateUser,
  requireRole("super_admin"),
  async (req, res) => {
    try {
      const stats = await analyticsDb.getRealtimeStats();

      res.json(stats);
    } catch (error) {
      console.error("Analytics realtime error:", error);
      res.status(500).json({ error: "Failed to fetch realtime stats" });
    }
  }
);

// =========================
// INVOICE ENDPOINTS
// =========================

// Admin endpoint - Get all invoices
app.get("/api/admin/invoices", authenticateUser, async (req, res) => {
  try {
    const invoices = await invoiceDb.getAllInvoices();
    res.json(invoices);
  } catch (error) {
    console.error("Error getting invoices:", error);
    res.status(500).json({ error: "Failed to get invoices" });
  }
});

// Admin endpoint - Get invoice tracking data
app.get("/api/admin/invoices/tracking", authenticateUser, async (req, res) => {
  try {
    const { getDb } = require("./db-helpers");
    const db = await getDb();

    // Get invoice tracking data with view counts, last viewed times, and location data
    const trackingData = await db.all(`
      SELECT
        i.id,
        i.invoice_number,
        i.client_id,
        i.total_amount,
        i.status,
        i.created_at,
        c.company_name,
        c.first_name,
        c.last_name,
        c.email,
        c.phone,
        c.is_business,
        t.token,
        t.viewed_at,
        t.view_count,
        t.created_at as token_created_at,
        (SELECT client_ip FROM invoice_views WHERE invoice_id = i.id ORDER BY viewed_at DESC LIMIT 1) as client_ip,
        (SELECT country FROM invoice_views WHERE invoice_id = i.id ORDER BY viewed_at DESC LIMIT 1) as country,
        (SELECT region FROM invoice_views WHERE invoice_id = i.id ORDER BY viewed_at DESC LIMIT 1) as region,
        (SELECT city FROM invoice_views WHERE invoice_id = i.id ORDER BY viewed_at DESC LIMIT 1) as city,
        (SELECT timezone FROM invoice_views WHERE invoice_id = i.id ORDER BY viewed_at DESC LIMIT 1) as timezone
      FROM invoices i
      LEFT JOIN clients c ON i.client_id = c.id
      LEFT JOIN invoice_tokens t ON i.id = t.invoice_id AND t.is_active = 1
      ORDER BY i.created_at DESC
    `);

    await db.close();

    // Format the data for frontend consumption
    const formattedData = trackingData.map((item) => ({
      ...item,
      client_name: item.is_business
        ? item.company_name
        : `${item.first_name} ${item.last_name}`,
      has_token: !!item.token,
      is_viewed: !!item.viewed_at,
      view_count: item.view_count || 0,
      last_viewed: item.viewed_at,
    }));

    res.json(formattedData);
  } catch (error) {
    console.error("Error getting invoice tracking data:", error);
    res.status(500).json({ error: "Failed to get invoice tracking data" });
  }
});

// Admin endpoint - Get invoice view statistics
app.get(
  "/api/admin/invoices/view-stats",
  authenticateUser,
  async (req, res) => {
    try {
      const stats = await invoiceDb.getAllInvoiceViewStats();
      res.json(stats);
    } catch (error) {
      console.error("Error getting invoice view stats:", error);
      res.status(500).json({ error: "Failed to get invoice view statistics" });
    }
  }
);

// Admin endpoint - Get invoices needing reminders
app.get(
  "/api/admin/invoices/needing-reminders",
  authenticateUser,
  async (req, res) => {
    try {
      const invoices = await invoiceDb.getInvoicesNeedingReminders();
      res.json(invoices);
    } catch (error) {
      console.error("Error getting invoices needing reminders:", error);
      res
        .status(500)
        .json({ error: "Failed to get invoices needing reminders" });
    }
  }
);

// Admin endpoint - Get invoice by ID
app.get("/api/admin/invoices/:id", authenticateUser, async (req, res) => {
  try {
    const invoice = await invoiceDb.getInvoiceById(req.params.id);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }
    res.json(invoice);
  } catch (error) {
    console.error("Error getting invoice:", error);
    res.status(500).json({ error: "Failed to get invoice" });
  }
});

// Admin endpoint - Create new invoice
app.post("/api/admin/invoices", authenticateUser, async (req, res) => {
  try {
    const result = await invoiceDb.createInvoice(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error creating invoice:", error);
    res.status(500).json({ error: "Failed to create invoice" });
  }
});

// Admin endpoint - Update invoice
app.put("/api/admin/invoices/:id", authenticateUser, async (req, res) => {
  try {
    const invoiceId = req.params.id;
    const updateData = req.body;

    // Check if invoice exists
    const existingInvoice = await invoiceDb.getInvoiceById(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Update the invoice
    const result = await invoiceDb.updateInvoice(invoiceId, updateData);
    res.json(result);
  } catch (error) {
    console.error("Error updating invoice:", error);
    res.status(500).json({ error: "Failed to update invoice" });
  }
});

// Admin endpoint - Get all clients
app.get("/api/admin/clients", authenticateUser, async (req, res) => {
  try {
    const clients = await invoiceDb.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error("Error getting clients:", error);
    res.status(500).json({ error: "Failed to get clients" });
  }
});

// Admin endpoint - Search clients with debouncing support
app.get("/api/admin/clients/search", authenticateUser, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json([]); // Return empty array for short queries
    }

    const clients = await invoiceDb.searchClients(q);
    res.json(clients);
  } catch (error) {
    console.error("Error searching clients:", error);
    res.status(500).json({ error: "Failed to search clients" });
  }
});

// Admin endpoint - Create new client
app.post("/api/admin/clients", authenticateUser, async (req, res) => {
  try {
    const result = await invoiceDb.createClient(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

// Admin endpoint - Get single client by ID
app.get("/api/admin/clients/:id", authenticateUser, async (req, res) => {
  try {
    const client = await invoiceDb.getClientById(req.params.id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }
    res.json(client);
  } catch (error) {
    console.error("Error getting client:", error);
    res.status(500).json({ error: "Failed to get client" });
  }
});

// Admin endpoint - Update client
app.put("/api/admin/clients/:id", authenticateUser, async (req, res) => {
  try {
    await invoiceDb.updateClient(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

// Admin endpoint - Delete client
app.delete("/api/admin/clients/:id", authenticateUser, async (req, res) => {
  try {
    const result = await invoiceDb.deleteClient(req.params.id);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// Admin endpoint - Get line item labels
app.get("/api/admin/line-item-labels", authenticateUser, async (req, res) => {
  try {
    const labels = await invoiceDb.getLineItemLabels();
    res.json(labels);
  } catch (error) {
    console.error("Error getting line item labels:", error);
    res.status(500).json({ error: "Failed to get line item labels" });
  }
});

// Admin endpoint - Create line item label
app.post("/api/admin/line-item-labels", authenticateUser, async (req, res) => {
  try {
    const result = await invoiceDb.createLineItemLabel(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error creating line item label:", error);
    res.status(500).json({ error: "Failed to create line item label" });
  }
});

// Admin endpoint - Update line item label
app.put(
  "/api/admin/line-item-labels/:id",
  authenticateUser,
  async (req, res) => {
    try {
      await invoiceDb.updateLineItemLabel(req.params.id, req.body);
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating line item label:", error);
      res.status(500).json({ error: "Failed to update line item label" });
    }
  }
);

// Admin endpoint - Delete line item label
app.delete(
  "/api/admin/line-item-labels/:id",
  authenticateUser,
  async (req, res) => {
    try {
      await invoiceDb.deleteLineItemLabel(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting line item label:", error);
      res.status(500).json({ error: "Failed to delete line item label" });
    }
  }
);

// Admin endpoint - Fix tax rate precision manually
app.post("/api/admin/fix-tax-precision", authenticateUser, async (req, res) => {
  try {
    if (req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Super admin access required" });
    }

    await invoiceDb.fixTaxRatePrecision();
    res.json({
      success: true,
      message: "Tax rate precision fixed successfully",
    });
  } catch (error) {
    console.error("Error fixing tax precision:", error);
    res.status(500).json({ error: "Failed to fix tax precision" });
  }
});

// Admin endpoint - Add payment to invoice
app.post(
  "/api/admin/invoices/:id/payments",
  authenticateUser,
  async (req, res) => {
    try {
      const paymentData = {
        ...req.body,
        invoice_id: req.params.id,
        created_by: req.user.id,
      };
      const result = await invoiceDb.addPayment(paymentData);
      res.json(result);
    } catch (error) {
      console.error("Error adding payment:", error);
      res.status(500).json({ error: "Failed to add payment" });
    }
  }
);

// Admin endpoint - Get payments for an invoice
app.get(
  "/api/admin/invoices/:id/payments",
  authenticateUser,
  async (req, res) => {
    try {
      const payments = await invoiceDb.getInvoicePayments(req.params.id);
      res.json(payments);
    } catch (error) {
      console.error("Error getting invoice payments:", error);
      res.status(500).json({ error: "Failed to get invoice payments" });
    }
  }
);

// Admin endpoint - Get all payments (for payment management)
app.get("/api/admin/payments", authenticateUser, async (req, res) => {
  try {
    const payments = await invoiceDb.getAllPayments();
    res.json(payments);
  } catch (error) {
    console.error("Error getting all payments:", error);
    res.status(500).json({ error: "Failed to get payments" });
  }
});

// Admin endpoint - Recalculate all invoice balances (for fixing balance issues)
app.post(
  "/api/admin/invoices/recalculate-balances",
  authenticateUser,
  async (req, res) => {
    try {
      const { getDb } = require("./db-helpers");
      const db = await getDb();

      // Get all invoices
      const invoices = await db.all("SELECT id, total_amount FROM invoices");
      let updatedCount = 0;

      for (const invoice of invoices) {
        // Calculate actual balance due
        const paymentsResult = await db.get(
          "SELECT SUM(payment_amount) as total_paid FROM invoice_payments WHERE invoice_id = ?",
          [invoice.id]
        );
        const totalPaid = paymentsResult.total_paid || 0;
        const balanceDue = Math.max(0, (invoice.total_amount || 0) - totalPaid);

        // Update the invoice with correct balance
        await db.run("UPDATE invoices SET balance_due = ? WHERE id = ?", [
          balanceDue,
          invoice.id,
        ]);

        // Also update status
        await invoiceDb.updateInvoiceStatus(invoice.id);
        updatedCount++;
      }

      await db.close();
      res.json({
        message: `Successfully recalculated balances for ${updatedCount} invoices`,
      });
    } catch (error) {
      console.error("Error recalculating invoice balances:", error);
      res.status(500).json({ error: "Failed to recalculate invoice balances" });
    }
  }
);

// Admin endpoint - Update payment
app.put("/api/admin/payments/:id", authenticateUser, async (req, res) => {
  try {
    const result = await invoiceDb.updatePayment(req.params.id, req.body);
    res.json(result);
  } catch (error) {
    console.error("Error updating payment:", error);
    res.status(500).json({ error: "Failed to update payment" });
  }
});

// Admin endpoint - Delete payment
app.delete("/api/admin/payments/:id", authenticateUser, async (req, res) => {
  try {
    const result = await invoiceDb.deletePayment(req.params.id);
    res.json(result);
  } catch (error) {
    console.error("Error deleting payment:", error);
    res.status(500).json({ error: "Failed to delete payment" });
  }
});

// Admin endpoint - Send invoice via email
// Helper function to generate invoice PDF buffer
async function generateInvoicePdf(invoiceId, language = "english") {
  // Get translations for the specified language
  const t = getInvoiceTranslations(language);

  // Get invoice details with client info and line items
  const invoice = await invoiceDb.getInvoiceById(invoiceId);
  if (!invoice) {
    throw new Error("Invoice not found");
  }

  const client = await invoiceDb.getClientById(invoice.client_id);
  if (!client) {
    throw new Error("Client not found");
  }

  // Get tax rate information to display city name
  const taxRateInfo = await invoiceDb.getTaxRateByRate(invoice.tax_rate);

  const lineItems = await invoiceDb.getInvoiceLineItems(invoiceId);

  const clientName = client.is_business
    ? client.company_name
    : `${client.first_name} ${client.last_name}`;

  const clientAddress = client.address || "";
  const payments = await invoiceDb.getInvoicePayments(invoiceId);
  const totalPaid = payments.reduce(
    (sum, payment) => sum + parseFloat(payment.payment_amount),
    0
  );
  const balanceDue = invoice.total_amount - totalPaid;

  // Create Google Maps link for company address
  const companyAddress = "70 Ray Rd, Sunnyside, WA 98944";
  const googleMapsLink = `https://maps.google.com/?q=${encodeURIComponent(
    companyAddress
  )}`;
  // Read logo file and convert to base64
  const fs = require("fs");
  const path = require("path");
  let logoBase64 = "";
  let logoError = "";
  try {
    const logoPath = path.join(__dirname, "uploads", "logo.jpeg");
    console.log("Looking for logo at:", logoPath);
    console.log("Logo file exists:", fs.existsSync(logoPath));

    if (fs.existsSync(logoPath)) {
      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
      console.log(
        "Logo loaded successfully, size:",
        logoBuffer.length,
        "bytes"
      );
    } else {
      logoError = "Logo file not found at path";
    }
  } catch (error) {
    console.log("Logo file error:", error.message);
    logoError = error.message;
  }

  // Generate HTML content using professional template with language support
  const htmlContent = `
    <!DOCTYPE html>
    <html lang="${language === "spanish" ? "es" : "en"}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${clientName} - ${invoice.invoice_number.split("-").pop()}</title>
      <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: rgba(110, 110, 110, 0.1); }
          .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; background: rgba(110, 110, 110, 0.1); }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid rgba(110, 110, 110, 1); padding-bottom: 30px; }
          .company-info { flex: 1; display: flex; align-items: flex-start; gap: 20px; }
          .company-logo { width: 300px;  object-fit: contain; flex-shrink: 0; }
          .company-text { flex: 1; }
          .company-name { font-size: 28px; font-weight: bold; color: rgba(0, 0, 0, 1); margin-bottom: 10px; }
          .company-details { font-size: 14px; color: rgba(0, 0, 0, 1); line-height: 1.5; }
          .invoice-title { font-size: 48px; font-weight: bold; color: rgba(0, 0, 0, 1); text-align: right; margin-bottom: 20px; }
          .invoice-meta { text-align: right; font-size: 14px; color: rgba(0, 0, 0, 1); }
          .billing-info { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
          .bill-to, .invoice-details { flex: 1; }
          .section-title { font-size: 18px; font-weight: bold; color: rgba(0, 0, 0, 1); margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
          .bill-to-content, .invoice-details-content { font-size: 14px; line-height: 1.6; color: rgba(0, 0, 0, 1); }
          .line-items { margin-bottom: 20px; }
          .line-items table { width: 100%; border-collapse: collapse; font-size: 14px; }
          .line-items th { background-color: rgba(110, 110, 110, 1); color: #000000ff; font-weight: bold; padding: 12px; border: 0.25px solid #000000ff; text-align: left; }
          .line-items td { background-color: rgba(110,110,110,0.15);padding: 12px; border: 0.5px solid #000000ff; vertical-align: top; }
          .line-items .text-center { text-align: center; }
          .line-items .text-right { text-align: right; }
          .item-title { font-weight: 600; margin-bottom: 5px; color: #1f2937; }
          .item-description { color: #4b5563; }
          .totals { margin-left: auto; width: 300px; margin-bottom: 40px; }
          .totals table { width: 100%; font-size: 14px; border-collapse: collapse; }
          .totals td {
            padding: 12px 15px;
            background-color: rgba(110, 110, 110, 0.15);
            border: 1px solid #000000ff;
            border-collapse: collapse;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 16px;
            background-color: rgba(110, 110, 110, 0.75) !important;
            border-top: 2px solid #000000ff;
            border-bottom: 2px solid #000000ff;
          }
          .totals .text-right { text-align: right; }
          .notes { margin-bottom: 20px; }
          .notes-content { background-color: #f9fafb; padding: 20px; border-left: 4px solid rgba(110, 110, 110, 1); font-size: 14px; line-height: 1.6; }
          .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
    </head>
    <body>
      <div class="invoice-container">
        <div class="invoice-header">
          <div class="company-info">
            <div class="company-text">
               ${
                 logoBase64
                   ? `<img src="${logoBase64}" alt="Company Logo" class="company-logo">`
                   : `<div style="width: 100px; height: 100px; color: white; flex: 1; display: flex; align-items: center; justify-content: center; font-size: 10px; text-align: center;">NO LOGO</div>`
               }
              <div class="company-details">
                Phone: (509) 515-4090<br>
                Email: admin@gudinocustom.com<br>
                <a href="${googleMapsLink}" target="_blank">${companyAddress}</a>
              </div>
            </div>
          </div>
          <div style="text-align: right;">
            <div class="invoice-title">${t.invoiceTitle.toUpperCase()}</div>
            <div class="invoice-meta">
              <strong>${t.invoiceTitle} #:</strong> ${
    invoice.invoice_number.split("2025-")[1]
  }<br>
              <strong>${t.invoiceDate}:</strong> ${new Date(
    invoice.invoice_date
  ).toLocaleDateString()}<br>
              <strong>${t.dueDate}:</strong> ${new Date(
    invoice.due_date
  ).toLocaleDateString()}
            </div>
          </div>
        </div>

        <div class="billing-info">
          <div class="bill-to">
            <div class="section-title">${t.billTo}</div>
            <div class="bill-to-content">
              <strong>${clientName}</strong><br>
              ${client.email ? `${client.email}<br>` : ""}
              ${client.phone ? `${client.phone}<br>` : ""}
              ${
                client.tax_exempt_number
                  ? `<br><em>Tax Exempt #: ${client.tax_exempt_number}</em>`
                  : ""
              }
            </div>
          </div>
          <div class="invoice-details">
            <div class="section-title">${t.invoiceTitle} Details</div>
            <div class="invoice-details-content">
              <strong>Status:</strong> ${
                invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)
              }<br>
              <strong>Project Type:</strong> ${
                client.is_business ? "Commercial" : "Residential"
              }<br>
              <strong>Service address:</strong>
              ${clientAddress ? `${clientAddress}<br>` : ""}
            </div>
          </div>
        </div>

        <div class="line-items">
          <table>
            <thead>
              <tr>
                <th>Item(s)</th>
                <th class="text-center">${t.quantity}</th>
                <th class="text-right">Rate</th>
                <th class="text-right">${t.total}</th>
              </tr>
            </thead>
            <tbody>
              ${lineItems
                .map((item) => {
                  let formattedDescription = item.description || "";
                  if (formattedDescription.includes("-")) {
                    const listItems = formattedDescription
                      .split("-")
                      .map((text) => text.trim())
                      .filter((text) => text.length > 0)
                      .map((text) => `<li>${text}</li>`)
                      .join("");
                    formattedDescription = `<ul style="margin: 5px 0; padding-left: 20px;">${listItems}</ul>`;
                  }
                  return `
                <tr>
                  <td>
                    ${
                      item.title
                        ? `<div class="item-title">${item.title}</div>`
                        : ""
                    }
                    <div class="item-description">${formattedDescription}</div>
                  </td>
                  <td class="text-center">${item.quantity}</td>
                  <td class="text-right">$${(item.unit_price || 0).toFixed(
                    2
                  )}</td>
                  <td class="text-right">$${(
                    (item.quantity || 0) * (item.unit_price || 0)
                  ).toFixed(2)}</td>
                </tr>
                `;
                })
                .join("")}
            </tbody>
          </table>
        </div>

        <div class="totals">
          <table>
            <tr>
              <td>${t.subtotal}:</td>
              <td class="text-right">$${(invoice.subtotal || 0).toFixed(2)}</td>
            </tr>
            ${
              (invoice.discount_amount || 0) > 0
                ? `
            <tr>
              <td>${t.discount}:</td>
              <td class="text-right">-$${(invoice.discount_amount || 0).toFixed(
                2
              )}</td>
            </tr>
            `
                : ""
            }
            ${
              (invoice.markup_amount || 0) > 0
                ? `
            <tr>
              <td>${t.markup}:</td>
              <td class="text-right">$${(invoice.markup_amount || 0).toFixed(
                2
              )}</td>
            </tr>
            `
                : ""
            }
            <tr>
              <td>${t.tax}${
    taxRateInfo?.city
      ? `: ${
          taxRateInfo.city.charAt(0).toUpperCase() + taxRateInfo.city.slice(1)
        }`
      : ""
  } (${(invoice.tax_rate || 0).toFixed(2)}%):</td>
              <td class="text-right">$${(invoice.tax_amount || 0).toFixed(
                2
              )}</td>
            </tr>
            <tr class="total-row">
              <td><strong>${t.grandTotal}:</strong></td>
              <td class="text-right"><strong>$${(
                invoice.total_amount || 0
              ).toFixed(2)}</strong></td>
            </tr>
          </table>
        </div>

        ${
          invoice.notes
            ? `
        <div class="notes">
          <div class="section-title">${t.notes}</div>
          <div class="notes-content">${invoice.notes}</div>
        </div>
        `
            : ""
        }

        <div class="footer">
          ${t.thankYou}<br>
          ${t.questions} admin@gudinocustom.com ${
    language === "spanish" ? "o" : "or"
  } (509) 515-4090
        </div>
      </div>
    </body>
    </html>`;

  // PDF generation options with Docker container support
  const options = {
    format: "A4",
    border: {
      top: "0.5in",
      right: "0.5in",
      bottom: "0.5in",
      left: "0.5in",
    },
    paginationOffset: 1,
    type: "pdf",
    quality: "75",
    orientation: "portrait",
    timeout: 30000,
    // Puppeteer options for Docker containers
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--single-process",
      "--disable-gpu",
    ],
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
  };

  // Generate PDF with error handling
  try {
    console.log("Generating PDF for email attachment...");
    const pdfBuffer = await generatePdfWithRetry(htmlContent, options);

    // Validate PDF buffer
    if (!pdfBuffer || pdfBuffer.length === 0) {
      throw new Error("Generated PDF buffer is empty");
    }

    console.log(
      `PDF generated successfully for email, size: ${pdfBuffer.length} bytes`
    );
    return pdfBuffer;
  } catch (pdfError) {
    console.error("PDF generation error in generateInvoicePdf:", pdfError);
    console.error("HTML content length:", htmlContent.length);
    throw new Error(`PDF generation failed: ${pdfError.message}`);
  }
}

// Translation helper function for invoices
function getInvoiceTranslations(language = "english") {
  const translations = {
    english: {
      subject: "Invoice from Gudino Custom Cabinets",
      greeting: "Hello",
      invoiceTitle: "Invoice",
      billTo: "Bill To",
      description: "Description",
      quantity: "Qty",
      unitPrice: "Unit Price",
      total: "Total",
      subtotal: "Subtotal",
      discount: "Discount",
      markup: "Markup",
      tax: "Tax",
      grandTotal: "Total",
      amountPaid: "Amount Paid",
      remainingBalance: "Remaining Balance",
      dueDate: "Due Date",
      invoiceDate: "Invoice Date",
      paymentHistory: "Payment History",
      notes: "Notes",
      thankYou: "Thank you for your business!",
      questions:
        "If you have any questions about this invoice, please contact us",
      viewOnline: "View Invoice Online",
      companyName: "Gudino Custom Cabinets",
    },
    spanish: {
      subject: "Factura de Gudino Custom Cabinets",
      greeting: "Hola",
      invoiceTitle: "Factura",
      billTo: "Facturar a",
      description: "Descripción",
      quantity: "Cant.",
      unitPrice: "Precio Unitario",
      total: "Total",
      subtotal: "Subtotal",
      discount: "Descuento",
      markup: "Margen",
      tax: "Impuesto",
      grandTotal: "Total",
      amountPaid: "Cantidad Pagada",
      remainingBalance: "Saldo Pendiente",
      dueDate: "Fecha de Vencimiento",
      invoiceDate: "Fecha de Factura",
      paymentHistory: "Historial de Pagos",
      notes: "Notas",
      thankYou: "¡Gracias por su negocio!",
      questions:
        "Si tiene alguna pregunta sobre esta factura, por favor contáctenos",
      viewOnline: "Ver Factura en Línea",
      companyName: "Gudino Custom Cabinets",
    },
  };

  return translations[language] || translations.english;
}

app.post(
  "/api/admin/invoices/:id/send-email",
  authenticateUser,
  async (req, res) => {
    try {
      const invoiceId = req.params.id;
      const {
        message,
        language = "english",
        sendToSelf = false,
        selfEmail = '',
        additionalEmails = [],
        useCustomClientEmail = false,
        customClientEmail = ''
      } = req.body;

      // Get invoice details with client info
      const invoice = await invoiceDb.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const client = await invoiceDb.getClientById(invoice.client_id);

      // Determine primary client email
      let primaryClientEmail;
      if (useCustomClientEmail) {
        if (!customClientEmail || !customClientEmail.trim()) {
          return res.status(400).json({ error: "Custom client email is required when using custom client email option" });
        }
        primaryClientEmail = customClientEmail.trim();
      } else {
        if (!client || !client.email) {
          return res.status(400).json({ error: "Client email not found" });
        }
        primaryClientEmail = client.email;
      }

      // Start with primary client email as first recipient
      let recipients = [primaryClientEmail];

      // Add self email if requested
      if (sendToSelf) {
        if (!selfEmail || !selfEmail.trim()) {
          return res.status(400).json({ error: "Self email address is required when also sending to self" });
        }
        recipients.push(selfEmail.trim());
      }

      // Add valid additional emails
      if (additionalEmails && additionalEmails.length > 0) {
        const validAdditionalEmails = additionalEmails
          .filter(email => email && email.trim() && email.includes('@'))
          .map(email => email.trim());
        recipients = [...recipients, ...validAdditionalEmails];
      }

      // Remove duplicates
      recipients = [...new Set(recipients)];

      // Update invoice status from draft to unpaid when sending
      if (invoice.status === "draft") {
        await invoiceDb.markInvoiceAsSent(invoiceId);
      }

      // Get or create the invoice token for the client access link
      let invoiceToken = invoice.token;
      if (!invoiceToken) {
        // Create a new token for this invoice if it doesn't exist
        const tokenResult = await invoiceDb.createInvoiceToken(invoiceId);
        invoiceToken = tokenResult.token;
      }
      const viewLink = `${process.env.FRONTEND_URL}/invoice/${invoiceToken}`;

      const clientName =
        client.company_name || `${client.first_name} ${client.last_name}`;

      // Get translations based on selected language
      const t = getInvoiceTranslations(language);

      // Generate PDF for attachment
      let pdfBuffer;
      try {
        pdfBuffer = await generateInvoicePdf(invoiceId, language);
      } catch (pdfError) {
        console.error("Failed to generate PDF for email:", pdfError);
        return res.status(500).json({
          error: "Failed to generate PDF attachment",
          details:
            process.env.NODE_ENV === "development"
              ? pdfError.message
              : undefined,
        });
      }

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: recipients.join(', '),
        subject: `${t.subject} ${invoice.invoice_number.split("-").pop()}`,
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: rgba(109, 109, 109, 1); color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">${t.companyName}</h1>
          </div>

          <div style="padding: 30px; background: #f8fafc;">
            <h2 style="color: black; margin-top: 0;">${
              t.invoiceTitle
            } ${invoice.invoice_number.split("-").pop()}</h2>

            <p style="color: black;">${t.greeting} ${clientName},</p>

            <p style="color: black;">${
              language === "spanish"
                ? "Adjunto encontrará su factura. También puede verla y descargarla usando el enlace seguro de abajo:"
                : "Please find your invoice attached. You can also view and download your invoice using the secure link below:"
            }</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${viewLink}" 
                 style="background: #1e3a8a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block;">
                ${t.viewOnline}
              </a>
            </div>
            
            <div style="background: white; padding: 20px; border-radius: 5px; border: 1px solid #e2e8f0;">
              <h3 style="margin-top: 0; color: black;">${
                language === "spanish"
                  ? "Detalles de la Factura:"
                  : "Invoice Details:"
              }</h3>
              <p style="color: black;"><strong>${
                language === "spanish"
                  ? "Número de Factura:"
                  : "Invoice Number:"
              }</strong> ${invoice.invoice_number.split("-").pop()}</p>
              <p style="color: black;"><strong>${
                t.invoiceDate
              }:</strong> ${new Date(
          invoice.invoice_date
        ).toLocaleDateString()}</p>
              <p style="color: black;"><strong>${
                t.dueDate
              }:</strong> ${new Date(invoice.due_date).toLocaleDateString()}</p>
              <p style="color: black;"><strong>${
                language === "spanish" ? "Cantidad Total:" : "Total Amount:"
              }</strong> $${(invoice.total_amount || 0).toFixed(2)}</p>
            </div>
            
            ${
              message
                ? `
            <div style="margin: 20px 0; padding: 15px; background: #eff6ff; border-left: 4px solid #1e3a8a;">
              <p style="margin: 0; color: black;"><strong>${
                language === "spanish"
                  ? "Mensaje Adicional:"
                  : "Additional Message:"
              }</strong></p>
              <p style="margin: 5px 0 0 0; color: black;">${message}</p>
            </div>
            `
                : ""
            }

            <p style="margin-top: 30px; color: black;">${t.questions}</p>

            <p style="color: black;">${t.thankYou}</p>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
              <p>${t.companyName}</p>
              <p>Email: ${process.env.ADMIN_EMAIL}</p>
              <p>${
                language === "spanish"
                  ? "Este enlace permanecerá activo permanentemente para sus registros."
                  : "This link will remain active permanently for your records."
              }</p>
            </div>
          </div>
        </div>
      `,
        attachments: [
          {
            filename: `invoice-${invoice.invoice_number.split("-").pop()}.pdf`,
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };

      try {
        await emailTransporter.sendMail(mailOptions);
        console.log(`Invoice email sent successfully to: ${recipients.join(', ')}`);

        res.json({
          success: true,
          message: "Invoice email sent successfully with PDF attachment",
          sentTo: recipients,
          recipientCount: recipients.length,
        });
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
        return res.status(500).json({
          error: "Failed to send invoice email",
          details:
            process.env.NODE_ENV === "development"
              ? emailError.message
              : undefined,
        });
      }
    } catch (error) {
      console.error("Error in invoice email endpoint:", error);
      console.error("Error stack:", error.stack);
      res.status(500).json({
        error: "Failed to process invoice email request",
        details:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      });
    }
  }
);

// Test SMS endpoint
app.post(
  "/api/admin/test-sms",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      if (!twilioClient) {
        return res.status(500).json({ error: "SMS service not configured" });
      }

      const { phone, message } = req.body;
      const testMessage =
        message || "Test message from Gudino Custom Cabinets! 👋";
      const testPhone = phone || process.env.ADMIN_PHONE || "+15095154089";

      console.log("🧪 Testing SMS to:", testPhone);

      const smsOptions = {
        body: testMessage,
        to: testPhone,
      };

      // Use messaging service if available, otherwise fallback to phone number
      if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        smsOptions.messagingServiceSid =
          process.env.TWILIO_MESSAGING_SERVICE_SID;
        console.log(
          "📱 Using messaging service SID:",
          process.env.TWILIO_MESSAGING_SERVICE_SID
        );
      } else if (process.env.TWILIO_PHONE_NUMBER) {
        smsOptions.from = process.env.TWILIO_PHONE_NUMBER;
        console.log("📱 Using phone number:", process.env.TWILIO_PHONE_NUMBER);
      } else {
        throw new Error(
          "Neither messaging service SID nor phone number configured"
        );
      }

      const result = await twilioClient.messages.create(smsOptions);
      console.log("✅ Test SMS sent successfully! SID:", result.sid);

      res.json({
        success: true,
        message: "Test SMS sent successfully",
        sid: result.sid,
        sentTo: testPhone,
      });
    } catch (error) {
      console.error("❌ Test SMS failed:", error);
      res
        .status(500)
        .json({ error: `Failed to send test SMS: ${error.message}` });
    }
  }
);

// SMS Routing Management Endpoints

// Get SMS routing settings
app.get(
  "/api/admin/sms-routing/settings",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      const db = await getDb();
      const settings = await db.all(
        "SELECT * FROM sms_routing_settings ORDER BY message_type"
      );
      res.json(settings);
    } catch (error) {
      console.error("Error fetching SMS routing settings:", error);
      res.status(500).json({ error: "Failed to fetch SMS routing settings" });
    }
  }
);

// Update SMS routing settings
app.put(
  "/api/admin/sms-routing/settings/:messageType",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      const db = await getDb();
      const { messageType } = req.params;
      const { is_enabled, routing_mode } = req.body;

      const result = await db.run(
        `UPDATE sms_routing_settings
         SET is_enabled = ?, routing_mode = ?, updated_at = CURRENT_TIMESTAMP
         WHERE message_type = ?`,
        [is_enabled, routing_mode, messageType]
      );

      if (result.changes === 0) {
        await db.run(
          `INSERT INTO sms_routing_settings (message_type, is_enabled, routing_mode)
           VALUES (?, ?, ?)`,
          [messageType, is_enabled, routing_mode]
        );
      }

      res.json({
        success: true,
        message: "SMS routing settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating SMS routing settings:", error);
      res.status(500).json({ error: "Failed to update SMS routing settings" });
    }
  }
);

// Get SMS routing recipients
app.get(
  "/api/admin/sms-routing/recipients",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      const db = await getDb();
      const { messageType } = req.query;

      let query = `
        SELECT r.*, e.name as employee_name, e.position
        FROM sms_routing_recipients r
        LEFT JOIN employees e ON r.employee_id = e.id
      `;

      const params = [];
      if (messageType) {
        query += " WHERE r.message_type = ?";
        params.push(messageType);
      }

      query += " ORDER BY r.message_type, r.priority_order ASC";

      const recipients = await db.all(query, params);
      res.json(recipients);
    } catch (error) {
      console.error("Error fetching SMS routing recipients:", error);
      res.status(500).json({ error: "Failed to fetch SMS routing recipients" });
    }
  }
);

// Add SMS routing recipient
app.post(
  "/api/admin/sms-routing/recipients",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      const db = await getDb();
      const {
        message_type,
        employee_id,
        phone_number,
        name,
        priority_order = 0,
      } = req.body;

      if (!message_type || !phone_number || !name) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      const result = await db.run(
        `INSERT INTO sms_routing_recipients
         (message_type, employee_id, phone_number, name, priority_order)
         VALUES (?, ?, ?, ?, ?)`,
        [message_type, employee_id || null, phone_number, name, priority_order]
      );

      res.json({
        success: true,
        id: result.lastID,
        message: "SMS routing recipient added successfully",
      });
    } catch (error) {
      console.error("Error adding SMS routing recipient:", error);
      res.status(500).json({ error: "Failed to add SMS routing recipient" });
    }
  }
);

// Update SMS routing recipient
app.put(
  "/api/admin/sms-routing/recipients/:id",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      const db = await getDb();
      const { id } = req.params;
      const { employee_id, phone_number, name, is_active, priority_order } =
        req.body;

      const result = await db.run(
        `UPDATE sms_routing_recipients
         SET employee_id = ?, phone_number = ?, name = ?, is_active = ?, priority_order = ?
         WHERE id = ?`,
        [employee_id || null, phone_number, name, is_active, priority_order, id]
      );

      if (result.changes === 0) {
        return res
          .status(404)
          .json({ error: "SMS routing recipient not found" });
      }

      res.json({
        success: true,
        message: "SMS routing recipient updated successfully",
      });
    } catch (error) {
      console.error("Error updating SMS routing recipient:", error);
      res.status(500).json({ error: "Failed to update SMS routing recipient" });
    }
  }
);

// Delete SMS routing recipient
app.delete(
  "/api/admin/sms-routing/recipients/:id",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      const db = await getDb();
      const { id } = req.params;

      const result = await db.run(
        "DELETE FROM sms_routing_recipients WHERE id = ?",
        [id]
      );

      if (result.changes === 0) {
        return res
          .status(404)
          .json({ error: "SMS routing recipient not found" });
      }

      res.json({
        success: true,
        message: "SMS routing recipient deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting SMS routing recipient:", error);
      res.status(500).json({ error: "Failed to delete SMS routing recipient" });
    }
  }
);

// Get SMS routing history
app.get(
  "/api/admin/sms-routing/history",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      const db = await getDb();
      const { messageType, limit = 50, offset = 0 } = req.query;

      let query = "SELECT * FROM sms_routing_history";
      const params = [];

      if (messageType) {
        query += " WHERE message_type = ?";
        params.push(messageType);
      }

      query += " ORDER BY sent_at DESC LIMIT ? OFFSET ?";
      params.push(parseInt(limit), parseInt(offset));

      const history = await db.all(query, params);
      res.json(history);
    } catch (error) {
      console.error("Error fetching SMS routing history:", error);
      res.status(500).json({ error: "Failed to fetch SMS routing history" });
    }
  }
);

// Test SMS routing for a specific message type
app.post(
  "/api/admin/sms-routing/test/:messageType",
  authenticateUser,
  requireRole(["super_admin"]),
  async (req, res) => {
    try {
      const { messageType } = req.params;
      const { message } = req.body;

      const testMessage =
        message ||
        `Test message for ${messageType} routing from Gudino Custom Cabinets! 🧪`;

      const result = await sendSmsWithRouting(messageType, testMessage);

      res.json({
        success: result.success,
        message: result.success
          ? "Test SMS routing completed"
          : "Test SMS routing failed",
        details: result,
      });
    } catch (error) {
      console.error("Error testing SMS routing:", error);
      res.status(500).json({ error: "Failed to test SMS routing" });
    }
  }
);

// Admin endpoint - Send invoice via SMS
app.post(
  "/api/admin/invoices/:id/send-sms",
  authenticateUser,
  async (req, res) => {
    try {
      if (!twilioClient) {
        return res.status(500).json({ error: "SMS service not configured" });
      }

      const invoiceId = req.params.id;
      const { message, customPhone } = req.body;

      // Get invoice details with client info
      const invoice = await invoiceDb.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const client = await invoiceDb.getClientById(invoice.client_id);

      // Update invoice status from draft to unpaid when sending
      if (invoice.status === "draft") {
        await invoiceDb.markInvoiceAsSent(invoiceId);
      }

      // Use custom phone if provided by super admin, otherwise use client phone
      let targetPhone = customPhone;
      if (!customPhone) {
        if (!client || !client.phone) {
          return res
            .status(400)
            .json({ error: "Client phone number not found" });
        }
        targetPhone = client.phone;
      }

      // Get or create the invoice token for the client access link
      let invoiceToken = invoice.token;
      if (!invoiceToken) {
        // Create a new token for this invoice if it doesn't exist
        const tokenResult = await invoiceDb.createInvoiceToken(invoiceId);
        invoiceToken = tokenResult.token;
      }
      const viewLink = `${process.env.FRONTEND_URL}/invoice/${invoiceToken}`;

      const clientName =
        client.company_name || `${client.first_name} ${client.last_name}`;

      // Format phone number (ensure it has country code)
      let phoneNumber = targetPhone.replace(/\D/g, ""); // Remove non-digits
      if (phoneNumber.length === 10) {
        phoneNumber = `+1${phoneNumber}`; // Add US country code
      } else if (phoneNumber.length === 11 && phoneNumber.startsWith("1")) {
        phoneNumber = `+${phoneNumber}`;
      } else if (!phoneNumber.startsWith("+")) {
        phoneNumber = `+1${phoneNumber}`;
      }

      const smsBody = `Hi ${clientName}, your invoice ${invoice.invoice_number
        .split("-")
        .pop()} from Gudino Custom Cabinets is ready. Total: $${invoice.total_amount.toFixed(
        2
      )}. View online: ${viewLink}${message ? `. Message: ${message}` : ""}`;

      // Send SMS using messaging service (preferred method)
      const smsOptions = {
        body: smsBody,
        to: phoneNumber,
      };

      // Use messaging service if available, otherwise fallback to phone number
      if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        smsOptions.messagingServiceSid =
          process.env.TWILIO_MESSAGING_SERVICE_SID;
      } else if (process.env.TWILIO_PHONE_NUMBER) {
        smsOptions.from = process.env.TWILIO_PHONE_NUMBER;
      } else {
        throw new Error(
          "Neither messaging service SID nor phone number configured"
        );
      }

      await twilioClient.messages.create(smsOptions);

      res.json({
        success: true,
        message: "Invoice SMS sent successfully",
        sentTo: phoneNumber,
      });
    } catch (error) {
      console.error("Error sending invoice SMS:", error);
      res.status(500).json({ error: "Failed to send invoice SMS" });
    }
  }
);

// Admin endpoint - Update invoice number
app.put(
  "/api/admin/invoices/:id/invoice-number",
  authenticateUser,
  async (req, res) => {
    try {
      const invoiceId = req.params.id;
      const { invoice_number } = req.body;

      if (!invoice_number || !invoice_number.trim()) {
        return res.status(400).json({ error: "Invoice number is required" });
      }

      // Check if invoice exists
      const existingInvoice = await invoiceDb.getInvoiceById(invoiceId);
      if (!existingInvoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      // Check if invoice number is already in use by another invoice
      const duplicateInvoice = await invoiceDb.getInvoiceByNumber(
        invoice_number.trim()
      );
      if (duplicateInvoice && duplicateInvoice.id !== parseInt(invoiceId)) {
        return res.status(400).json({ error: "Invoice number already in use" });
      }

      // Update the invoice number
      const result = await invoiceDb.updateInvoiceNumber(
        invoiceId,
        invoice_number.trim(),
        req.user.id
      );

      res.json({
        success: true,
        message: "Invoice number updated successfully",
        invoice_number: invoice_number.trim(),
      });
    } catch (error) {
      console.error("Error updating invoice number:", error);
      res.status(500).json({ error: "Failed to update invoice number" });
    }
  }
);

// Admin endpoint - Delete invoice completely
app.delete("/api/admin/invoices/:id", authenticateUser, async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // Check if invoice exists
    const existingInvoice = await invoiceDb.getInvoiceById(invoiceId);
    if (!existingInvoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    // Delete the invoice (cascade delete will handle related records)
    const result = await invoiceDb.deleteInvoice(invoiceId, req.user.id);

    // Run health check to fix ID gaps after deletion
    try {
      await invoiceDb.performDatabaseHealthCheck();
    } catch (healthError) {
      console.error("Health check after invoice deletion failed:", healthError);
      // Continue even if health check fails
    }

    res.json({
      success: true,
      message: "Invoice deleted successfully",
      invoice_number: existingInvoice.invoice_number,
    });
  } catch (error) {
    console.error("Error deleting invoice:", error);
    res.status(500).json({ error: "Failed to delete invoice" });
  }
});

// Superadmin endpoint - Delete ALL invoices (requires special confirmation)
app.delete(
  "/api/superadmin/invoices/delete-all",
  authenticateUser,
  async (req, res) => {
    try {
      // Check if user is superadmin (you may need to add this field to users table)
      if (req.user.role !== "superadmin") {
        return res.status(403).json({ error: "Superadmin access required" });
      }

      const { confirmationCode } = req.body;

      if (!confirmationCode) {
        return res.status(400).json({
          error: "Confirmation code required",
          required_code: "DELETE_ALL_INVOICES_CONFIRM",
        });
      }

      const result = await invoiceDb.deleteAllInvoices(
        req.user.id,
        confirmationCode
      );

      // Run health check to reset sequences after deleting all invoices
      try {
        await invoiceDb.performDatabaseHealthCheck();
      } catch (healthError) {
        console.error(
          "Health check after deleting all invoices failed:",
          healthError
        );
        // Continue even if health check fails
      }

      res.json({
        message: `All invoices deleted successfully. ${result.deletedCount} invoices removed.`,
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error("Error deleting all invoices:", error);
      if (error.message === "Invalid confirmation code") {
        return res.status(400).json({
          error: error.message,
          required_code: "DELETE_ALL_INVOICES_CONFIRM",
        });
      }
      res.status(500).json({ error: "Failed to delete all invoices" });
    }
  }
);

// Admin endpoint - Create tax rate
app.post("/api/admin/tax-rates", authenticateUser, async (req, res) => {
  try {
    const { state_code, city, tax_rate, description } = req.body;

    if (!city || !tax_rate) {
      return res
        .status(400)
        .json({ error: "city and tax rate are required" });
    }

    // Validate tax rate is a valid number (now stored as percentage)
    const numericTaxRate = parseFloat(tax_rate);
    if (isNaN(numericTaxRate) || numericTaxRate < 0 || numericTaxRate > 100) {
      return res
        .status(400)
        .json({ error: "Tax rate must be a valid number between 0 and 100" });
    }

    // Check for duplicate
    const existing = await invoiceDb.findTaxRate(city,state_code || "");
    if (existing) {
      return res
        .status(400)
        .json({ error: "Tax rate already exists for this location" });
    }

    const result = await invoiceDb.createTaxRate({
      state_code: state_code.toUpperCase() || '',
      city: city,
      tax_rate: numericTaxRate, // Store as percentage
      updated_by: req.user.id,
    });

    res.json({
      success: true,
      message: "Tax rate created successfully",
      id: result.id,
    });
  } catch (error) {
    console.error("Error creating tax rate:", error);
    console.error("Error stack:", error.stack);
    console.error("Request body:", req.body);
    res
      .status(500)
      .json({ error: "Failed to create tax rate", details: error.message });
  }
});

// Admin endpoint - Update tax rate
app.put("/api/admin/tax-rates/:id", authenticateUser, async (req, res) => {
  try {
    const taxRateId = req.params.id;
    const { state_code, county, city, tax_rate, description, is_active } =
      req.body;

    if (!state_code || tax_rate === undefined) {
      return res
        .status(400)
        .json({ error: "State code and tax rate are required" });
    }

    // Validate tax rate is a valid number (now stored as percentage)
    const numericTaxRate = parseFloat(tax_rate);
    if (isNaN(numericTaxRate) || numericTaxRate < 0 || numericTaxRate > 100) {
      return res
        .status(400)
        .json({ error: "Tax rate must be a valid number between 0 and 100" });
    }

    // Check if tax rate exists
    const existing = await invoiceDb.getTaxRateById(taxRateId);
    if (!existing) {
      return res.status(404).json({ error: "Tax rate not found" });
    }

    // Check for duplicate if location changed
    if (
      state_code !== existing.state_code ||
      (county || "") !== (existing.county || "") ||
      (city || "") !== (existing.city || "")
    ) {
      const duplicate = await invoiceDb.findTaxRate(
        state_code,
        county || "",
        city || ""
      );
      if (duplicate && duplicate.id !== parseInt(taxRateId)) {
        return res
          .status(400)
          .json({ error: "Tax rate already exists for this location" });
      }
    }

    const result = await invoiceDb.updateTaxRate(taxRateId, {
      state_code: state_code.toUpperCase(),
      county: county || null,
      city: city || null,
      tax_rate: numericTaxRate, // Store as percentage
      description: description || null,
      is_active: is_active !== undefined ? is_active : existing.is_active,
      updated_by: req.user.id,
    });

    res.json({
      success: true,
      message: "Tax rate updated successfully",
    });
  } catch (error) {
    console.error("Error updating tax rate:", error);
    res.status(500).json({ error: "Failed to update tax rate" });
  }
});

// Admin endpoint - Delete tax rate
app.delete("/api/admin/tax-rates/:id", authenticateUser, async (req, res) => {
  try {
    const taxRateId = req.params.id;

    // Check if tax rate exists
    const existing = await invoiceDb.getTaxRateById(taxRateId);
    if (!existing) {
      return res.status(404).json({ error: "Tax rate not found" });
    }

    // Check if tax rate is being used by any invoices
    const inUse = await invoiceDb.isTaxRateInUse(taxRateId);
    if (inUse) {
      return res.status(400).json({
        error:
          "Cannot delete tax rate that is being used by existing invoices. Deactivate it instead.",
      });
    }

    const result = await invoiceDb.deleteTaxRate(taxRateId);

    res.json({
      success: true,
      message: "Tax rate deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tax rate:", error);
    res.status(500).json({ error: "Failed to delete tax rate" });
  }
});

// Admin endpoint - Bulk delete tax rates
app.post(
  "/api/admin/tax-rates/bulk-delete",
  authenticateUser,
  async (req, res) => {
    try {
      const { ids } = req.body;

      if (!Array.isArray(ids) || ids.length === 0) {
        return res
          .status(400)
          .json({ error: "Array of tax rate IDs is required" });
      }

      let deletedCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const id of ids) {
        try {
          // Check if tax rate exists
          const existing = await invoiceDb.getTaxRateById(id);
          if (!existing) {
            errors.push(`Tax rate with ID ${id} not found`);
            errorCount++;
            continue;
          }

          // Check if tax rate is being used by any invoices
          const inUse = await invoiceDb.isTaxRateInUse(id);
          if (inUse) {
            errors.push(
              `Cannot delete tax rate ID ${id} - it is being used by existing invoices`
            );
            errorCount++;
            continue;
          }

          await invoiceDb.deleteTaxRate(id);
          deletedCount++;
        } catch (error) {
          console.error(`Error deleting tax rate ${id}:`, error);
          errors.push(`Failed to delete tax rate ID ${id}`);
          errorCount++;
        }
      }

      res.json({
        success: true,
        message: `Successfully deleted ${deletedCount} tax rate(s)${
          errorCount > 0 ? `, failed to delete ${errorCount}` : ""
        }`,
        deletedCount,
        errorCount,
        errors,
      });
    } catch (error) {
      console.error("Error bulk deleting tax rates:", error);
      res.status(500).json({ error: "Failed to bulk delete tax rates" });
    }
  }
);

// Admin endpoint - Bulk add tax rates
app.post(
  "/api/admin/tax-rates/bulk-add",
  authenticateUser,
  async (req, res) => {
    try {
      const { taxRates } = req.body;

      if (!Array.isArray(taxRates) || taxRates.length === 0) {
        return res
          .status(400)
          .json({ error: "Array of tax rates is required" });
      }

      let createdCount = 0;
      let errorCount = 0;
      const errors = [];

      for (const taxRate of taxRates) {
        try {
          const { state_code, city, tax_rate, description } = taxRate;

          if (!state_code || !tax_rate) {
            errors.push(
              `Missing required fields (state_code, tax_rate) for entry: ${JSON.stringify(
                taxRate
              )}`
            );
            errorCount++;
            continue;
          }

          // Validate tax rate is a valid number
          const numericTaxRate = parseFloat(tax_rate);
          if (
            isNaN(numericTaxRate) ||
            numericTaxRate < 0 ||
            numericTaxRate > 1
          ) {
            errors.push(
              `Invalid tax rate ${tax_rate} - must be between 0 and 1`
            );
            errorCount++;
            continue;
          }

          // Check for duplicate
          const existing = await invoiceDb.findTaxRate(state_code, city || "");
          if (existing) {
            errors.push(
              `Tax rate already exists for ${state_code}${
                city ? `, ${city}` : ""
              }`
            );
            errorCount++;
            continue;
          }

          await invoiceDb.createTaxRate({
            state_code: state_code.toUpperCase(),
            city: city || null,
            tax_rate: numericTaxRate,
            description: description || null,
            updated_by: req.user.id,
          });

          createdCount++;
        } catch (error) {
          console.error(`Error creating tax rate:`, error);
          errors.push(`Failed to create tax rate: ${JSON.stringify(taxRate)}`);
          errorCount++;
        }
      }

      res.json({
        success: true,
        message: `Successfully created ${createdCount} tax rate(s)${
          errorCount > 0 ? `, failed to create ${errorCount}` : ""
        }`,
        createdCount,
        errorCount,
        errors,
      });
    } catch (error) {
      console.error("Error bulk adding tax rates:", error);
      res.status(500).json({ error: "Failed to bulk add tax rates" });
    }
  }
);

// Admin endpoint - Generate invoice PDF
app.get("/api/admin/invoices/:id/pdf", authenticateUser, async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // Get invoice details with client info and line items
    const invoice = await invoiceDb.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const client = await invoiceDb.getClientById(invoice.client_id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const lineItems = await invoiceDb.getInvoiceLineItems(invoiceId);

    // Get tax rate information to display city name
    const taxRateInfo = await invoiceDb.getTaxRateByRate(invoice.tax_rate);

    const clientName = client.is_business
      ? client.company_name
      : `${client.first_name} ${client.last_name}`;

    const clientAddress = client.address || "";

    // Read logo file and convert to base64
    const fs = require("fs");
    const path = require("path");
    let logoBase64 = "";
    let logoError = "";
    try {
      const logoPath = path.join(__dirname, "uploads", "logo.jpeg");

      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (error) {
      console.log("Logo file not found, PDF will generate without logo");
      logoError = error.message;
    }

    // Generate HTML for PDF
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${clientName} - ${invoice.invoice_number
      .split("-")
      .pop()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: rgba(110, 110, 110, 0.1); }
          .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; background: rgba(110, 110, 110, 0.1); }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid rgba(110, 110, 110, 1); padding-bottom: 30px; }
          .company-info { flex: 1; display: flex; align-items: flex-start; gap: 20px; }
          .company-logo { width: 300px;  object-fit: contain; flex-shrink: 0; }
          .company-text { flex: 1; }
          .company-name { font-size: 28px; font-weight: bold; color: rgba(0, 0, 0, 1); margin-bottom: 10px; }
          .company-details { font-size: 14px; color: rgba(0, 0, 0, 1); line-height: 1.5; }
          .invoice-title { font-size: 48px; font-weight: bold; color: rgba(0, 0, 0, 1); text-align: right; margin-bottom: 20px; }
          .invoice-meta { text-align: right; font-size: 14px; color: rgba(0, 0, 0, 1); }
          .billing-info { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
          .bill-to, .invoice-details { flex: 1; }
          .section-title { font-size: 18px; font-weight: bold; color: rgba(0, 0, 0, 1); margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
          .bill-to-content, .invoice-details-content { font-size: 14px; line-height: 1.6; color: rgba(0, 0, 0, 1); }
          .line-items { margin-bottom: 40px; }
          .line-items table { width: 100%; border-collapse: collapse; font-size: 14px; }
          .line-items th { background-color: rgba(110, 110, 110, 1); color: #000000ff; font-weight: bold; padding: 12px; border: 0.25px solid #000000ff; text-align: left; }
          .line-items td { background-color: rgba(110,110,110,0.15);padding: 12px; border: 0.5px solid #000000ff; vertical-align: top; }
          .line-items .text-center { text-align: center; }
          .line-items .text-right { text-align: right; }
          .item-title { font-weight: 600; margin-bottom: 5px; color: #1f2937; }
          .item-description { color: #4b5563; }
          .totals { margin-left: auto; width: 300px; margin-bottom: 40px; }
          .totals table { width: 100%; font-size: 14px; border-collapse: collapse; }
          .totals td {
            padding: 12px 15px;
            background-color: rgba(110, 110, 110, 0.15);
            border: 1px solid #000000ff;
            border-collapse: collapse;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 16px;
            background-color: rgba(110, 110, 110, 0.75) !important;
            border-top: 2px solid #000000ff;
            border-bottom: 2px solid #000000ff;
          }
          .totals .text-right { text-align: right; }
          .notes { margin-bottom: 40px; }
          .notes-content { background-color: #f9fafb; padding: 20px; border-left: 4px solid rgba(110, 110, 110, 1); font-size: 14px; line-height: 1.6; }
          .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        
        <div class="invoice-container">
       
          <div class="invoice-header">
          
            <div class="company-info">
              
              <div class="company-text">
                 ${
                   logoBase64
                     ? `<img src="${logoBase64}" alt="Company Logo" class="company-logo">`
                     : `<div style="width: 100px; height: 100px;  color: white; flex: 1; display: flex; align-items: center; justify-content: center; font-size: 10px; text-align: center;">NO LOGO<br/>${logoError}</div>`
                 }
                <div class="company-details">
                  Phone: (509) 515-4090<br>
                  Email: admin@gudinocustom.com<br>
                  Sunnyside, WA 98944
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-meta">
                <strong>Invoice #:</strong> ${
                  invoice.invoice_number.split("2025-")[1]
                }<br>
                <strong>Date:</strong> ${new Date(
                  invoice.invoice_date
                ).toLocaleDateString()}<br>
                <strong>Due Date:</strong> ${new Date(
                  invoice.due_date
                ).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div class="billing-info">
            <div class="bill-to">
              <div class="section-title">Bill To</div>
              <div class="bill-to-content">
                <strong>${clientName}</strong><br>
                ${client.email ? `${client.email}<br>` : ""}
                ${client.phone ? `${client.phone}<br>` : ""}
                ${
                  client.tax_exempt_number
                    ? `<br><em>Tax Exempt #: ${client.tax_exempt_number}</em>`
                    : ""
                }
              </div>
             </div>
              <div class="invoice-details">
                <div class="section-title">Invoice Details</div>
                  <div class="invoice-details-content">
                    <strong>Status:</strong> ${
                      invoice.status.charAt(0).toUpperCase() +
                      invoice.status.slice(1)
                    }<br>
                    <strong>Project Type:</strong> ${
                      client.is_business ? "Commercial" : "Residential"
                    }<br>
                    <strong> Service address:</strong> 
                    ${clientAddress ? `${clientAddress}<br>` : ""}
                  </div>
              </div>
           </div>

           <div class="line-items">
            <table>
              <thead>
                <tr>
                  <th>Item(s)</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems
                  .map((item) => {
                    let formattedDescription = item.description || "";
                    if (formattedDescription.includes("-")) {
                      const listItems = formattedDescription
                        .split("-")
                        .map((text) => text.trim())
                        .filter((text) => text.length > 0)
                        .map((text) => `<li>${text}</li>`)
                        .join("");
                      formattedDescription = `<ul style="margin: 5px 0; padding-left: 20px;">${listItems}</ul>`;
                    }
                    return `
                  <tr>
                    <td>
                      ${
                        item.title
                          ? `<div class="item-title">${item.title}</div>`
                          : ""
                      }
                      <div class="item-description">${formattedDescription}</div>
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">$${(item.unit_price || 0).toFixed(
                      2
                    )}</td>
                    <td class="text-right">$${(
                      (item.quantity || 0) * (item.unit_price || 0)
                    ).toFixed(2)}</td>
                  </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">$${(invoice.subtotal || 0).toFixed(
                  2
                )}</td>
              </tr>
              ${
                (invoice.discount_amount || 0) > 0
                  ? `
              <tr>
                <td>Discount:</td>
                <td class="text-right">-$${(
                  invoice.discount_amount || 0
                ).toFixed(2)}</td>
              </tr>
              `
                  : ""
              }
              ${
                (invoice.markup_amount || 0) > 0
                  ? `
              <tr>
                <td>Markup:</td>
                <td class="text-right">$${(invoice.markup_amount || 0).toFixed(
                  2
                )}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td>Tax${
                  taxRateInfo?.city
                    ? `: ${
                        taxRateInfo.city.charAt(0).toUpperCase() +
                        taxRateInfo.city.slice(1)
                      }`
                    : ""
                } (${(invoice.tax_rate || 0).toFixed(2)}%):</td>
                <td class="text-right">$${(invoice.tax_amount || 0).toFixed(
                  2
                )}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total:</strong></td>
                <td class="text-right"><strong>$${(
                  invoice.total_amount || 0
                ).toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>

          ${
            invoice.notes
              ? `
          <div class="notes">
            <div class="section-title">Additional Notes</div>
            <div class="notes-content">${invoice.notes}</div>
          </div>
          `
              : ""
          }

          <div class="footer">
            Thank you for your business!<br>
            For questions about this invoice, please contact us at admin@gudinocustom.com or (509) 515-4090
          </div>
        </div>
      </body>
      </html>`;

    // PDF generation options with Docker container support
    const options = {
      format: "A4",
      border: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
      paginationOffset: 1,
      type: "pdf",
      quality: "75",
      orientation: "portrait",
      timeout: 30000,
      // Puppeteer options for Docker containers
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-background-networking",
        "--memory-pressure-off",
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    };

    // Generate PDF
    const pdfBuffer = await generatePdfWithRetry(htmlContent, options);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice-${invoice.invoice_number
        .split("-")
        .pop()}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating PDF:", error);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

// Admin endpoint - Get design notification settings (super_admin only)
app.get(
  "/api/admin/design-notification-settings",
  authenticateUser,
  async (req, res) => {
    try {
      if (req.user.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      res.json({
        notificationType: process.env.DESIGN_NOTIFICATION_TYPE || "email",
        adminEmail: process.env.ADMIN_EMAIL,
        adminPhone: process.env.ADMIN_PHONE,
      });
    } catch (error) {
      console.error("Error getting notification settings:", error);
      res.status(500).json({ error: "Failed to get notification settings" });
    }
  }
);

// Admin endpoint - Update design notification settings (super_admin only)
app.put(
  "/api/admin/design-notification-settings",
  authenticateUser,
  async (req, res) => {
    try {
      if (req.user.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      const { notificationType } = req.body;

      if (!["email", "sms", "both"].includes(notificationType)) {
        return res.status(400).json({ error: "Invalid notification type" });
      }

      // Note: In a production environment, you'd want to store this in a database
      // For now, we'll just acknowledge the change (it won't persist across server restarts)
      process.env.DESIGN_NOTIFICATION_TYPE = notificationType;

      res.json({
        success: true,
        notificationType: notificationType,
        message: "Notification settings updated successfully",
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      res.status(500).json({ error: "Failed to update notification settings" });
    }
  }
);

// Admin endpoint - Get tax rates
app.get("/api/admin/tax-rates", authenticateUser, async (req, res) => {
  try {
    const rates = await invoiceDb.getTaxRates();
    res.json(rates);
  } catch (error) {
    console.error("Error getting tax rates:", error);
    res.status(500).json({ error: "Failed to get tax rates" });
  }
});

// Admin endpoint - Update tax rate
app.put("/api/admin/tax-rates/:id", authenticateUser, async (req, res) => {
  try {
    const taxData = { ...req.body, updated_by: req.user.id };
    await invoiceDb.updateTaxRate(req.params.id, taxData);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating tax rate:", error);
    res.status(500).json({ error: "Failed to update tax rate" });
  }
});

// Admin endpoint - Get reminder settings for an invoice
app.get(
  "/api/admin/invoices/:id/reminder-settings",
  authenticateUser,
  async (req, res) => {
    try {
      const settings = await invoiceDb.getReminderSettings(req.params.id);
      res.json(
        settings || { reminders_enabled: false, reminder_days: "7,14,30" }
      );
    } catch (error) {
      console.error("Error getting reminder settings:", error);
      res.status(500).json({ error: "Failed to get reminder settings" });
    }
  }
);

// Admin endpoint - Update reminder settings for an invoice
app.put(
  "/api/admin/invoices/:id/reminder-settings",
  authenticateUser,
  async (req, res) => {
    try {
      const { reminders_enabled, reminder_days } = req.body;
      await invoiceDb.updateReminderSettings(req.params.id, {
        reminders_enabled,
        reminder_days,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating reminder settings:", error);
      res.status(500).json({ error: "Failed to update reminder settings" });
    }
  }
);

// Admin endpoint - Send manual reminder for an invoice
app.post(
  "/api/admin/invoices/:id/send-reminder",
  authenticateUser,
  async (req, res) => {
    try {
      const invoiceId = req.params.id;
      const { reminder_type = "both", custom_message } = req.body;

      // Get invoice with client info
      const invoice = await invoiceDb.getInvoiceById(invoiceId);
      if (!invoice) {
        return res.status(404).json({ error: "Invoice not found" });
      }

      const client = await invoiceDb.getClientById(invoice.client_id);
      const clientName = client.is_business
        ? client.company_name
        : `${client.first_name} ${client.last_name}`;

      // Calculate days overdue
      const dueDate = new Date(invoice.due_date);
      const today = new Date();
      const daysOverdue = Math.ceil((today - dueDate) / (1000 * 60 * 60 * 24));

      // Calculate balance due
      const payments = await invoiceDb.getInvoicePayments(invoiceId);
      const totalPaid = payments.reduce(
        (sum, payment) => sum + parseFloat(payment.payment_amount),
        0
      );
      const balanceDue = invoice.total_amount - totalPaid;

      const viewLink = `${
        process.env.FRONTEND_URL || "https://gudinocustom.com"
      }/invoice/${invoice.public_token}`;

      let emailSuccess = true;
      let smsSuccess = true;

      // Send email reminder
      if (reminder_type === "email" || reminder_type === "both") {
        try {
          const emailMessage =
            custom_message ||
            `This is a friendly reminder that your invoice is ${
              daysOverdue > 0
                ? `${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`
                : "due soon"
            }.`;

          await emailTransporter.sendMail({
            from: process.env.EMAIL_FROM,
            to: client.email,
            subject: `Payment Reminder - Invoice ${invoice.invoice_number
              .split("-")
              .pop()}`,
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">Payment Reminder</h1>
              </div>
              
              <div style="padding: 30px; background: #f8fafc;">
                <h2 style="color: #1e3a8a; margin-top: 0;">Invoice ${invoice.invoice_number
                  .split("-")
                  .pop()}</h2>
                
                <p>Dear ${clientName},</p>
                
                <p>${emailMessage}</p>
                
                <div style="background: white; padding: 20px; border-radius: 5px; margin: 20px 0;">
                  <p><strong>Invoice Details:</strong></p>
                  <p><strong>Invoice Number:</strong> ${invoice.invoice_number
                    .split("-")
                    .pop()}</p>
                  <p><strong>Original Due Date:</strong> ${new Date(
                    invoice.due_date
                  ).toLocaleDateString()}</p>
                  <p><strong>Amount Due:</strong> $${balanceDue.toFixed(2)}</p>
                  ${
                    daysOverdue > 0
                      ? `<p style="color: #dc2626;"><strong>Days Overdue:</strong> ${daysOverdue}</p>`
                      : ""
                  }
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${viewLink}" 
                     style="background-color: #1e3a8a; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    View Invoice & Pay Online
                  </a>
                </div>
                
                <p>Please contact us if you have any questions about this invoice.</p>
                
                <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; color: #6b7280; font-size: 14px;">
                  <p>Gudino Custom Cabinets</p>
                  <p>Email: ${process.env.ADMIN_EMAIL}</p>
                  <p>Phone: ${process.env.ADMIN_PHONE || "(509) 790-3516"}</p>
                </div>
              </div>
            </div>
          `,
          });
        } catch (error) {
          console.error("Email reminder failed:", error);
          emailSuccess = false;
        }
      }

      // Send SMS reminder
      if (
        (reminder_type === "sms" || reminder_type === "both") &&
        client.phone &&
        twilioClient
      ) {
        try {
          const smsMessage = custom_message
            ? `Payment reminder: ${custom_message} Invoice ${invoice.invoice_number
                .split("-")
                .pop()} - $${balanceDue.toFixed(2)} due. View: ${viewLink}`
            : `Payment reminder: Invoice ${invoice.invoice_number
                .split("-")
                .pop()} is ${
                daysOverdue > 0
                  ? `${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`
                  : "due"
              } - $${balanceDue.toFixed(2)}. View: ${viewLink}`;

          const smsOptions = {
            body: smsMessage,
            to: client.phone,
          };

          if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
            smsOptions.messagingServiceSid =
              process.env.TWILIO_MESSAGING_SERVICE_SID;
          } else if (process.env.TWILIO_PHONE_NUMBER) {
            smsOptions.from = process.env.TWILIO_PHONE_NUMBER;
          }

          await twilioClient.messages.create(smsOptions);
        } catch (error) {
          console.error("SMS reminder failed:", error);
          smsSuccess = false;
        }
      }

      // Log the reminder attempt
      await invoiceDb.logReminder({
        invoice_id: invoiceId,
        reminder_type,
        days_overdue: daysOverdue,
        sent_by: req.user.id,
        message:
          custom_message ||
          `${daysOverdue > 0 ? "Overdue" : "Due"} payment reminder`,
        successful: emailSuccess && smsSuccess,
      });

      res.json({
        success: true,
        emailSent:
          reminder_type === "email" || reminder_type === "both"
            ? emailSuccess
            : null,
        smsSent:
          reminder_type === "sms" || reminder_type === "both"
            ? smsSuccess
            : null,
      });
    } catch (error) {
      console.error("Error sending reminder:", error);
      res.status(500).json({ error: "Failed to send reminder" });
    }
  }
);

// Admin endpoint - Get reminder history for an invoice
app.get(
  "/api/admin/invoices/:id/reminder-history",
  authenticateUser,
  async (req, res) => {
    try {
      const history = await invoiceDb.getReminderHistory(req.params.id);
      res.json(history);
    } catch (error) {
      console.error("Error getting reminder history:", error);
      res.status(500).json({ error: "Failed to get reminder history" });
    }
  }
);

// Helper function to get location from IP address
async function getLocationFromIP(ip) {
  console.log('🔍 getLocationFromIP called with IP:', ip);

  // Don't lookup localhost or private IPs, but provide useful dev data
  if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.startsWith('192.168.') || ip.startsWith('10.') || ip.startsWith('172.')) {
    console.log('📍 Using local/development location data for IP:', ip);
    const localData = {
      country: 'United States',
      region: 'Washington',
      city: 'Sunnyside',
      timezone: 'America/Los_Angeles'
    };
    console.log('📍 Returning local data:', localData);
    return localData;
  }

  try {
    // Clean IP address - remove IPv4-mapped IPv6 prefix if present
    const cleanIP = ip.replace(/^::ffff:/, '');

    // Use ip-api.com (free, no key required, 1000 requests/hour)
    const response = await fetch(`http://ip-api.com/json/${cleanIP}?fields=status,country,regionName,city,timezone`);
    const data = await response.json();

    if (data.status === 'success') {
      return {
        country: data.country || 'Unknown',
        region: data.regionName || 'Unknown',
        city: data.city || 'Unknown',
        timezone: data.timezone || 'UTC'
      };
    }
  } catch (error) {
    console.error('Error getting location from IP:', error);
  }

  // Fallback for any errors
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    timezone: 'UTC'
  };
}

// Public endpoint - Get invoice by token (for client viewing)
app.get("/api/invoice/:token", async (req, res) => {
  try {
    const token = req.params.token;
    const invoice = await invoiceDb.getInvoiceByToken(token);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found or expired" });
    }

    // Track the view with location data
    const clientIp =
      req.ip || req.connection.remoteAddress || req.headers["x-forwarded-for"];
    const userAgent = req.headers["user-agent"];

    const invoiceId = invoice.invoice_id;
    console.log('🌐 Invoice view tracking - Invoice ID:', invoiceId);
    console.log('🌐 Client IP:', clientIp);
    console.log('🌐 User Agent:', userAgent);

    // Get location data from IP (non-blocking)
    const locationData = await getLocationFromIP(clientIp);
    console.log('🌐 Location data received:', locationData);

    await invoiceDb.trackInvoiceView(invoiceId, token, clientIp, userAgent, locationData);
    console.log('✅ Invoice view tracked successfully');

    res.json(invoice);
  } catch (error) {
    console.error("Error getting invoice by token:", error);
    res.status(500).json({ error: "Failed to get invoice" });
  }
});

// Public endpoint - Generate invoice PDF by token (for client download)
app.get("/api/invoice/:token/pdf", async (req, res) => {
  try {
    const token = req.params.token;
    // Get token data first to extract invoice ID
    const tokenData = await invoiceDb.getInvoiceByToken(token);
    if (!tokenData) {
      return res
        .status(404)
        .json({ error: "Invoice not found or access expired" });
    }

    // Extract invoice ID and use exact same logic as working HTML preview
    const invoiceId = tokenData.invoice_id || tokenData.id;

    // Get invoice details with client info and line items (same as HTML preview)
    const invoice = await invoiceDb.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const client = await invoiceDb.getClientById(invoice.client_id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    const lineItems = await invoiceDb.getInvoiceLineItems(invoiceId);

    // Get tax rate information to display city name
    const taxRateInfo = await invoiceDb.getTaxRateByRate(invoice.tax_rate);

    const clientName = client.is_business
      ? client.company_name
      : `${client.first_name} ${client.last_name}`;

    const clientAddress = client.address || "";
    const payments = await invoiceDb.getInvoicePayments(invoiceId);
    const totalPaid = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.payment_amount),
      0
    );
    const balanceDue = invoice.total_amount - totalPaid;

    // Get tax rate information to display city name

    // Read logo file and convert to base64
    const fs = require("fs");
    const path = require("path");
    let logoBase64 = "";
    let logoError = "";
    try {
      const logoPath = path.join(__dirname, "uploads", "logo.jpeg");

      const logoBuffer = fs.readFileSync(logoPath);
      logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
    } catch (error) {
      console.log("Logo file not found, PDF will generate without logo");
      logoError = error.message;
    }

    // Generate HTML for PDF (same as admin version)
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${clientName} - ${invoice.invoice_number
      .split("-")
      .pop()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: rgba(110, 110, 110, 0.1); }
          .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; background: rgba(110, 110, 110, 0.1); }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid rgba(110, 110, 110, 1); padding-bottom: 30px; }
          .company-info { flex: 1; display: flex; align-items: flex-start; gap: 20px; }
          .company-logo { width: 300px;  object-fit: contain; flex-shrink: 0; }
          .company-text { flex: 1; }
          .company-name { font-size: 28px; font-weight: bold; color: rgba(0, 0, 0, 1); margin-bottom: 10px; }
          .company-details { font-size: 14px; color: rgba(0, 0, 0, 1); line-height: 1.5; }
          .invoice-title { font-size: 48px; font-weight: bold; color: rgba(0, 0, 0, 1); text-align: right; margin-bottom: 20px; }
          .invoice-meta { text-align: right; font-size: 14px; color: rgba(0, 0, 0, 1); }
          .billing-info { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
          .bill-to, .invoice-details { flex: 1; }
          .section-title { font-size: 18px; font-weight: bold; color: rgba(0, 0, 0, 1); margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
          .bill-to-content, .invoice-details-content { font-size: 14px; line-height: 1.6; color: rgba(0, 0, 0, 1); }
          .line-items { margin-bottom: 40px; }
          .line-items table { width: 100%; border-collapse: collapse; font-size: 14px; }
          .line-items th { background-color: rgba(110, 110, 110, 1); color: #000000ff; font-weight: bold; padding: 12px; border: 0.25px solid #000000ff; text-align: left; }
          .line-items td { background-color: rgba(110,110,110,0.15);padding: 12px; border: 0.5px solid #000000ff; vertical-align: top; }
          .line-items .text-center { text-align: center; }
          .line-items .text-right { text-align: right; }
          .item-title { font-weight: 600; margin-bottom: 5px; color: #1f2937; }
          .item-description { color: #4b5563; }
          .totals { margin-left: auto; width: 300px; margin-bottom: 40px; }
          .totals table { width: 100%; font-size: 14px; border-collapse: collapse; }
          .totals td {
            padding: 12px 15px;
            background-color: rgba(110, 110, 110, 0.15);
            border: 1px solid #000000ff;
            border-collapse: collapse;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 16px;
            background-color: rgba(110, 110, 110, 0.75) !important;
            border-top: 2px solid #000000ff;
            border-bottom: 2px solid #000000ff;
          }
          .totals .text-right { text-align: right; }
          .notes { margin-bottom: 40px; }
          .notes-content { background-color: #f9fafb; padding: 20px; border-left: 4px solid rgba(110, 110, 110, 1); font-size: 14px; line-height: 1.6; }
          .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        
        <div class="invoice-container">
       
          <div class="invoice-header">
          
            <div class="company-info">
              
              <div class="company-text">
                 ${
                   logoBase64
                     ? `<img src="${logoBase64}" alt="Company Logo" class="company-logo">`
                     : `<div style="width: 100px; height: 100px;  color: white; flex: 1; display: flex; align-items: center; justify-content: center; font-size: 10px; text-align: center;">NO LOGO<br/>${logoError}</div>`
                 }
                <div class="company-details">
                  Phone: (509) 515-4090<br>
                  Email: admin@gudinocustom.com<br>
                  SunnySide, WA 98944
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-meta">
                <strong>Invoice #:</strong> ${
                  invoice.invoice_number.split("2025-")[1]
                }<br>
                <strong>Date:</strong> ${new Date(
                  invoice.invoice_date
                ).toLocaleDateString()}<br>
                <strong>Due Date:</strong> ${new Date(
                  invoice.due_date
                ).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div class="billing-info">
            <div class="bill-to">
              <div class="section-title">Bill To</div>
              <div class="bill-to-content">
                <strong>${clientName}</strong><br>
                ${client.email ? `${client.email}<br>` : ""}
                ${client.phone ? `${client.phone}<br>` : ""}
                ${
                  client.tax_exempt_number
                    ? `<br><em>Tax Exempt #: ${client.tax_exempt_number}</em>`
                    : ""
                }
              </div>
             </div>
              <div class="invoice-details">
                <div class="section-title">Invoice Details</div>
                  <div class="invoice-details-content">
                    <strong>Status:</strong> ${
                      invoice.status.charAt(0).toUpperCase() +
                      invoice.status.slice(1)
                    }<br>
                    <strong>Project Type:</strong> ${
                      client.is_business ? "Commercial" : "Residential"
                    }<br>
                    <strong> Service address:</strong> 
                    ${clientAddress ? `${clientAddress}<br>` : ""}
                  </div>
              </div>
           </div>

           <div class="line-items">
            <table>
              <thead>
                <tr>
                  <th>Item(s)</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems
                  .map((item) => {
                    let formattedDescription = item.description || "";
                    if (formattedDescription.includes("-")) {
                      const listItems = formattedDescription
                        .split("-")
                        .map((text) => text.trim())
                        .filter((text) => text.length > 0)
                        .map((text) => `<li>${text}</li>`)
                        .join("");
                      formattedDescription = `<ul style="margin: 5px 0; padding-left: 20px;">${listItems}</ul>`;
                    }
                    return `
                  <tr>
                    <td>
                      ${
                        item.title
                          ? `<div class="item-title">${item.title}</div>`
                          : ""
                      }
                      <div class="item-description">${formattedDescription}</div>
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">$${(item.unit_price || 0).toFixed(
                      2
                    )}</td>
                    <td class="text-right">$${(
                      (item.quantity || 0) * (item.unit_price || 0)
                    ).toFixed(2)}</td>
                  </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">$${(invoice.subtotal || 0).toFixed(
                  2
                )}</td>
              </tr>
              ${
                (invoice.discount_amount || 0) > 0
                  ? `
              <tr>
                <td>Discount:</td>
                <td class="text-right">-$${(
                  invoice.discount_amount || 0
                ).toFixed(2)}</td>
              </tr>
              `
                  : ""
              }
              ${
                (invoice.markup_amount || 0) > 0
                  ? `
              <tr>
                <td>Markup:</td>
                <td class="text-right">$${(invoice.markup_amount || 0).toFixed(
                  2
                )}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td>Tax${
                  taxRateInfo?.city
                    ? `: ${
                        taxRateInfo.city.charAt(0).toUpperCase() +
                        taxRateInfo.city.slice(1)
                      }`
                    : ""
                } (${(invoice.tax_rate || 0).toFixed(2)}%):</td>
                <td class="text-right">$${(invoice.tax_amount || 0).toFixed(
                  2
                )}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total:</strong></td>
                <td class="text-right"><strong>$${(
                  invoice.total_amount || 0
                ).toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          <div>
            ${
              invoice.total_amount !== balanceDue
                ? `<strong>Payments Received:</strong>
              $${totalPaid.toFixed(2)}<br>
              <strong>Balance Due:</strong> $${balanceDue.toFixed(2)}`
                : `<strong>Balance Due:</strong> $${balanceDue.toFixed(2)}`
            }
          </div>
          ${
            invoice.notes
              ? `
          <div class="notes">
            <div class="section-title">Additional Notes</div>
            <div class="notes-content">${invoice.notes}</div>
          </div>
          `
              : ""
          }
          
          <div class="footer">
            Thank you for your business!<br>
            For questions about this invoice, please contact us at admin@gudinocustom.com or (509) 515-4090
          </div>
        </div>
      </body>
      </html>`;

    // PDF generation options with Docker container support
    const options = {
      format: "A4",
      border: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
      paginationOffset: 1,
      type: "pdf",
      quality: "75",
      orientation: "portrait",
      timeout: 30000,
      // Puppeteer options for Docker containers
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-background-networking",
        "--memory-pressure-off",
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    };

    // Generate PDF
    const pdfBuffer = await generatePdfWithRetry(htmlContent, options);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice-${invoice.invoice_number
        .split("-")
        .pop()}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating public PDF:", error);
    console.error("Error stack:", error.stack);
    console.error("Token:", req.params.token);
    res.status(500).json({
      error: "Failed to generate PDF",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Public endpoint - Get tracking data for invoice by token
app.get("/api/invoice/:token/tracking", async (req, res) => {
  try {
    const token = req.params.token;

    // First verify the token is valid and get invoice
    const invoice = await invoiceDb.getInvoiceByToken(token);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found or expired" });
    }

    // Get tracking data for this invoice using the invoice ID
    const invoiceId = invoice.invoice_id || invoice.id;

    // Get view tracking data
    const trackingData = await invoiceDb.getInvoiceTracking(invoiceId);

    res.json({
      totalViews: trackingData.length,
      uniqueIPs: [...new Set(trackingData.map(view => view.client_ip))].length,
      firstViewed: trackingData.length > 0 ? trackingData[trackingData.length - 1].viewed_at : null,
      lastViewed: trackingData.length > 0 ? trackingData[0].viewed_at : null,
      recentViews: trackingData.slice(0, 10), // Last 10 views
      locationSummary: trackingData.reduce((acc, view) => {
        const location = view.city && view.country
          ? `${view.city}, ${view.country}`
          : view.country || 'Unknown';
        acc[location] = (acc[location] || 0) + 1;
        return acc;
      }, {})
    });
  } catch (error) {
    console.error("Error getting invoice tracking:", error);
    res.status(500).json({ error: "Failed to get tracking data" });
  }
});

// Public endpoint - Get invoice HTML preview (for debugging - no auth required)
app.get("/api/invoice/:id/html-preview", async (req, res) => {
  try {
    const invoiceId = req.params.id;

    // Get invoice details with client info and line items
    const invoice = await invoiceDb.getInvoiceById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ error: "Invoice not found" });
    }

    const client = await invoiceDb.getClientById(invoice.client_id);
    if (!client) {
      return res.status(404).json({ error: "Client not found" });
    }

    // Get tax rate information to display city name
    const taxRateInfo = await invoiceDb.getTaxRateByRate(invoice.tax_rate);

    const lineItems = await invoiceDb.getInvoiceLineItems(invoiceId);

    const clientName = client.is_business
      ? client.company_name
      : `${client.first_name} ${client.last_name}`;

    const clientAddress = client.address || "";
    const payments = await invoiceDb.getInvoicePayments(invoiceId);
    const totalPaid = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.payment_amount),
      0
    );
    const balanceDue = invoice.total_amount - totalPaid;

    // Read logo file and convert to base64
    const fs = require("fs");
    const path = require("path");
    let logoBase64 = "";
    let logoError = "";
    try {
      const logoPath = path.join(__dirname, "uploads", "logo.jpeg");
      console.log("Looking for logo at:", logoPath);
      console.log("Logo file exists:", fs.existsSync(logoPath));

      if (fs.existsSync(logoPath)) {
        const logoBuffer = fs.readFileSync(logoPath);
        logoBase64 = `data:image/png;base64,${logoBuffer.toString("base64")}`;
        console.log(
          "Logo loaded successfully, size:",
          logoBuffer.length,
          "bytes"
        );
      } else {
        logoError = "Logo file not found at path";
      }
    } catch (error) {
      console.log("Logo file error:", error.message);
      logoError = error.message;
    }

    // Generate HTML with debug info
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${clientName} - ${invoice.invoice_number
      .split("-")
      .pop()}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: rgba(110, 110, 110, 0.1); }
          .invoice-container { max-width: 800px; margin: 0 auto; padding: 40px; background: rgba(110, 110, 110, 0.1); }
          .invoice-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 40px; border-bottom: 3px solid rgba(110, 110, 110, 1); padding-bottom: 30px; }
          .company-info { flex: 1; display: flex; align-items: flex-start; gap: 20px; }
          .company-logo { width: 300px;  object-fit: contain; flex-shrink: 0; }
          .company-text { flex: 1; }
          .company-name { font-size: 28px; font-weight: bold; color: rgba(0, 0, 0, 1); margin-bottom: 10px; }
          .company-details { font-size: 14px; color: rgba(0, 0, 0, 1); line-height: 1.5; }
          .invoice-title { font-size: 48px; font-weight: bold; color: rgba(0, 0, 0, 1); text-align: right; margin-bottom: 20px; }
          .invoice-meta { text-align: right; font-size: 14px; color: rgba(0, 0, 0, 1); }
          .billing-info { display: flex; justify-content: space-between; margin-bottom: 40px; gap: 40px; }
          .bill-to, .invoice-details { flex: 1; }
          .section-title { font-size: 18px; font-weight: bold; color: rgba(0, 0, 0, 1); margin-bottom: 15px; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; }
          .bill-to-content, .invoice-details-content { font-size: 14px; line-height: 1.6; color: rgba(0, 0, 0, 1); }
          .line-items { margin-bottom: 20px; }
          .line-items table { width: 100%; border-collapse: collapse; font-size: 14px; }
          .line-items th { background-color: rgba(110, 110, 110, 1); color: #000000ff; font-weight: bold; padding: 12px; border: 0.25px solid #000000ff; text-align: left; }
          .line-items td { background-color: rgba(110,110,110,0.15);padding: 12px; border: 0.5px solid #000000ff; vertical-align: top; }
          .line-items .text-center { text-align: center; }
          .line-items .text-right { text-align: right; }
          .item-title { font-weight: 600; margin-bottom: 5px; color: #1f2937; }
          .item-description { color: #4b5563; }
          .totals { margin-left: auto; width: 300px; margin-bottom: 40px; }
          .totals table { width: 100%; font-size: 14px; border-collapse: collapse; }
          .totals td {
            padding: 12px 15px;
            background-color: rgba(110, 110, 110, 0.15);
            border: 1px solid #000000ff;
            border-collapse: collapse;
          }
          .totals .total-row {
            font-weight: bold;
            font-size: 16px;
            background-color: rgba(110, 110, 110, 0.75) !important;
            border-top: 2px solid #000000ff;
            border-bottom: 2px solid #000000ff;
          }
          .totals .text-right { text-align: right; }
          .notes { margin-bottom: 20px; }
          .notes-content { background-color: #f9fafb; padding: 20px; border-left: 4px solid rgba(110, 110, 110, 1); font-size: 14px; line-height: 1.6; }
          .footer { text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        
        <div class="invoice-container">
       
          <div class="invoice-header">
          
            <div class="company-info">
              
              <div class="company-text">
                 ${
                   logoBase64
                     ? `<img src="${logoBase64}" alt="Company Logo" class="company-logo">`
                     : `<div style="width: 100px; height: 100px;  color: white; flex: 1; display: flex; align-items: center; justify-content: center; font-size: 10px; text-align: center;">NO LOGO<br/>${logoError}</div>`
                 }
                <div class="company-details">
                  Phone: (509) 515-4090<br>
                  Email: admin@gudinocustom.com<br>
                  Sunnyside, WA 98944
                </div>
              </div>
            </div>
            <div style="text-align: right;">
              <div class="invoice-title">INVOICE</div>
              <div class="invoice-meta">
                <strong>Invoice #:</strong> ${
                  invoice.invoice_number.split("2025-")[1]
                }<br>
                <strong>Date:</strong> ${new Date(
                  invoice.invoice_date
                ).toLocaleDateString()}<br>
                <strong>Due Date:</strong> ${new Date(
                  invoice.due_date
                ).toLocaleDateString()}
              </div>
            </div>
          </div>

          <div class="billing-info">
            <div class="bill-to">
              <div class="section-title">Bill To</div>
              <div class="bill-to-content">
                <strong>${clientName}</strong><br>
                ${client.email ? `${client.email}<br>` : ""}
                ${client.phone ? `${client.phone}<br>` : ""}
                ${
                  client.tax_exempt_number
                    ? `<br><em>Tax Exempt #: ${client.tax_exempt_number}</em>`
                    : ""
                }
              </div>
             </div>
              <div class="invoice-details">
                <div class="section-title">Invoice Details</div>
                  <div class="invoice-details-content">
                    <strong>Status:</strong> ${
                      invoice.status.charAt(0).toUpperCase() +
                      invoice.status.slice(1)
                    }<br>
                    <strong>Project Type:</strong> ${
                      client.is_business ? "Commercial" : "Residential"
                    }<br>
                    <strong> Service address:</strong> 
                    ${clientAddress ? `${clientAddress}<br>` : ""}
                  </div>
              </div>
           </div>

           <div class="line-items">
            <table>
              <thead>
                <tr>
                  <th>Item(s)</th>
                  <th class="text-center">Qty</th>
                  <th class="text-right">Rate</th>
                  <th class="text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                ${lineItems
                  .map((item) => {
                    let formattedDescription = item.description || "";
                    if (formattedDescription.includes("-")) {
                      const listItems = formattedDescription
                        .split("-")
                        .map((text) => text.trim())
                        .filter((text) => text.length > 0)
                        .map((text) => `<li>${text}</li>`)
                        .join("");
                      formattedDescription = `<ul style="margin: 5px 0; padding-left: 20px;">${listItems}</ul>`;
                    }
                    return `
                  <tr>
                    <td>
                      ${
                        item.title
                          ? `<div class="item-title">${item.title}</div>`
                          : ""
                      }
                      <div class="item-description">${formattedDescription}</div>
                    </td>
                    <td class="text-center">${item.quantity}</td>
                    <td class="text-right">$${(item.unit_price || 0).toFixed(
                      2
                    )}</td>
                    <td class="text-right">$${(
                      (item.quantity || 0) * (item.unit_price || 0)
                    ).toFixed(2)}</td>
                  </tr>
                  `;
                  })
                  .join("")}
              </tbody>
            </table>
          </div>

          <div class="totals">
            <table>
              <tr>
                <td>Subtotal:</td>
                <td class="text-right">$${(invoice.subtotal || 0).toFixed(
                  2
                )}</td>
              </tr>
              ${
                (invoice.discount_amount || 0) > 0
                  ? `
              <tr>
                <td>Discount:</td>
                <td class="text-right">-$${(
                  invoice.discount_amount || 0
                ).toFixed(2)}</td>
              </tr>
              `
                  : ""
              }
              ${
                (invoice.markup_amount || 0) > 0
                  ? `
              <tr>
                <td>Markup:</td>
                <td class="text-right">$${(invoice.markup_amount || 0).toFixed(
                  2
                )}</td>
              </tr>
              `
                  : ""
              }
              <tr>
                <td>Tax${
                  taxRateInfo?.city
                    ? `: ${
                        taxRateInfo.city.charAt(0).toUpperCase() +
                        taxRateInfo.city.slice(1)
                      }`
                    : ""
                } (${(invoice.tax_rate || 0).toFixed(2)}%):</td>
                <td class="text-right">$${(invoice.tax_amount || 0).toFixed(
                  2
                )}</td>
              </tr>
              <tr class="total-row">
                <td><strong>Total:</strong></td>
                <td class="text-right"><strong>$${(
                  invoice.total_amount || 0
                ).toFixed(2)}</strong></td>
              </tr>
            </table>
          </div>
          <div>
            ${
              invoice.total_amount !== balanceDue
                ? `<strong>Payments Received:</strong>
              $${totalPaid.toFixed(2)}<br>
              <strong>Balance Due:</strong> $${balanceDue.toFixed(2)}`
                : `<strong>Balance Due:</strong> $${balanceDue.toFixed(2)}`
            }
          </div>
          ${
            invoice.notes
              ? `
          <div class="notes">
            <div class="section-title">Additional Notes</div>
            <div class="notes-content">${invoice.notes}</div>
          </div>
          `
              : ""
          }

          <div class="footer">
            Thank you for your business!<br>
            For questions about this invoice, please contact us at admin@gudinocustom.com or (509) 515-4090
          </div>
        </div>
      </body>
      </html>`;

    // PDF generation options with Docker container support
    const options = {
      format: "A4",
      border: {
        top: "0.5in",
        right: "0.5in",
        bottom: "0.5in",
        left: "0.5in",
      },
      paginationOffset: 1,
      type: "pdf",
      quality: "75",
      orientation: "portrait",
      timeout: 30000,
      // Puppeteer options for Docker containers
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-features=VizDisplayCompositor",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-background-networking",
        "--memory-pressure-off",
      ],
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
    };

    // Generate PDF
    const pdfBuffer = await generatePdfWithRetry(htmlContent, options);

    // Set response headers
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice-${invoice.invoice_number
        .split("-")
        .pop()}.pdf"`
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    // Send PDF
    res.send(pdfBuffer);
  } catch (error) {
    console.error("Error generating public PDF:", error);
    console.error("Error stack:", error.stack);
    console.error("Token:", req.params.token);
    res.status(500).json({
      error: "Failed to generate PDF",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// =========================
// TESTIMONIAL ENDPOINTS
// =========================

// Public endpoint - Get all visible testimonials
app.get("/api/testimonials", async (req, res) => {
  try {
    const testimonials = await testimonialDb.getAllTestimonials(true);
    res.json(testimonials);
  } catch (error) {
    console.error("Error getting testimonials:", error);
    res.status(500).json({ error: "Failed to get testimonials" });
  }
});

// Public endpoint - Validate testimonial token
app.get("/api/testimonials/validate-token/:token", async (req, res) => {
  try {
    const tokenData = await testimonialDb.validateToken(req.params.token);
    res.json({ valid: !!tokenData });
  } catch (error) {
    console.error("Error validating token:", error);
    res.status(500).json({ error: "Failed to validate token" });
  }
});

// Public endpoint - Submit testimonial with photos
app.post(
  "/api/testimonials/submit",
  uploadMemory.array("photos", 5),
  async (req, res) => {
    try {
      const { client_name, message, rating, project_type, token } = req.body;

      // Validate token (skip validation if token is 'test' for development)
      let tokenData;

      if (token === "test") {
        tokenData = {
          id: "test",
          client_email: "test@example.com",
          client_name: client_name,
        };
      } else {
        tokenData = await testimonialDb.validateToken(token);
      }

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

// Admin endpoint - Send testimonial link
app.post(
  "/api/admin/send-testimonial-link",
  authenticateUser,
  async (req, res) => {
    try {
      const { client_name, client_email, project_type } = req.body;

      // Create token
      const tokenData = await testimonialDb.createToken({
        client_name,
        client_email,
        project_type,
        sent_by: req.user.id,
      });

      // Send email
      const testimonialLink = `${req.protocol}://${req
        .get("host")
        .replace("api.", "")}/testimonial/${tokenData.token}`;

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: client_email,
        subject: "Share Your Experience with Gudino Custom Woodworking",
        html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Hi ${client_name},</h2>
          <p>Thank you for choosing Gudino Custom Woodworking for your ${project_type} project!</p>
          <p>We'd love to hear about your experience and see photos of your completed project. Your feedback helps other homeowners discover our carpentry services.</p>
          <p style="text-align: center; margin: 30px 0;">
            <a href="${testimonialLink}" style="background: #3b82f6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block;">Share Your Experience</a>
          </p>
          <p><small>This link will expire in 30 days. If you have any questions, please don't hesitate to contact us.</small></p>
          <p>Best regards,<br>Gudino Custom Woodworking Team</p>
        </div>
      `,
      };

      await emailTransporter.sendMail(mailOptions);

      res.json({ success: true, token: tokenData.token });
    } catch (error) {
      console.error("Error sending testimonial link:", error);
      res.status(500).json({ error: "Failed to send testimonial link" });
    }
  }
);

// Admin endpoint - Get all testimonials
app.get("/api/admin/testimonials", authenticateUser, async (req, res) => {
  try {
    const testimonials = await testimonialDb.getAllTestimonials(false);
    res.json(testimonials);
  } catch (error) {
    console.error("Error getting admin testimonials:", error);
    res.status(500).json({ error: "Failed to get testimonials" });
  }
});

// Admin endpoint - Get testimonial tokens
app.get("/api/admin/testimonial-tokens", authenticateUser, async (req, res) => {
  try {
    const tokens = await testimonialDb.getTokens();
    res.json(tokens);
  } catch (error) {
    console.error("Error getting testimonial tokens:", error);
    res.status(500).json({ error: "Failed to get testimonial tokens" });
  }
});

// Admin endpoint - Delete testimonial token
app.delete(
  "/api/admin/testimonial-tokens/:token",
  authenticateUser,
  async (req, res) => {
    try {
      const { token } = req.params;
      await testimonialDb.deleteToken(token);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting testimonial token:", error);
      res.status(500).json({ error: "Failed to delete testimonial token" });
    }
  }
);

// Admin endpoint - Update testimonial visibility
app.put(
  "/api/admin/testimonials/:id/visibility",
  authenticateUser,
  async (req, res) => {
    try {
      const { is_visible } = req.body;
      await testimonialDb.updateTestimonialVisibility(
        req.params.id,
        is_visible
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Error updating testimonial visibility:", error);
      res
        .status(500)
        .json({ error: "Failed to update testimonial visibility" });
    }
  }
);

// Admin endpoint - Delete testimonial (super admin only)
app.delete(
  "/api/admin/testimonials/:id",
  authenticateUser,
  async (req, res) => {
    try {
      if (req.user.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }

      // Get testimonial photos to delete files
      const testimonial = await testimonialDb.getTestimonialById(req.params.id);
      if (testimonial && testimonial.photos) {
        for (const photo of testimonial.photos) {
          try {
            await fs.unlink(path.join(__dirname, "public", photo.file_path));
            if (photo.thumbnail_path) {
              await fs.unlink(
                path.join(__dirname, "public", photo.thumbnail_path)
              );
            }
          } catch (err) {
            console.warn("Could not delete photo file:", err.message);
          }
        }
      }

      await testimonialDb.deleteTestimonial(req.params.id);
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting testimonial:", error);
      res.status(500).json({ error: "Failed to delete testimonial" });
    }
  }
);

// Admin endpoint - Get testimonial analytics
app.get(
  "/api/admin/testimonial-analytics",
  authenticateUser,
  async (req, res) => {
    try {
      const dateRange = parseInt(req.query.days) || 30;
      const db = await getDb();

      // Get testimonial submission stats
      const submissions = await db.get(`
      SELECT 
        COUNT(*) as total_submissions,
        AVG(rating) as avg_rating,
        COUNT(CASE WHEN photos.testimonial_id IS NOT NULL THEN 1 END) as submissions_with_photos
      FROM testimonials t
      LEFT JOIN (
        SELECT DISTINCT testimonial_id 
        FROM testimonial_photos
      ) photos ON t.id = photos.testimonial_id
      WHERE t.created_at >= datetime('now', '-${dateRange} days')
    `);

      // Get testimonial activity by day
      const dailyActivity = await db.all(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as submissions
      FROM testimonials 
      WHERE created_at >= datetime('now', '-${dateRange} days')
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 30
    `);

      // Get rating distribution
      const ratingDistribution = await db.all(`
      SELECT 
        rating,
        COUNT(*) as count
      FROM testimonials 
      WHERE created_at >= datetime('now', '-${dateRange} days')
      GROUP BY rating
      ORDER BY rating DESC
    `);

      // Get project types
      const projectTypes = await db.all(`
      SELECT 
        project_type,
        COUNT(*) as count,
        AVG(rating) as avg_rating
      FROM testimonials 
      WHERE created_at >= datetime('now', '-${dateRange} days')
      GROUP BY project_type
      ORDER BY count DESC
    `);

      // Get testimonial link activity
      const linkActivity = await db.all(`
      SELECT 
        COUNT(*) as total_links_sent,
        COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) as links_used,
        ROUND(
          (COUNT(CASE WHEN used_at IS NOT NULL THEN 1 END) * 100.0 / COUNT(*)), 1
        ) as conversion_rate
      FROM testimonial_tokens 
      WHERE created_at >= datetime('now', '-${dateRange} days')
    `);

      //await db.close();

      res.json({
        submissions: submissions || {
          total_submissions: 0,
          avg_rating: 0,
          submissions_with_photos: 0,
        },
        daily_activity: dailyActivity,
        rating_distribution: ratingDistribution,
        project_types: projectTypes,
        link_activity: linkActivity[0] || {
          total_links_sent: 0,
          links_used: 0,
          conversion_rate: 0,
        },
      });
    } catch (error) {
      console.error("Error fetching testimonial analytics:", error);
      res.status(500).json({ error: "Failed to fetch testimonial analytics" });
    }
  }
);

// Serve testimonial photos
app.use(
  "/testimonial-photos",
  express.static(path.join(__dirname, "public", "testimonial-photos"))
);

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res
        .status(400)
        .json({ error: "File too large. Maximum size is 10MB." });
    }
  }

  console.error("Unhandled error:", error);
  res.status(500).json({ error: "Internal server error" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});
const PORT = process.env.PORT || 3001;

// =========================
// Automatic Invoice Reminder System
// =========================

async function checkAndSendAutomaticReminders() {
  try {
    console.log("🔍 Checking for invoices needing automatic reminders...");

    // Get all invoices that need reminders
    const invoices = await invoiceDb.getInvoicesNeedingReminders();

    if (invoices.length === 0) {
      console.log("✅ No invoices need reminders at this time");
      return;
    }

    console.log(
      `📋 Found ${invoices.length} invoice(s) that may need reminders`
    );

    for (const invoice of invoices) {
      try {
        // Skip if reminders are disabled for this invoice
        if (!invoice.reminders_enabled) {
          continue;
        }

        // Parse reminder days (e.g., "7,14,30" -> [7, 14, 30])
        const reminderDays = invoice.reminder_days
          ? invoice.reminder_days.split(",").map((d) => parseInt(d.trim()))
          : [7, 14, 30]; // Default reminder schedule

        // Calculate days overdue
        const dueDate = new Date(invoice.due_date);
        const today = new Date();
        const daysOverdue = Math.ceil(
          (today - dueDate) / (1000 * 60 * 60 * 24)
        );

        // Check if we should send a reminder today
        const shouldSendReminder = reminderDays.includes(daysOverdue);

        if (!shouldSendReminder) {
          continue;
        }

        // Check if we already sent a reminder today for this number of days
        const lastReminderDate = invoice.last_reminder_sent_at
          ? new Date(invoice.last_reminder_sent_at)
          : null;
        const todayString = today.toDateString();

        if (
          lastReminderDate &&
          lastReminderDate.toDateString() === todayString
        ) {
          console.log(
            `⏭️  Reminder already sent today for invoice ${invoice.invoice_number}`
          );
          continue;
        }

        // Get client information
        const client = await invoiceDb.getClientById(invoice.client_id);
        if (!client) {
          console.warn(
            `⚠️  No client found for invoice ${invoice.invoice_number}`
          );
          continue;
        }

        // Calculate balance due
        const totalPaid = invoice.total_paid || 0;
        const balanceDue = invoice.total_amount - totalPaid;

        if (balanceDue <= 0.01) {
          console.log(
            `✅ Invoice ${invoice.invoice_number} is already paid, skipping reminder`
          );
          continue;
        }

        // Generate view link
        const viewLink = `${
          process.env.FRONTEND_URL || "https://gudinocustom.com"
        }/invoice/${invoice.public_token}`;

        // Send SMS reminder directly to client (not using routing system)
        const smsMessage = `Payment reminder: Invoice ${invoice.invoice_number
          .split("-")
          .pop()} is ${
          daysOverdue > 0
            ? `${daysOverdue} day${daysOverdue > 1 ? "s" : ""} overdue`
            : "due"
        } - $${balanceDue.toFixed(2)}. View: ${viewLink}`;

        let smsResult = {
          success: false,
          error: "No phone number or SMS service unavailable",
        };

        if (client.phone && twilioClient) {
          try {
            const messagingServiceSid =
              process.env.TWILIO_MESSAGING_SERVICE_SID;
            const fromNumber = process.env.TWILIO_PHONE_NUMBER;

            const smsOptions = {
              body: smsMessage,
              to: client.phone,
            };

            if (messagingServiceSid) {
              smsOptions.messagingServiceSid = messagingServiceSid;
            } else if (fromNumber) {
              smsOptions.from = fromNumber;
            } else {
              throw new Error(
                "No Twilio messaging service or phone number configured"
              );
            }

            await twilioClient.messages.create(smsOptions);
            smsResult = { success: true, totalSent: 1 };
            console.log(
              `📱 SMS reminder sent to client ${client.name} (${client.phone})`
            );
          } catch (smsError) {
            console.error(
              `❌ Failed to send SMS reminder to client:`,
              smsError
            );
            smsResult = { success: false, error: smsError.message };
          }
        }

        // Log the reminder in database
        await invoiceDb.logReminder({
          invoice_id: invoice.id,
          reminder_type: "sms",
          days_overdue: daysOverdue,
          sent_by: "system",
          message: smsMessage,
          successful: smsResult.success,
        });

        if (smsResult.success) {
          console.log(
            `📱 Automatic reminder sent for invoice ${invoice.invoice_number} (${daysOverdue} days overdue) to ${smsResult.totalSent} recipient(s)`
          );
        } else {
          console.error(
            `❌ Failed to send automatic reminder for invoice ${invoice.invoice_number}:`,
            smsResult.error
          );
        }
      } catch (error) {
        console.error(
          `❌ Error processing reminder for invoice ${invoice.invoice_number}:`,
          error
        );
      }
    }
  } catch (error) {
    console.error("❌ Error in automatic reminder system:", error);
  }
}

// Start automatic reminder checker (runs every hour)
function startAutomaticReminderSystem() {
  console.log("🚀 Starting automatic invoice reminder system...");

  // Run immediately on startup
  setTimeout(checkAndSendAutomaticReminders, 5000); // Wait 5 seconds after startup

  // Then run every hour
  setInterval(checkAndSendAutomaticReminders, 60 * 60 * 1000); // 1 hour = 60 * 60 * 1000 ms

  console.log(
    "⏰ Automatic reminders will check every hour for overdue invoices"
  );
}

// Startup health check and auto-repair
async function initializeServer() {
  try {
    // Run database migration for line item labels
    await invoiceDb.migrateLineItemLabelsTable();

    // Fix tax rate floating point precision issues
    await invoiceDb.fixTaxRatePrecision();

    // Convert tax rates from decimals to percentages
    await invoiceDb.convertTaxRatesToPercentages();

    // Run database health check on startup
    await invoiceDb.performDatabaseHealthCheck();
  } catch (error) {
    console.error("❌ Startup health check failed:", error);
    // Continue startup even if health check fails
  }

  app.listen(PORT, () => {
    console.log(`\n=================================`);
    console.log(`Server running on port ${PORT}`);
    console.log(`API: http://localhost:${PORT}/api/photos`);
    console.log(`Static files: http://localhost:${PORT}/photos/`);
    console.log(`Debug uploads: http://localhost:${PORT}/api/debug/uploads`);
    console.log(`=================================\n`);

    // Start the automatic reminder system
    startAutomaticReminderSystem();
  });
}

// Start the server with health check
initializeServer();
