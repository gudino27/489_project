// ============================================================================
// This file contains all employee-related API endpoints

// ============================================================================
// REQUIRED IMPORTS 
const express = require("express");
const router = express.Router();
const sharp = require("sharp");
const path = require("path");
const fs = require("fs").promises;
const { employeeDb } = require("../db-helpers");
const { authenticateUser } = require("../middleware/auth");
const { upload } = require("../middleware/upload");
// Get all employees
router.get("", async (req, res) => {
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
router.get("/:id", async (req, res) => {
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
router.post("", upload.single("photo"), async (req, res) => {
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
router.put("/reorder", async (req, res) => {
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
router.put("/:id", upload.single("photo"), async (req, res) => {
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
router.delete("/:id", async (req, res) => {
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
// EXPORTS
module.exports = router;
