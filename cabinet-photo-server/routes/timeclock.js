const express = require("express");
const router = express.Router();
const { authenticateUser, isSuperAdmin, isAdminOrSuperAdmin } = require("../middleware/auth");
const { getDb } = require("../db-helpers");
const moment = require("moment-timezone");

// Timezone constant
const TIMEZONE = "America/Los_Angeles"; // PST/PDT

// Helper to run database operations with automatic connection management
async function withDb(operation) {
  const db = await getDb();
  try {
    return await operation(db);
  } finally {
    await db.close();
  }
}

// Helper function to calculate hours between two times
function calculateHours(clockIn, clockOut, breakMinutes = 0) {
  const start = moment(clockIn);
  const end = moment(clockOut);
  const totalMinutes = end.diff(start, "minutes") - breakMinutes;
  return totalMinutes / 60;
}

// Helper function to calculate regular and overtime hours
function calculateRegularAndOvertime(totalHours) {
  const regularHours = Math.min(totalHours, 8);
  const overtimeHours = Math.max(totalHours - 8, 0);
  return { regularHours, overtimeHours };
}

// ==================== EMPLOYEE ENDPOINTS ====================

// POST /api/timeclock/clock-in - Employee clocks in
router.post("/clock-in", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { location, notes } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    await withDb(async (db) => {
      // Check if already clocked in
      const activeEntry = await db.get(
        `SELECT * FROM time_clock_entries 
         WHERE employee_id = ? AND status = 'active' AND is_deleted = 0`,
        [userId]
      );

      if (activeEntry) {
        return res.status(400).json({
          success: false,
          message: "Already clocked in",
          clockInTime: activeEntry.clock_in_time,
        });
      }

      // Get employee name
      const user = await db.get(`SELECT full_name FROM users WHERE id = ?`, [
        userId,
      ]);

      // Create new time entry with PST timezone
      const clockInTime = moment().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
      const result = await db.run(
        `INSERT INTO time_clock_entries (
          employee_id, employee_name, clock_in_time, status, 
          location, notes, ip_address, entry_method
        ) VALUES (?, ?, ?, 'active', ?, ?, ?, 'automatic')`,
        [userId, user.full_name, clockInTime, location, notes, ipAddress]
      );

      res.json({
        success: true,
        message: "Clocked in successfully",
        entryId: result.lastID,
        clockInTime,
      });
    });
  } catch (error) {
    console.error("Clock-in error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to clock in", error: error.message });
  }
});

// POST /api/timeclock/clock-out - Employee clocks out
router.post("/clock-out", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { notes } = req.body;

    await withDb(async (db) => {
      // Find active entry
      const activeEntry = await db.get(
        `SELECT * FROM time_clock_entries 
         WHERE employee_id = ? AND status = 'active' AND is_deleted = 0`,
        [userId]
      );

      if (!activeEntry) {
        return res.status(400).json({
          success: false,
          message: "Not currently clocked in",
        });
      }

      // Calculate hours with PST timezone
      const clockOutTime = moment().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
      const totalHours = calculateHours(
        activeEntry.clock_in_time,
        clockOutTime,
        activeEntry.break_minutes
      );
      const { regularHours, overtimeHours } = calculateRegularAndOvertime(totalHours);

      // Update entry
      await db.run(
        `UPDATE time_clock_entries 
         SET clock_out_time = ?, total_hours = ?, regular_hours = ?, 
             overtime_hours = ?, status = 'completed', notes = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [clockOutTime, totalHours, regularHours, overtimeHours, notes, activeEntry.id]
      );

      res.json({
        success: true,
        message: "Clocked out successfully",
        clockOutTime,
        totalHours: totalHours.toFixed(2),
        regularHours: regularHours.toFixed(2),
        overtimeHours: overtimeHours.toFixed(2),
      });
    });
  } catch (error) {
    console.error("Clock-out error:", error);
    res
      .status(500)
      .json({ success: false, message: "Failed to clock out", error: error.message });
  }
});

// POST /api/timeclock/start-break - Start a break
router.post("/start-break", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { breakType } = req.body;

    await withDb(async (db) => {
      // Find active entry
      const activeEntry = await db.get(
        `SELECT * FROM time_clock_entries 
         WHERE employee_id = ? AND status = 'active' AND is_deleted = 0`,
        [userId]
      );

      if (!activeEntry) {
        return res.status(400).json({
          success: false,
          message: "Not currently clocked in",
        });
      }

      // Check if already on break
      const activeBreak = await db.get(
        `SELECT * FROM time_clock_breaks 
         WHERE time_entry_id = ? AND break_end IS NULL`,
        [activeEntry.id]
      );

      if (activeBreak) {
        return res.status(400).json({
          success: false,
          message: "Already on break",
        });
      }

      // Create break entry with PST timezone
      const breakStart = moment().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
      const result = await db.run(
        `INSERT INTO time_clock_breaks (time_entry_id, break_start, break_type)
         VALUES (?, ?, ?)`,
        [activeEntry.id, breakStart, breakType || "regular"]
      );

      res.json({
        success: true,
        message: "Break started",
        breakId: result.lastID,
        breakStart,
      });
    });
  } catch (error) {
    console.error("Start break error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to start break",
      error: error.message,
    });
  }
});

// POST /api/timeclock/end-break - End a break
router.post("/end-break", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    await withDb(async (db) => {
      // Find active entry
      const activeEntry = await db.get(
        `SELECT * FROM time_clock_entries 
         WHERE employee_id = ? AND status = 'active' AND is_deleted = 0`,
        [userId]
      );

      if (!activeEntry) {
        return res.status(400).json({
          success: false,
          message: "Not currently clocked in",
        });
      }

      // Find active break
      const activeBreak = await db.get(
        `SELECT * FROM time_clock_breaks 
         WHERE time_entry_id = ? AND break_end IS NULL`,
        [activeEntry.id]
      );

      if (!activeBreak) {
        return res.status(400).json({
          success: false,
          message: "Not currently on break",
        });
      }

      // End break and calculate duration with PST timezone
      const breakEnd = moment().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
      const durationMinutes = moment(breakEnd).diff(
        moment(activeBreak.break_start),
        "minutes"
      );

      await db.run(
        `UPDATE time_clock_breaks 
         SET break_end = ?, duration_minutes = ?
         WHERE id = ?`,
        [breakEnd, durationMinutes, activeBreak.id]
      );

      // Update total break minutes on time entry
      const totalBreakMinutes = await db.get(
        `SELECT SUM(duration_minutes) as total FROM time_clock_breaks 
         WHERE time_entry_id = ? AND break_end IS NOT NULL`,
        [activeEntry.id]
      );

      await db.run(
        `UPDATE time_clock_entries 
         SET break_minutes = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [totalBreakMinutes.total || 0, activeEntry.id]
      );

      res.json({
        success: true,
        message: "Break ended",
        breakEnd,
        durationMinutes,
        totalBreakMinutes: totalBreakMinutes.total || 0,
      });
    });
  } catch (error) {
    console.error("End break error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to end break",
      error: error.message,
    });
  }
});

// GET /api/timeclock/current-status - Get employee's current clock status
router.get("/current-status", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    await withDb(async (db) => {
      // Find active entry
      const activeEntry = await db.get(
        `SELECT * FROM time_clock_entries 
         WHERE employee_id = ? AND status = 'active' AND is_deleted = 0`,
        [userId]
      );

      if (!activeEntry) {
        return res.json({
          success: true,
          isClockedIn: false,
          isOnBreak: false,
        });
      }

      // Check if on break
      const activeBreak = await db.get(
        `SELECT * FROM time_clock_breaks 
         WHERE time_entry_id = ? AND break_end IS NULL`,
        [activeEntry.id]
      );

      // Calculate current hours worked
      const currentTime = moment();
      const hoursWorked = calculateHours(
        activeEntry.clock_in_time,
        currentTime.format("YYYY-MM-DD HH:mm:ss"),
        activeEntry.break_minutes
      );

      res.json({
        success: true,
        isClockedIn: true,
        isOnBreak: !!activeBreak,
        clockInTime: activeEntry.clock_in_time,
        currentHours: hoursWorked.toFixed(2),
        breakMinutes: activeEntry.break_minutes,
        location: activeEntry.location,
        notes: activeEntry.notes,
        breakStartTime: activeBreak ? activeBreak.break_start : null,
      });
    });
  } catch (error) {
    console.error("Get status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get status",
      error: error.message,
    });
  }
});

// GET /api/timeclock/my-entries - Get employee's time entries
router.get("/my-entries", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate, limit = 50 } = req.query;

    await withDb(async (db) => {
      let query = `
        SELECT * FROM time_clock_entries 
        WHERE employee_id = ? AND is_deleted = 0
      `;
      const params = [userId];

      if (startDate) {
        query += ` AND date(clock_in_time) >= date(?)`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND date(clock_in_time) <= date(?)`;
        params.push(endDate);
      }

      query += ` ORDER BY clock_in_time DESC LIMIT ?`;
      params.push(parseInt(limit));

      const entries = await db.all(query, params);

      // Get breaks for each entry
      for (let entry of entries) {
        entry.breaks = await db.all(
          `SELECT * FROM time_clock_breaks WHERE time_entry_id = ?`,
          [entry.id]
        );
      }

      res.json({
        success: true,
        entries,
      });
    });
  } catch (error) {
    console.error("Get entries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get entries",
      error: error.message,
    });
  }
});

// GET /api/timeclock/current-period - Get current pay period summary
router.get("/current-period", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const today = moment().format("YYYY-MM-DD");

    await withDb(async (db) => {
      // Find current pay period
      const payPeriod = await db.get(
        `SELECT * FROM pay_periods 
         WHERE date(?) BETWEEN date(start_date) AND date(end_date)
         ORDER BY start_date DESC LIMIT 1`,
        [today]
      );

      if (!payPeriod) {
        return res.json({
          success: true,
          hasPayPeriod: false,
          message: "No active pay period",
        });
      }

      // Get entries for this pay period
      const entries = await db.all(
        `SELECT * FROM time_clock_entries 
         WHERE employee_id = ? AND is_deleted = 0
         AND date(clock_in_time) BETWEEN date(?) AND date(?)`,
        [userId, payPeriod.start_date, payPeriod.end_date]
      );

      // Calculate totals
      let totalHours = 0;
      let totalRegularHours = 0;
      let totalOvertimeHours = 0;

      entries.forEach((entry) => {
        if (entry.total_hours) {
          totalHours += entry.total_hours;
          totalRegularHours += entry.regular_hours || 0;
          totalOvertimeHours += entry.overtime_hours || 0;
        }
      });

      // Get payroll info for estimation
      const payrollInfo = await db.get(
        `SELECT * FROM employee_payroll_info WHERE employee_id = ? AND is_active = 1`,
        [userId]
      );

      let estimatedGrossPay = 0;
      if (payrollInfo) {
        if (payrollInfo.employment_type === "hourly") {
          estimatedGrossPay =
            totalRegularHours * (payrollInfo.hourly_rate || 0) +
            totalOvertimeHours * (payrollInfo.overtime_rate || 0);
        }
      }

      res.json({
        success: true,
        hasPayPeriod: true,
        payPeriod: {
          id: payPeriod.id,
          startDate: payPeriod.start_date,
          endDate: payPeriod.end_date,
          payDate: payPeriod.pay_date,
          periodType: payPeriod.period_type,
        },
        summary: {
          totalHours: totalHours.toFixed(2),
          regularHours: totalRegularHours.toFixed(2),
          overtimeHours: totalOvertimeHours.toFixed(2),
          daysWorked: entries.length,
          estimatedGrossPay: estimatedGrossPay.toFixed(2),
        },
      });
    });
  } catch (error) {
    console.error("Get current period error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get current period",
      error: error.message,
    });
  }
});

// POST /api/timeclock/save-tax-rate - Save employee's tax rate for estimation
router.post("/save-tax-rate", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;
    const { taxRate } = req.body;

    if (!taxRate || taxRate < 0 || taxRate > 100) {
      return res.status(400).json({
        success: false,
        message: "Invalid tax rate (must be 0-100)",
      });
    }

    await withDb(async (db) => {
      // Update or create payroll info
      const existing = await db.get(
        `SELECT * FROM employee_payroll_info WHERE employee_id = ?`,
        [userId]
      );

      if (existing) {
        await db.run(
          `UPDATE employee_payroll_info SET save_tax_rate = ? WHERE employee_id = ?`,
          [taxRate, userId]
        );
      } else {
        await db.run(
          `INSERT INTO employee_payroll_info (employee_id, save_tax_rate, is_active)
           VALUES (?, ?, 1)`,
          [userId, taxRate]
        );
      }

      res.json({
        success: true,
        message: "Tax rate saved",
        taxRate,
      });
    });
  } catch (error) {
    console.error("Save tax rate error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save tax rate",
      error: error.message,
    });
  }
});

// ==================== ADMIN ENDPOINTS ====================

// GET /api/admin/timeclock/live-status - Get all currently clocked in employees
router.get("/admin/live-status", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    await withDb(async (db) => {
      const activeEntries = await db.all(
        `SELECT tce.*, 
          (SELECT break_start FROM time_clock_breaks 
           WHERE time_entry_id = tce.id AND break_end IS NULL LIMIT 1) as current_break
         FROM time_clock_entries tce
         WHERE tce.status = 'active' AND tce.is_deleted = 0
         ORDER BY tce.clock_in_time DESC`
      );

      // Calculate current hours for each
      const currentTime = moment();
      activeEntries.forEach((entry) => {
        const hoursWorked = calculateHours(
          entry.clock_in_time,
          currentTime.format("YYYY-MM-DD HH:mm:ss"),
          entry.break_minutes
        );
        entry.currentHours = hoursWorked.toFixed(2);
        entry.isOnBreak = !!entry.current_break;
      });

      res.json({
        success: true,
        activeEmployees: activeEntries.length,
        entries: activeEntries,
      });
    });
  } catch (error) {
    console.error("Get live status error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get live status",
      error: error.message,
    });
  }
});

// GET /api/admin/timeclock/entries - Get all time entries (with filters)
router.get("/admin/entries", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { employeeId, startDate, endDate, status, limit = 100 } = req.query;

    await withDb(async (db) => {
      let query = `SELECT * FROM time_clock_entries WHERE is_deleted = 0`;
      const params = [];

      if (employeeId) {
        query += ` AND employee_id = ?`;
        params.push(employeeId);
      }

      if (startDate) {
        query += ` AND date(clock_in_time) >= date(?)`;
        params.push(startDate);
      }

      if (endDate) {
        query += ` AND date(clock_in_time) <= date(?)`;
        params.push(endDate);
      }

      if (status) {
        query += ` AND status = ?`;
        params.push(status);
      }

      query += ` ORDER BY clock_in_time DESC LIMIT ?`;
      params.push(parseInt(limit));

      const entries = await db.all(query, params);

      res.json({
        success: true,
        count: entries.length,
        entries,
      });
    });
  } catch (error) {
    console.error("Get entries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get entries",
      error: error.message,
    });
  }
});

// POST /api/admin/timeclock/add-manual-entry - Create manual time entry
router.post("/admin/add-manual-entry", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const {
      employeeId,
      employeeName,
      clockInTime,
      clockOutTime,
      breakMinutes,
      reason,
      notes,
      location,
    } = req.body;

    // Validate required fields
    if (!employeeId || !employeeName || !clockInTime || !clockOutTime || !reason) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    await withDb(async (db) => {
      // Calculate hours
      const totalHours = calculateHours(clockInTime, clockOutTime, breakMinutes || 0);
      const { regularHours, overtimeHours } = calculateRegularAndOvertime(totalHours);

      // Check for overnight shift
      const isOvernight = moment(clockOutTime).isBefore(moment(clockInTime));

      // Insert manual entry
      const result = await db.run(
        `INSERT INTO time_clock_entries (
          employee_id, employee_name, clock_in_time, clock_out_time,
          total_hours, regular_hours, overtime_hours, break_minutes,
          status, entry_method, manually_entered_by, manual_entry_reason,
          notes, location
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'completed', 'manual', ?, ?, ?, ?)`,
        [
          employeeId,
          employeeName,
          clockInTime,
          clockOutTime,
          totalHours,
          regularHours,
          overtimeHours,
          breakMinutes || 0,
          adminId,
          reason,
          notes,
          location,
        ]
      );

      res.json({
        success: true,
        message: "Manual entry created",
        entryId: result.lastID,
        totalHours: totalHours.toFixed(2),
        isOvernight,
      });
    });
  } catch (error) {
    console.error("Add manual entry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create manual entry",
      error: error.message,
    });
  }
});

// PUT /api/admin/timeclock/edit-entry/:id - Edit time entry
router.put("/admin/edit-entry/:id", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const entryId = req.params.id;
    const adminId = req.user.id;
    const { clockInTime, clockOutTime, breakMinutes, reason, notes } = req.body;

    await withDb(async (db) => {
      // Get original entry
      const original = await db.get(
        `SELECT * FROM time_clock_entries WHERE id = ? AND is_deleted = 0`,
        [entryId]
      );

      if (!original) {
        return res.status(404).json({
          success: false,
          message: "Entry not found",
        });
      }

      // Calculate new hours
      const totalHours = calculateHours(clockInTime, clockOutTime, breakMinutes || 0);
      const { regularHours, overtimeHours } = calculateRegularAndOvertime(totalHours);

      // Store original values if first edit
      const originalClockIn = original.original_clock_in || original.clock_in_time;
      const originalClockOut = original.original_clock_out || original.clock_out_time;

      // Update entry
      await db.run(
        `UPDATE time_clock_entries 
         SET clock_in_time = ?, clock_out_time = ?, total_hours = ?,
             regular_hours = ?, overtime_hours = ?, break_minutes = ?,
             original_clock_in = ?, original_clock_out = ?,
             modification_count = modification_count + 1,
             status = 'edited', entry_method = 'edited', notes = ?,
             edited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [
          clockInTime,
          clockOutTime,
          totalHours,
          regularHours,
          overtimeHours,
          breakMinutes || 0,
          originalClockIn,
          originalClockOut,
          notes,
          entryId,
        ]
      );

      // Get admin name
      const admin = await db.get(
        `SELECT full_name FROM users WHERE id = ?`,
        [adminId]
      );

      // Log modification
      await db.run(
        `INSERT INTO time_entry_modifications (
          time_entry_id, modified_by, modified_by_name, modification_type, reason,
          old_clock_in, old_clock_out, old_total_hours,
          new_clock_in, new_clock_out, new_total_hours
        ) VALUES (?, ?, ?, 'edit', ?, ?, ?, ?, ?, ?, ?)`,
        [
          entryId,
          adminId,
          admin?.full_name || 'Unknown',
          reason,
          original.clock_in_time,
          original.clock_out_time,
          original.total_hours,
          clockInTime,
          clockOutTime,
          totalHours,
        ]
      );

      res.json({
        success: true,
        message: "Entry updated",
        totalHours: totalHours.toFixed(2),
      });
    });
  } catch (error) {
    console.error("Edit entry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to edit entry",
      error: error.message,
    });
  }
});

// POST /api/admin/timeclock/approve-entry/:id - Approve edited entry
router.post("/admin/approve-entry/:id", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const entryId = req.params.id;

    await withDb(async (db) => {
      await db.run(
        `UPDATE time_clock_entries 
         SET status = 'approved', updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND is_deleted = 0`,
        [entryId]
      );

      res.json({
        success: true,
        message: "Entry approved",
      });
    });
  } catch (error) {
    console.error("Approve entry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to approve entry",
      error: error.message,
    });
  }
});

// DELETE /api/admin/timeclock/delete-entry/:id - Soft delete entry
router.delete("/admin/delete-entry/:id", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const entryId = req.params.id;
    const adminId = req.user.id;
    // Accept `reason` from the request body or as a query parameter. Some
    // clients (notably certain mobile/axios configurations) may not include a
    // body for DELETE requests, which would make `req.body` undefined and
    // cause a server error when destructuring. Use a safe fallback.
    const { reason: bodyReason } = req.body || {};
    const reason = bodyReason || req.query?.reason || 'Deleted by admin';

    await withDb(async (db) => {
      // Get admin name
      const admin = await db.get(
        `SELECT full_name FROM users WHERE id = ?`,
        [adminId]
      );

      await db.run(
        `UPDATE time_clock_entries 
         SET is_deleted = 1, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [entryId]
      );

      // Log deletion
      await db.run(
        `INSERT INTO time_entry_modifications (
          time_entry_id, modified_by, modified_by_name, modification_type, reason
        ) VALUES (?, ?, ?, 'delete', ?)`,
        [entryId, adminId, admin?.full_name || 'Unknown', reason]
      );

      res.json({
        success: true,
        message: "Entry deleted",
      });
    });
  } catch (error) {
    console.error("Delete entry error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete entry",
      error: error.message,
    });
  }
});

// GET /api/admin/timeclock/entries/month - Get calendar month data
router.get("/admin/entries/month", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const { employeeId, year, month } = req.query;

    if (!employeeId || !year || !month) {
      return res.status(400).json({
        success: false,
        message: "Missing required parameters",
      });
    }

    await withDb(async (db) => {
      const startDate = moment(`${year}-${month}-01`).startOf("month").format("YYYY-MM-DD");
      const endDate = moment(`${year}-${month}-01`).endOf("month").format("YYYY-MM-DD");

      const entries = await db.all(
        `SELECT date(clock_in_time) as date, 
                SUM(total_hours) as total_hours,
                COUNT(*) as shift_count,
                GROUP_CONCAT(id) as entry_ids
         FROM time_clock_entries 
         WHERE employee_id = ? AND is_deleted = 0
         AND date(clock_in_time) BETWEEN date(?) AND date(?)
         GROUP BY date(clock_in_time)
         ORDER BY date(clock_in_time)`,
        [employeeId, startDate, endDate]
      );

      res.json({
        success: true,
        month: `${year}-${month}`,
        entries,
      });
    });
  } catch (error) {
    console.error("Get month entries error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get month entries",
      error: error.message,
    });
  }
});

// GET /api/timeclock/admin/entry-audit/:id - Get audit log for an entry
router.get("/admin/entry-audit/:id", authenticateUser, async (req, res) => {
  try {
    const entryId = req.params.id;

    await withDb(async (db) => {
      const modifications = await db.all(
        `SELECT * FROM time_entry_modifications 
         WHERE time_entry_id = ? 
         ORDER BY created_at DESC`,
        [entryId]
      );

      res.json({
        success: true,
        modifications: modifications || [],
      });
    });
  } catch (error) {
    console.error("Get audit log error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get audit log",
      error: error.message,
    });
  }
});

// ==================== PAYROLL INFO ENDPOINTS ====================

// GET /api/timeclock/my-payroll-info - Get current user's payroll info (employee endpoint)
router.get("/my-payroll-info", authenticateUser, async (req, res) => {
  try {
    const userId = req.user.id;

    await withDb(async (db) => {
      const payrollInfo = await db.get(
        `SELECT * FROM employee_payroll_info WHERE employee_id = ? AND is_active = 1`,
        [userId]
      );

      res.json({
        success: true,
        payrollInfo: payrollInfo || null,
      });
    });
  } catch (error) {
    console.error("Get my payroll info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payroll info",
      error: error.message,
    });
  }
});

// GET /api/admin/timeclock/payroll-info/:employeeId - Get employee payroll info (admin endpoint)
router.get("/admin/payroll-info/:employeeId", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    await withDb(async (db) => {
      const payrollInfo = await db.get(
        `SELECT * FROM employee_payroll_info WHERE employee_id = ? AND is_active = 1`,
        [employeeId]
      );

      res.json({
        success: true,
        payrollInfo: payrollInfo || null,
      });
    });
  } catch (error) {
    console.error("Get payroll info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to get payroll info",
      error: error.message,
    });
  }
});

// POST /api/admin/timeclock/payroll-info - Create or update employee payroll info
router.post("/admin/payroll-info", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const {
      employeeId,
      employmentType,
      hourlyRate,
      overtimeRate,
      salary,
      payPeriodType,
    } = req.body;

    // Validate required fields
    if (!employeeId || !employmentType) {
      return res.status(400).json({
        success: false,
        message: "Employee ID and employment type are required",
      });
    }

    // Validate employment type
    if (!["hourly", "salary"].includes(employmentType)) {
      return res.status(400).json({
        success: false,
        message: "Employment type must be 'hourly' or 'salary'",
      });
    }

    // Validate hourly rates
    if (employmentType === "hourly") {
      if (!hourlyRate || hourlyRate <= 0) {
        return res.status(400).json({
          success: false,
          message: "Valid hourly rate is required for hourly employees",
        });
      }
    }

    await withDb(async (db) => {
      // Check if payroll info already exists
      const existing = await db.get(
        `SELECT * FROM employee_payroll_info WHERE employee_id = ?`,
        [employeeId]
      );

      if (existing) {
        // Update existing record
        await db.run(
          `UPDATE employee_payroll_info 
           SET employment_type = ?, hourly_rate = ?, overtime_rate = ?, 
               salary = ?, pay_period_type = ?, is_active = 1,
               updated_at = CURRENT_TIMESTAMP
           WHERE employee_id = ?`,
          [
            employmentType,
            hourlyRate || null,
            overtimeRate || null,
            salary || null,
            payPeriodType || "biweekly",
            employeeId,
          ]
        );
      } else {
        // Insert new record
        await db.run(
          `INSERT INTO employee_payroll_info (
            employee_id, employment_type, hourly_rate, overtime_rate,
            salary, pay_period_type, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, 1)`,
          [
            employeeId,
            employmentType,
            hourlyRate || null,
            overtimeRate || null,
            salary || null,
            payPeriodType || "biweekly",
          ]
        );
      }

      res.json({
        success: true,
        message: "Payroll info saved successfully",
      });
    });
  } catch (error) {
    console.error("Save payroll info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to save payroll info",
      error: error.message,
    });
  }
});

// DELETE /api/admin/timeclock/payroll-info/:employeeId - Deactivate payroll info
router.delete("/admin/payroll-info/:employeeId", authenticateUser, isAdminOrSuperAdmin, async (req, res) => {
  try {
    const employeeId = req.params.employeeId;

    await withDb(async (db) => {
      await db.run(
        `UPDATE employee_payroll_info 
         SET is_active = 0, updated_at = CURRENT_TIMESTAMP
         WHERE employee_id = ?`,
        [employeeId]
      );

      res.json({
        success: true,
        message: "Payroll info deactivated",
      });
    });
  } catch (error) {
    console.error("Delete payroll info error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to deactivate payroll info",
      error: error.message,
    });
  }
});

module.exports = router;


