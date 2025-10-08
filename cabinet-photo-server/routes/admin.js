// This file contains admin-only configuration endpoints
// REQUIRED IMPORTS 
const express = require("express");
const router = express.Router();
const {getDb,userDb, invoiceDb} = require("../db-helpers");
const { authenticateUser, requireRole } = require("../middleware/auth");
const { twilioClient } = require("../utils/sms");
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
    console.warn("  Twilio client not available for SMS routing");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const settings = await getSmsRoutingSettings(messageType);

    if (!settings.is_enabled) {
      console.log(` SMS routing disabled for ${messageType}`);
      return { success: true, message: "SMS routing disabled" };
    }

    const recipients = await getSmsRoutingRecipients(messageType);

    if (recipients.length === 0) {
      console.warn(`  No SMS recipients configured for ${messageType}`);
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
          ` SMS sent to ${recipient.name} (${recipient.phone_number}) - SID: ${result.sid}`
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

        console.error(`  SMS failed to ${recipient.name}: ${error.message}`);
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
// User management endpoints (super admin only)
router.get("/api/users",authenticateUser,requireRole("super_admin"),async (req, res) => {
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
router.post("/api/users",authenticateUser,requireRole("super_admin"),async (req, res) => {
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
router.put("/api/users/:id",authenticateUser,requireRole("super_admin"),async (req, res) => {
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
router.delete("/api/users/:id",authenticateUser,requireRole("super_admin"),async (req, res) => {
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
// SMS Routing Management Endpoints
// Get SMS routing settings
router.get("/api/admin/sms-routing/settings",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
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
router.put("/api/admin/sms-routing/settings/:messageType",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
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
router.get("/api/admin/sms-routing/recipients",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
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
router.post("/api/admin/sms-routing/recipients",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
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
router.put("/api/admin/sms-routing/recipients/:id",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
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
router.delete("/api/admin/sms-routing/recipients/:id",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
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
router.get("/api/admin/sms-routing/history",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
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
router.post("/api/admin/sms-routing/test/:messageType",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
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
// Test SMS endpoint
router.post("/api/admin/test-sms",authenticateUser,requireRole(["super_admin"]),async (req, res) => {
    try {
      if (!twilioClient) {
        return res.status(500).json({ error: "SMS service not configured" });
      }

      const { phone, message } = req.body;
      const testMessage =
        message || "Test message from Gudino Custom Cabinets! 👋";
      const testPhone = phone || process.env.ADMIN_PHONE || "+15095154089";

      console.log(" Testing SMS to:", testPhone);

      const smsOptions = {
        body: testMessage,
        to: testPhone,
      };

      // Use messaging service if available, otherwise fallback to phone number
      if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
        smsOptions.messagingServiceSid =
          process.env.TWILIO_MESSAGING_SERVICE_SID;
        console.log(
          " Using messaging service SID:",
          process.env.TWILIO_MESSAGING_SERVICE_SID
        );
      } else if (process.env.TWILIO_PHONE_NUMBER) {
        smsOptions.from = process.env.TWILIO_PHONE_NUMBER;
        console.log(" Using phone number:", process.env.TWILIO_PHONE_NUMBER);
      } else {
        throw new Error(
          "Neither messaging service SID nor phone number configured"
        );
      }

      const result = await twilioClient.messages.create(smsOptions);
      console.log(" Test SMS sent successfully! SID:", result.sid);

      res.json({
        success: true,
        message: "Test SMS sent successfully",
        sid: result.sid,
        sentTo: testPhone,
      });
    } catch (error) {
      console.error(" Test SMS failed:", error);
      res
        .status(500)
        .json({ error: `Failed to send test SMS: ${error.message}` });
    }
  }
);
// Client Management Endpoints
router.get("/api/admin/clients", authenticateUser, async (req, res) => {
  try {
    const clients = await invoiceDb.getAllClients();
    res.json(clients);
  } catch (error) {
    console.error("Error getting clients:", error);
    res.status(500).json({ error: "Failed to get clients" });
  }
});

router.get("/api/admin/clients/search", authenticateUser, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.length < 2) {
      return res.json([]);
    }
    const clients = await invoiceDb.searchClients(q);
    res.json(clients);
  } catch (error) {
    console.error("Error searching clients:", error);
    res.status(500).json({ error: "Failed to search clients" });
  }
});

router.post("/api/admin/clients", authenticateUser, async (req, res) => {
  try {
    const result = await invoiceDb.createClient(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error creating client:", error);
    res.status(500).json({ error: "Failed to create client" });
  }
});

router.get("/api/admin/clients/:id", authenticateUser, async (req, res) => {
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

router.put("/api/admin/clients/:id", authenticateUser, async (req, res) => {
  try {
    await invoiceDb.updateClient(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating client:", error);
    res.status(500).json({ error: "Failed to update client" });
  }
});

router.delete("/api/admin/clients/:id", authenticateUser, async (req, res) => {
  try {
    const result = await invoiceDb.deleteClient(req.params.id);
    res.json({ success: true, changes: result.changes });
  } catch (error) {
    console.error("Error deleting client:", error);
    res.status(500).json({ error: "Failed to delete client" });
  }
});

// Line Item Labels Endpoints
router.get("/api/admin/line-item-labels", authenticateUser, async (req, res) => {
  try {
    const labels = await invoiceDb.getLineItemLabels();
    res.json(labels);
  } catch (error) {
    console.error("Error getting line item labels:", error);
    res.status(500).json({ error: "Failed to get line item labels" });
  }
});

router.post("/api/admin/line-item-labels", authenticateUser, async (req, res) => {
  try {
    const result = await invoiceDb.createLineItemLabel(req.body);
    res.json(result);
  } catch (error) {
    console.error("Error creating line item label:", error);
    res.status(500).json({ error: "Failed to create line item label" });
  }
});

router.put("/api/admin/line-item-labels/:id", authenticateUser, async (req, res) => {
  try {
    await invoiceDb.updateLineItemLabel(req.params.id, req.body);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating line item label:", error);
    res.status(500).json({ error: "Failed to update line item label" });
  }
});

router.delete("/api/admin/line-item-labels/:id", authenticateUser, async (req, res) => {
  try {
    await invoiceDb.deleteLineItemLabel(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting line item label:", error);
    res.status(500).json({ error: "Failed to delete line item label" });
  }
});

// Tax Rates Endpoints
router.get("/api/admin/tax-rates", authenticateUser, async (req, res) => {
  try {
    const rates = await invoiceDb.getTaxRates();
    res.json(rates);
  } catch (error) {
    console.error("Error getting tax rates:", error);
    res.status(500).json({ error: "Failed to get tax rates" });
  }
});

router.post("/api/admin/tax-rates", authenticateUser, async (req, res) => {
  try {
    const taxData = { ...req.body, created_by: req.user.id };
    const result = await invoiceDb.createTaxRate(taxData);
    res.json(result);
  } catch (error) {
    console.error("Error creating tax rate:", error);
    res.status(500).json({ error: "Failed to create tax rate" });
  }
});

router.put("/api/admin/tax-rates/:id", authenticateUser, async (req, res) => {
  try {
    const taxData = { ...req.body, updated_by: req.user.id };
    await invoiceDb.updateTaxRate(req.params.id, taxData);
    res.json({ success: true });
  } catch (error) {
    console.error("Error updating tax rate:", error);
    res.status(500).json({ error: "Failed to update tax rate" });
  }
});

router.delete("/api/admin/tax-rates/:id", authenticateUser, async (req, res) => {
  try {
    await invoiceDb.deleteTaxRate(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Error deleting tax rate:", error);
    res.status(500).json({ error: "Failed to delete tax rate" });
  }
});

// Design Notification Settings Endpoints
// Admin endpoint - Get design notification settings (super_admin only)
router.get("/api/admin/design-notification-settings",authenticateUser,async (req, res) => {
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
router.put("/api/admin/design-notification-settings",authenticateUser,async (req, res) => {
    try {
      if (req.user.role !== "super_admin") {
        return res.status(403).json({ error: "Super admin access required" });
      }
      const { notificationType } = req.body;
      if (!["email", "sms", "both"].includes(notificationType)) {
        return res.status(400).json({ error: "Invalid notification type" });
      }
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
// EXPORTS 
module.exports = router;

