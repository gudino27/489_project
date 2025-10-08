// This file contains all authentication-related API endpoints
// REQUIRED IMPORTS 
const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { userDb } = require("../db-helpers");
const { authenticateUser, JWT_SECRET } = require("../middleware/auth");
const { emailTransporter } = require("../utils/email");

router.get("/me", authenticateUser, (req, res) => {
  res.json({ user: req.user });
});
// Login route
router.post("/login", async (req, res) => {
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
router.post("/logout", authenticateUser, async (req, res) => {
  try {
    // In a real implementation, you'd invalidate the session token
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ error: "Logout failed" });
  }
});
// Password reset endpoints
router.post("/forgot-password", async (req, res) => {
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
router.post("/reset-password", async (req, res) => {
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
router.get("/validate-reset-token/:token", async (req, res) => {
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
// EXPORTS
module.exports = router;

