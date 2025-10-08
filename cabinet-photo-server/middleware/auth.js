
// AUTHENTICATION MIDDLEWARE
// This file contains the JWT authentication middleware
//
// Copy lines 107-157 from server.js (the authenticateUser function and JWT setup)
//
// REQUIRED IMPORTS (add these at the top):
require("dotenv").config();
const jwt = require("jsonwebtoken");
const { userDb } = require("../db-helpers");
const JWT_SECRET = process.env.JWT_SECRET;
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




// EXPORTS (add at the bottom):
module.exports = {
  authenticateUser,
  requireRole,
  JWT_SECRET // Export this so other files can use it
};

