// This file contains all analytics-related API endpoints
// REQUIRED IMPORTS
const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const { analyticsDb } = require("../db-helpers");
const { authenticateUser, requireRole } = require("../middleware/auth");
const { handleError } = require("../utils/error-handler");

// Rate limiter for analytics tracking (100 per 15 minutes per IP)
const analyticsLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many analytics requests. Please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
  validate: { trustProxy: false } // Trust proxy configured at app level
});
// Analytics endpoints
router.post("/pageview", analyticsLimiter, async (req, res) => {
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
    handleError(error, "Failed to record page view", res, 500);
  }
});
router.post("/time", analyticsLimiter, async (req, res) => {
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
    handleError(error, "Failed to update time spent", res, 500);
  }
});
// Analytics event tracking endpoint
router.post("/event", analyticsLimiter, async (req, res) => {
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
    console.log("Analytics Event:", eventRecord);
    res.json({ success: true, eventId: Date.now() });
  } catch (error) {
    handleError(error, "Failed to track event", res, 500);
  }
});
// Analytics dashboard endpoints (super admin only)
router.get("/stats",authenticateUser,requireRole("super_admin"),async (req, res) => {
    try {
      const dateRange = parseInt(req.query.days) || 30;
      const stats = await analyticsDb.getPageViewStats(dateRange);
      res.json(stats);
    } catch (error) {
      handleError(error, "Failed to fetch analytics stats", res, 500);
    }
  }
);
router.get("/realtime",authenticateUser,requireRole("super_admin"),async (req, res) => {
    try {
      const stats = await analyticsDb.getRealtimeStats();
      res.json(stats);
    } catch (error) {
      handleError(error, "Failed to fetch realtime stats", res, 500);
    }
  }
);
// EXPORTS 
module.exports = router;