import React, { useState, useEffect } from "react";
import { Clock, Play, Square, Coffee, Users } from "lucide-react";
import { useLanguage } from "../../contexts/LanguageContext";
import "./TimeClockManager.css";

// Timezone constant
const TIMEZONE = "America/Los_Angeles"; // PST/PDT
const parsePSTTimestamp = (pstTimestamp) => {
  if (!pstTimestamp) return null;
  const isoString = pstTimestamp.replace(" ", "T") + "Z";
  return new Date(isoString);
};
// Helper to convert UTC to PST and format
const formatTimePST = (dateTimeStr, formatStr = "h:mm A") => {
  if (!dateTimeStr) return "--:--";
  // If it's a PST timestamp from database (no timezone info), parse it as UTC then format as PST
  let date;
  if (
    typeof dateTimeStr === "string" &&
    dateTimeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  ) {
    const parts = dateTimeStr.split(/[- :]/);
    date = new Date(
      Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5])
    );
  } else {
    date = new Date(dateTimeStr);
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", // Display as-is since we already converted to UTC representing PST
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};
const formatDatePST = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  let date;
  if (
    typeof dateTimeStr === "string" &&
    dateTimeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  ) {
    // Database format: "2025-10-19 18:08:00" - this IS the PST time
    const parts = dateTimeStr.split(/[- :]/);
    date = new Date(
      Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5])
    );
  } else if (
    typeof dateTimeStr === "string" &&
    dateTimeStr.match(/^\d{4}-\d{2}-\d{2}$/)
  ) {
    // Date only format: "2025-10-19"
    const parts = dateTimeStr.split("-");
    date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
  } else {
    date = new Date(dateTimeStr);
  }
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", // Display as-is
    weekday: "short",
    month: "short",
    day: "numeric",
  }).format(date);
};
const formatDateTimePST = (dateTimeStr) => {
  if (!dateTimeStr) return "";
  // If it's a PST timestamp from database (no timezone info), parse it correctly
  let date;
  if (
    typeof dateTimeStr === "string" &&
    dateTimeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)
  ) {
    const parts = dateTimeStr.split(/[- :]/);
    date = new Date(
      Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5])
    );
  } else {
    date = new Date(dateTimeStr);
  }

  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC", // Display as-is
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  }).format(date);
};
// Helper to get current date in PST as YYYY-MM-DD string
const getTodayPST = () => {
  const now = new Date();
  const pstDate = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);

  // Convert from MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = pstDate.split("/");
  return `${year}-${month}-${day}`;
};
// Helper to calculate current pay period earnings
const calculateCurrentPayPeriodAmount = (payrollInfo, hours) => {
  if (!payrollInfo || hours === 0) return 0;

  if (payrollInfo.employment_type === "hourly") {
    const regularHours = Math.min(hours, 40);
    const overtimeHours = Math.max(hours - 40, 0);
    const regularPay = regularHours * (payrollInfo.hourly_rate || 0);
    const overtimePay = overtimeHours * (payrollInfo.overtime_rate || 0);
    return regularPay + overtimePay;
  } else {
    // For salary, calculate based on pay period type
    const annualSalary = payrollInfo.salary || 0;
    switch (payrollInfo.pay_period_type) {
      case "weekly":
        return annualSalary / 52;
      case "biweekly":
        return annualSalary / 26;
      case "semimonthly":
        return annualSalary / 24;
      case "monthly":
        return annualSalary / 12;
      default:
        return annualSalary / 26; // Default to biweekly
    }
  }
};
// Helper to convert a date to PST date string (YYYY-MM-DD)
const toPSTDateString = (date) => {
  const pstDate = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);

  // Convert from MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = pstDate.split("/");
  return `${year}-${month}-${day}`;
};
const extractPSTDate = (pstTimestamp) => {
  if (!pstTimestamp) return "";
  // Extract the date portion (YYYY-MM-DD) before the space or 'T'
  // Handle both "2025-10-19 18:08:00" and "2025-10-19T12:26:00" formats
  if (pstTimestamp.includes(" ")) {
    return pstTimestamp.split(" ")[0];
  } else if (pstTimestamp.includes("T")) {
    return pstTimestamp.split("T")[0];
  }
  return pstTimestamp;
};

const TimeClockManager = ({ token, API_BASE, user }) => {
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [status, setStatus] = useState({
    isClockedIn: false,
    isOnBreak: false,
    clockInTime: null,
    currentHours: "0.00",
    breakMinutes: 0,
  });
  const [currentPeriod, setCurrentPeriod] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeView, setActiveView] = useState("employee"); // 'employee' or 'admin'
  const [showHistory, setShowHistory] = useState(false);
  const [timeHistory, setTimeHistory] = useState([]);
  const [showTaxCalculator, setShowTaxCalculator] = useState(false);
  const [taxRate, setTaxRate] = useState("");
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthEntries, setMonthEntries] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showEnterTimeModal, setShowEnterTimeModal] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    date: getTodayPST(),
    timeIn: "",
    timeOut: "",
    breakMinutes: 0,
    notes: "",
  });
  const [thisWeekHours, setThisWeekHours] = useState(0);
  const [lastWeekHours, setLastWeekHours] = useState(0);
  const [payPeriodHours, setPayPeriodHours] = useState(0);
  const [editingEntry, setEditingEntry] = useState(null);
  const [editForm, setEditForm] = useState({
    clockInTime: "",
    clockOutTime: "",
    breakMinutes: 0,
    notes: "",
  });
  const [auditLog, setAuditLog] = useState([]);
  const [calendarView, setCalendarView] = useState("month"); // 'week' or 'month'

  // Payroll & Calculator states
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [payrollForm, setPayrollForm] = useState({
    employmentType: "hourly",
    hourlyRate: "",
    overtimeRate: "",
    salary: "",
    payPeriodType: "biweekly",
  });
  const [showCalculator, setShowCalculator] = useState(false);
  const [payrollInfo, setPayrollInfo] = useState(null);
  const [employeeTaxRate, setEmployeeTaxRate] = useState(0);
  const [savingTaxRate, setSavingTaxRate] = useState(false);

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    return () => clearInterval(timer);
  }, []);

  // Fetch status on mount and every 30 seconds
  useEffect(() => {
    if (token) {
      fetchStatus();
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Fetch current pay period and payroll info
  useEffect(() => {
    if (token) {
      fetchCurrentPeriod();
      fetchWeeklyHours();
      fetchPayrollInfo(); // Load employee's payroll info (includes tax rate)
    }
  }, [token]);

  const fetchWeeklyHours = async () => {
    try {
      // Get this week's hours (using PST dates)
      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
      const endOfWeek = new Date(today);
      endOfWeek.setDate(today.getDate() + (6 - today.getDay())); // Saturday

      const thisWeekResponse = await fetch(
        `${API_BASE}/api/timeclock/my-entries?startDate=${toPSTDateString(
          startOfWeek
        )}&endDate=${toPSTDateString(endOfWeek)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const thisWeekData = await thisWeekResponse.json();
      if (thisWeekData.success) {
        const totalHours = thisWeekData.entries.reduce(
          (sum, entry) => sum + (parseFloat(entry.total_hours) || 0),
          0
        );
        setThisWeekHours(totalHours);
      }

      // Get last week's hours (using PST dates)
      const lastWeekStart = new Date(startOfWeek);
      lastWeekStart.setDate(startOfWeek.getDate() - 7);
      const lastWeekEnd = new Date(endOfWeek);
      lastWeekEnd.setDate(endOfWeek.getDate() - 7);

      const lastWeekResponse = await fetch(
        `${API_BASE}/api/timeclock/my-entries?startDate=${toPSTDateString(
          lastWeekStart
        )}&endDate=${toPSTDateString(lastWeekEnd)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const lastWeekData = await lastWeekResponse.json();
      if (lastWeekData.success) {
        const totalHours = lastWeekData.entries.reduce(
          (sum, entry) => sum + (parseFloat(entry.total_hours) || 0),
          0
        );
        setLastWeekHours(totalHours);
      }
    } catch (error) {
      console.error("Error fetching weekly hours:", error);
    }
  };

  const fetchPayPeriodHours = async (payPeriodType) => {
    try {
      const today = new Date();
      let startDate, endDate;

      switch (payPeriodType) {
        case "weekly":
          // Sunday to Saturday
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          endDate = new Date(today);
          endDate.setDate(today.getDate() + (6 - today.getDay()));
          break;

        case "biweekly":
          // Assuming pay period starts on Sunday, find current 2-week period
          const daysSinceSunday = today.getDay();
          const weekNumber = Math.floor(
            (today.getDate() + daysSinceSunday) / 14
          );
          startDate = new Date(today);
          startDate.setDate(1 + weekNumber * 14 - daysSinceSunday);
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 13);
          break;

        case "semimonthly":
          // 1-15 and 16-end of month
          const dayOfMonth = today.getDate();
          if (dayOfMonth <= 15) {
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            endDate = new Date(today.getFullYear(), today.getMonth(), 15);
          } else {
            startDate = new Date(today.getFullYear(), today.getMonth(), 16);
            endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0); // Last day of month
          }
          break;

        case "monthly":
          // First to last day of month
          startDate = new Date(today.getFullYear(), today.getMonth(), 1);
          endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0);
          break;

        default:
          // Default to biweekly
          startDate = new Date(today);
          startDate.setDate(today.getDate() - today.getDay());
          endDate = new Date(startDate);
          endDate.setDate(startDate.getDate() + 13);
      }

      const response = await fetch(
        `${API_BASE}/api/timeclock/my-entries?startDate=${toPSTDateString(
          startDate
        )}&endDate=${toPSTDateString(endDate)}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        const totalHours = data.entries.reduce(
          (sum, entry) => sum + (parseFloat(entry.total_hours) || 0),
          0
        );
        setPayPeriodHours(totalHours);
      }
    } catch (error) {
      console.error("Error fetching pay period hours:", error);
    }
  };

  const fetchTimeHistory = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/timeclock/my-entries?limit=30`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setTimeHistory(data.entries);
      }
    } catch (error) {
      console.error("Error fetching time history:", error);
    }
  };

  const handleSaveTaxRate = async () => {
    if (!taxRate || isNaN(taxRate) || taxRate < 0 || taxRate > 100) {
      alert(t("timeclock.invalid_tax_rate_message"));
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/timeclock/save-tax-rate`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taxRate: parseFloat(taxRate),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.tax_rate_saved_success"));
        setShowTaxCalculator(false);
        await fetchCurrentPeriod();
      } else {
        alert(data.message || t("timeclock.failed_save_tax_rate"));
      }
    } catch (error) {
      console.error("Save tax rate error:", error);
      alert(t("timeclock.error_save_tax_rate"));
    }
  };

  const fetchMonthEntries = async (date = currentMonth) => {
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const startDate = `${year}-${month}-01`;
      const lastDay = new Date(year, date.getMonth() + 1, 0).getDate();
      const endDate = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;

      const response = await fetch(
        `${API_BASE}/api/timeclock/my-entries?startDate=${startDate}&endDate=${endDate}&limit=100`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (data.success) {
        // Group entries by date (extract date from PST timestamp)
        const entriesByDate = {};
        data.entries.forEach((entry) => {
          // Database stores PST timestamps like "2025-10-19 18:08:00"
          // Just extract the date portion
          const entryDate = extractPSTDate(entry.clock_in_time);

          if (!entriesByDate[entryDate]) {
            entriesByDate[entryDate] = [];
          }
          entriesByDate[entryDate].push(entry);
        });

        setMonthEntries(entriesByDate);
      }
    } catch (error) {
      console.error("Error fetching month entries:", error);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0-6, Sunday-Saturday
    const days = [];
    const todayPST = getTodayPST(); // Get current date in PST

    // Add empty slots for days before month starts
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    // Add all days in month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const entries = monthEntries[dateStr] || [];
      const totalHours = entries.reduce(
        (sum, e) => sum + (e.total_hours || 0),
        0
      );

      days.push({
        day,
        date: dateStr,
        isToday: dateStr === todayPST, // Compare with PST date
        entries,
        totalHours: totalHours.toFixed(6),
        hasEntries: entries.length > 0,
      });
    }

    return days;
  };

  const changeMonth = (direction) => {
    const newDate = new Date(currentMonth);
    if (calendarView === "week") {
      // For week view, change by 7 days
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      // For month view, change by 1 month
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentMonth(newDate);
    fetchMonthEntries(newDate);
  };

  const getWeekDays = (date) => {
    const days = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay()); // Go to Sunday

    const todayPST = getTodayPST(); // Get current date in PST

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dateStr = toPSTDateString(currentDate); // Convert to PST date string
      const entries = monthEntries[dateStr] || [];
      const totalHours = entries
        .reduce((sum, e) => sum + (parseFloat(e.total_hours) || 0), 0)
        .toFixed(6);

      days.push({
        day: currentDate.getDate(),
        date: dateStr,
        isToday: dateStr === todayPST, // Compare with PST date
        entries,
        totalHours,
        hasEntries: entries.length > 0,
        fullDate: currentDate,
      });
    }

    return days;
  };

  const goToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    fetchMonthEntries(today);
    setSelectedDate(getTodayPST()); // Use PST date
  };

  const closeManualEntryModal = () => {
    setShowEnterTimeModal(false);
    // Reset form when closing
    setManualEntry({
      date: getTodayPST(),
      timeIn: "",
      timeOut: "",
      breakMinutes: 0,
      notes: "",
    });
  };

  const openManualEntryForDate = (dateString) => {
    // Pre-fill the manual entry form with the selected date
    setManualEntry({
      date: dateString,
      timeIn: "",
      timeOut: "",
      breakMinutes: 0,
      notes: "",
    });
    setShowEnterTimeModal(true);
  };

  const handleManualEntrySubmit = async (e) => {
    e.preventDefault();

    if (!manualEntry.timeIn || !manualEntry.timeOut) {
      alert(t("timeclock.manual_entry_require_times"));
      return;
    }

    try {
      setActionLoading(true);

      // Format times as PST timestamps (YYYY-MM-DD HH:MM:SS format)
      // The input times are already in PST, so we just format them correctly
      const clockInTime = `${manualEntry.date} ${manualEntry.timeIn}:00`;
      const clockOutTime = `${manualEntry.date} ${manualEntry.timeOut}:00`;

      const response = await fetch(
        `${API_BASE}/api/timeclock/admin/add-manual-entry`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            employeeId: user.id,
            employeeName: user.full_name,
            clockInTime,
            clockOutTime,
            breakMinutes: parseInt(manualEntry.breakMinutes) || 0,
            reason: "Employee forgot to clock in/out",
            notes: "[Manual Entry] Employee added missed clock in/out",
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.time_entry_added_success"));
        setShowEnterTimeModal(false);
        setManualEntry({
          date: getTodayPST(), // Reset to current PST date
          timeIn: "",
          timeOut: "",
          breakMinutes: 0,
          notes: "",
        });
        // Refresh all data
        await fetchWeeklyHours();
        await fetchPayPeriodHours(payrollInfo?.pay_period_type || "biweekly");
        await fetchCurrentPeriod();
        await fetchMonthEntries(); // Always refresh calendar entries
      } else {
        alert(data.message || t("timeclock.failed_add_time_entry"));
      }
    } catch (error) {
      console.error("Error adding manual entry:", error);
      alert(t("timeclock.error_adding_time_entry"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);

    // Convert PST timestamps to local datetime-local format
    // The datetime-local input expects local time in format: "YYYY-MM-DDTHH:mm"
    const clockInDate = new Date(entry.clock_in_time + "Z"); // Add Z to treat as UTC, then convert
    const clockOutDate = entry.clock_out_time
      ? new Date(entry.clock_out_time + "Z")
      : null;

    setEditForm({
      clockInTime: clockInDate.toISOString().slice(0, 16),
      clockOutTime: clockOutDate ? clockOutDate.toISOString().slice(0, 16) : "",
      breakMinutes: entry.break_minutes || 0,
      notes: entry.notes || "",
    });

    // Fetch audit log
    fetchAuditLog(entry.id);
  };

  const fetchAuditLog = async (entryId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/timeclock/admin/entry-audit/${entryId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setAuditLog(data.modifications || []);
      }
    } catch (error) {
      console.error("Error fetching audit log:", error);
    }
  };

  const handleSaveEdit = async () => {
    if (!editForm.clockInTime) {
      alert(t("timeclock.clock_in_required"));
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_BASE}/api/timeclock/admin/edit-entry/${editingEntry.id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            clockInTime: editForm.clockInTime,
            clockOutTime: editForm.clockOutTime || null,
            breakMinutes: parseInt(editForm.breakMinutes) || 0,
            notes: editForm.notes || "",
            reason: "Employee/Admin correction",
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.time_entry_updated_success"));
        setEditingEntry(null);
        await fetchWeeklyHours();
        await fetchCurrentPeriod();
        if (showCalendar) {
          await fetchMonthEntries();
        }
      } else {
        alert(data.message || t("timeclock.failed_update_entry"));
      }
    } catch (error) {
      console.error("Error updating entry:", error);
      alert(t("timeclock.error_updating_entry"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteEntry = async () => {
    if (
      !window.confirm(
        t("timeclock.confirm_delete_entry")
      )
    ) {
      return;
    }

    try {
      setActionLoading(true);
      const response = await fetch(
        `${API_BASE}/api/timeclock/admin/delete-entry/${editingEntry.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            reason: "Deleted by employee/admin",
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.time_entry_deleted_success"));
        setEditingEntry(null);
        await fetchWeeklyHours();
        await fetchCurrentPeriod();
        if (showCalendar) {
          await fetchMonthEntries();
        }
      } else {
        alert(data.message || t("timeclock.failed_delete_entry"));
      }
    } catch (error) {
      console.error("Error deleting entry:", error);
      alert(t("timeclock.error_deleting_entry"));
    } finally {
      setActionLoading(false);
    }
  };

  const fetchStatus = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/timeclock/current-status`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setStatus(data);
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPeriod = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/timeclock/current-period`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success && data.hasPayPeriod) {
        setCurrentPeriod(data);
      }
    } catch (error) {
      console.error("Error fetching period:", error);
    }
  };

  const fetchPayrollInfo = async (employeeId = null) => {
    try {
      let response;
      if (employeeId) {
        // Admin fetching specific employee's info
        response = await fetch(
          `${API_BASE}/api/timeclock/admin/payroll-info/${employeeId}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      } else {
        // Employee fetching their own info
        response = await fetch(`${API_BASE}/api/timeclock/my-payroll-info`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
      }

      const data = await response.json();

      if (data.success && data.payrollInfo) {
        if (employeeId) {
          // Admin viewing employee's info for modal
          setPayrollForm({
            employmentType: data.payrollInfo.employment_type || "hourly",
            hourlyRate: data.payrollInfo.hourly_rate || "",
            overtimeRate: data.payrollInfo.overtime_rate || "",
            salary: data.payrollInfo.salary || "",
            payPeriodType: data.payrollInfo.pay_period_type || "biweekly",
          });
        } else {
          // Employee viewing their own info
          setPayrollInfo(data.payrollInfo);
          setEmployeeTaxRate(data.payrollInfo.save_tax_rate || 0);
          // Fetch pay period hours based on their pay period type
          if (data.payrollInfo.pay_period_type) {
            fetchPayPeriodHours(data.payrollInfo.pay_period_type);
          }
        }
      } else {
        // Clear payroll info if none exists
        if (!employeeId) {
          setPayrollInfo(null);
          setEmployeeTaxRate(0);
        }
      }
    } catch (error) {
      console.error("Error fetching payroll info:", error);
      // Clear on error
      if (!employeeId) {
        setPayrollInfo(null);
        setEmployeeTaxRate(0);
      }
    }
  };

  const savePayrollInfo = async (employeeId) => {
    try {
      const response = await fetch(
        `${API_BASE}/api/timeclock/admin/payroll-info`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            employeeId: employeeId,
            employmentType: payrollForm.employmentType,
            hourlyRate:
              payrollForm.employmentType === "hourly"
                ? parseFloat(payrollForm.hourlyRate)
                : null,
            overtimeRate: payrollForm.overtimeRate
              ? parseFloat(payrollForm.overtimeRate)
              : null,
            salary:
              payrollForm.employmentType === "salary"
                ? parseFloat(payrollForm.salary)
                : null,
            payPeriodType: payrollForm.payPeriodType,
          }),
        }
      );

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.payroll_info_saved"));
        setShowPayrollModal(false);
        setSelectedEmployee(null);
      } else {
        alert(data.message ? `${t('common.error')}: ${data.message}` : t("timeclock.failed_save_payroll_info"));
      }
    } catch (error) {
      console.error("Error saving payroll info:", error);
      alert(t("timeclock.failed_save_payroll_info"));
    }
  };

  const saveTaxRate = async () => {
    setSavingTaxRate(true);
    try {
      const response = await fetch(`${API_BASE}/api/timeclock/save-tax-rate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taxRate: parseFloat(employeeTaxRate),
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.tax_rate_saved_success"));
        await fetchPayrollInfo(); // Refresh to get updated info
      } else {
        alert(data.message ? `${t('common.error')}: ${data.message}` : t("timeclock.failed_save_tax_rate"));
      }
    } catch (error) {
      console.error("Error saving tax rate:", error);
      alert(t("timeclock.failed_save_tax_rate"));
    } finally {
      setSavingTaxRate(false);
    }
  };

  const handleClockIn = async () => {
    if (!window.confirm(t("timeclock.confirm_clock_in"))) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/timeclock/clock-in`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          location: "Web App",
        }),
      });

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.clocked_in_success"));
        await fetchStatus();
        await fetchCurrentPeriod();
      } else {
        alert(data.message || t("timeclock.failed_clock_in"));
      }
    } catch (error) {
      console.error("Clock-in error:", error);
      alert(t("timeclock.error_clocking_in"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    if (!window.confirm(t("timeclock.confirm_clock_out"))) return;

    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/timeclock/clock-out`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.clocked_out_success_with_hours", { hours: data.totalHours }));
        await fetchStatus();
        await fetchCurrentPeriod();
      } else {
        alert(data.message || t("timeclock.failed_clock_out"));
      }
    } catch (error) {
      console.error("Clock-out error:", error);
      alert(t("timeclock.error_clocking_out"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/timeclock/start-break`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.break_started"));
        await fetchStatus();
      } else {
        alert(data.message || t("timeclock.failed_start_break"));
      }
    } catch (error) {
      console.error("Start break error:", error);
      alert(t("timeclock.error_starting_break"));
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    setActionLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/timeclock/end-break`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();
      if (data.success) {
        alert(t("timeclock.break_ended_with_duration", { minutes: data.durationMinutes }));
        await fetchStatus();
      } else {
        alert(data.message || t("timeclock.failed_end_break"));
      }
    } catch (error) {
      console.error("End break error:", error);
      alert(t("timeclock.error_ending_break"));
    } finally {
      setActionLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return formatTimePST(dateString);
  };

  const formatDate = (dateString) => {
    return formatDatePST(dateString);
  };

  const calculateElapsedTime = () => {
    if (!status.isClockedIn || !status.clockInTime) return "0h 0m";

    // Calculate elapsed time using PST
    const clockIn = new Date(status.clockInTime);
    const now = new Date();
    const diffMs = now - clockIn;
    const diffMins = Math.floor(diffMs / 60000) - status.breakMinutes;
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;

    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="timeclock-manager">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t("timeclock.loading_time_clock")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="timeclock-manager">
      <div className="timeclock-header">
        <h2>
          <Clock size={24} />
          {t("timeclock.title")}
        </h2>
        <div className="header-actions">
          {!showCalendar && activeView === "employee" && (
            <button
              className="btn-calendar"
              onClick={() => {
                setShowCalendar(true);
                fetchMonthEntries();
              }}
            >
              📅 {t("timeclock.calendar")}
            </button>
          )}
          {showCalendar && (
            <button
              className="btn-calendar"
              onClick={() => setShowCalendar(false)}
            >
              {t("timeclock.back_to_dashboard")}
            </button>
          )}
          {(user?.role === "super_admin" || user?.role === "admin") && (
            <div className="view-toggle">
              <button
                className={activeView === "employee" ? "active" : ""}
                onClick={() => {
                  setActiveView("employee");
                  setShowCalendar(false);
                }}
              >
                {t("timeclock.employee_view")}
              </button>
              <button
                className={activeView === "admin" ? "active" : ""}
                onClick={() => {
                  setActiveView("admin");
                  setShowCalendar(false);
                }}
              >
                <Users size={16} />
                {t("timeclock.admin_view")}
              </button>
            </div>
          )}
        </div>
      </div>

      {activeView === "employee" ? (
        showCalendar ? (
          <CalendarView
            currentMonth={currentMonth}
            onChangeMonth={changeMonth}
            days={
              calendarView === "month"
                ? getDaysInMonth(currentMonth)
                : getWeekDays(currentMonth)
            }
            onSelectDate={setSelectedDate}
            selectedDate={selectedDate}
            onEditEntry={handleEditEntry}
            calendarView={calendarView}
            onViewChange={setCalendarView}
            onGoToToday={goToToday}
            openManualEntryForDate={openManualEntryForDate}
            t={t}
          />
        ) : (
          <>
            {/* Workday-style Main Interface */}
            <div className="workday-interface">
              <div className="workday-section">
                <h3 className="section-title">{t("timeclock.enter_time")}</h3>

                {/* Week Summary Buttons */}
                <div className="week-buttons">
                  <button
                    className="week-btn"
                    onClick={() => {
                      setShowCalendar(true);
                      fetchMonthEntries();
                    }}
                  >
                    <span className="week-label">
                      {t("timeclock.this_week")} ({thisWeekHours.toFixed(6)}{" "}
                      Hours)
                    </span>
                  </button>

                  <button
                    className="week-btn"
                    onClick={() => {
                      setShowCalendar(true);
                      const lastWeek = new Date();
                      lastWeek.setDate(lastWeek.getDate() - 7);
                      setCurrentMonth(lastWeek);
                      fetchMonthEntries(lastWeek);
                    }}
                  >
                    <span className="week-label">
                      {t("timeclock.last_week")} ({lastWeekHours.toFixed(6)}{" "}
                      Hours)
                    </span>
                  </button>

                  <button
                    className="week-btn"
                    onClick={() => {
                      setShowCalendar(true);
                      fetchMonthEntries();
                    }}
                  >
                    <span className="week-label">
                      {t("timeclock.select_week")}
                    </span>
                  </button>
                </div>
              </div>

              {/* Time Clock Section */}
              <div className="workday-section">
                <h3 className="section-title">{t("timeclock.time_clock")}</h3>

                <div className="clock-actions">
                  {!status.isClockedIn ? (
                    <button
                      className="clock-btn clock-in-btn"
                      onClick={handleClockIn}
                      disabled={actionLoading}
                    >
                      <Play size={20} />
                      {t("timeclock.check_in")}
                    </button>
                  ) : (
                    <>
                      <button
                        className="clock-btn clock-out-btn"
                        onClick={handleClockOut}
                        disabled={actionLoading}
                      >
                        <Square size={20} />
                        {t("timeclock.check_out")}
                      </button>

                      {!status.isOnBreak ? (
                        <button
                          className="clock-btn break-btn"
                          onClick={handleStartBreak}
                          disabled={actionLoading}
                        >
                          <Coffee size={20} />
                          {t("timeclock.start_break")}
                        </button>
                      ) : (
                        <button
                          className="clock-btn break-btn end-break"
                          onClick={handleEndBreak}
                          disabled={actionLoading}
                        >
                          <Coffee size={20} />
                          {t("timeclock.end_break")}
                        </button>
                      )}
                    </>
                  )}
                </div>

                {/* Manual Entry Button for Missed Clock-Ins */}
                <div style={{ marginTop: "1rem", textAlign: "center" }}>
                  <button
                    className="btn-text-link"
                    onClick={() => setShowEnterTimeModal(true)}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6b7280",
                      fontSize: "0.875rem",
                      textDecoration: "underline",
                      cursor: "pointer",
                      padding: "0.5rem",
                    }}
                  >
                    📝 {t("timeclock.forgot_to_clock_in")}
                  </button>
                </div>

                {/* Current Status Display */}
                {status.isClockedIn && (
                  <div className="current-status-box">
                    <div className="status-row">
                      <span className="label">
                        {t("timeclock.current_status")}:
                      </span>
                      <span
                        className={`value ${
                          status.isOnBreak ? "on-break" : "active"
                        }`}
                      >
                        {status.isOnBreak
                          ? t("timeclock.on_break")
                          : t("timeclock.clocked_in")}
                      </span>
                    </div>
                    <div className="status-row">
                      <span className="label">
                        {t("timeclock.clock_in_time")}:
                      </span>
                      <span className="value">
                        {formatTime(status.clockInTime)}
                      </span>
                    </div>
                    <div className="status-row">
                      <span className="label">
                        {t("timeclock.elapsed_time")}:
                      </span>
                      <span className="value">{calculateElapsedTime()}</span>
                    </div>
                    {status.breakMinutes > 0 && (
                      <div className="status-row">
                        <span className="label">
                          {t("timeclock.break_time")}:
                        </span>
                        <span className="value">
                          {status.breakMinutes} {t("timeclock.minutes")}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Employee's Payroll Info */}
              {payrollInfo && (
                <div className="workday-section payroll-info-display">
                  <h3 className="section-title">
                    💰 {t("timeclock.pay_info")}
                  </h3>

                  {/* Current Pay Period Earnings */}
                  <div className="payroll-info-grid">
                    <div className="info-card highlight">
                      <div className="info-label">
                        {t("timeclock.current_pay_period_earnings")}
                      </div>
                      <div className="info-value">
                        $
                        {calculateCurrentPayPeriodAmount(
                          payrollInfo,
                          payPeriodHours
                        ).toFixed(2)}
                      </div>
                      <div
                        style={{
                          fontSize: "0.75rem",
                          color: "#6b7280",
                          marginTop: "0.25rem",
                        }}
                      >
                        {t("timeclock.based")} {payPeriodHours.toFixed(6)}{" "}
                        {t("timeclock.total_hours_worked")}
                      </div>
                    </div>

                    {/* Tax Rate Input */}
                    <div className="info-card">
                      <div className="info-label">
                        {t("timeclock.my_tax_rate")}
                      </div>
                      {employeeTaxRate > 0 ? (
                        <div className="info-value">{employeeTaxRate}%</div>
                      ) : (
                        <div
                          className="info-value"
                          style={{ color: "#9ca3af" }}
                        >
                          {t("timeclock.rate_not_set")}
                        </div>
                      )}
                      <button
                        className="btn-calculator"
                        onClick={() => setShowCalculator(true)}
                        style={{ marginTop: "0.5rem", fontSize: "0.875rem" }}
                      >
                        {employeeTaxRate > 0
                          ? t("timeclock.update_tax_rate")
                          : t("timeclock.set_tax_rate")}
                      </button>
                    </div>

                    {/* Net Pay (After Taxes) */}
                    {employeeTaxRate > 0 && (
                      <div
                        className="info-card"
                        style={{
                          background:
                            "linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%)",
                          borderColor: "#10b981",
                        }}
                      >
                        <div className="info-label">
                          {t("timeclock.estimated_take_home_pay")}
                        </div>
                        <div
                          className="info-value"
                          style={{ color: "#065f46", fontSize: "1.5rem" }}
                        >
                          $
                          {(
                            calculateCurrentPayPeriodAmount(
                              payrollInfo,
                              payPeriodHours
                            ) *
                            (1 - employeeTaxRate / 100)
                          ).toFixed(2)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </>
        )
      ) : (
        /* Admin Live View */
        <AdminLiveView
          token={token}
          API_BASE={API_BASE}
          user={user}
          onSetPayroll={(employee) => {
            setSelectedEmployee(employee);
            fetchPayrollInfo(employee.id);
            setShowPayrollModal(true);
          }}
          t={t}
        />
      )}

      {/* Payroll Settings Modal */}
      {showPayrollModal && selectedEmployee && (
        <div
          className="modal-overlay"
          onClick={() => {
            setShowPayrollModal(false);
            setSelectedEmployee(null);
          }}
        >
          <div
            className="modal-content payroll-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Payroll Settings - {selectedEmployee.full_name}</h3>
              <button
                className="btn-close"
                onClick={() => {
                  setShowPayrollModal(false);
                  setSelectedEmployee(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div className="form-group">
                <label>Employment Type</label>
                <select
                  value={payrollForm.employmentType}
                  onChange={(e) =>
                    setPayrollForm({
                      ...payrollForm,
                      employmentType: e.target.value,
                    })
                  }
                >
                  <option value="hourly">Hourly</option>
                  <option value="salary">Salary</option>
                </select>
              </div>

              {payrollForm.employmentType === "hourly" ? (
                <>
                  <div className="form-group">
                    <label>Hourly Rate *</label>
                    <div className="input-with-prefix">
                      <span className="prefix">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={payrollForm.hourlyRate}
                        onChange={(e) =>
                          setPayrollForm({
                            ...payrollForm,
                            hourlyRate: e.target.value,
                          })
                        }
                        placeholder="25.50"
                        required
                      />
                    </div>
                  </div>
                  <div className="form-group">
                    <label>Overtime Rate (optional)</label>
                    <div className="input-with-prefix">
                      <span className="prefix">$</span>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={payrollForm.overtimeRate}
                        onChange={(e) =>
                          setPayrollForm({
                            ...payrollForm,
                            overtimeRate: e.target.value,
                          })
                        }
                        placeholder={`${(
                          parseFloat(payrollForm.hourlyRate) * 1.5
                        ).toFixed(2)} (1.5x)`}
                      />
                    </div>
                    <small>Leave blank for 1.5x hourly rate</small>
                  </div>
                </>
              ) : (
                <div className="form-group">
                  <label>Annual Salary *</label>
                  <div className="input-with-prefix">
                    <span className="prefix">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={payrollForm.salary}
                      onChange={(e) =>
                        setPayrollForm({
                          ...payrollForm,
                          salary: e.target.value,
                        })
                      }
                      placeholder="50000.00"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label>Pay Period Type</label>
                <select
                  value={payrollForm.payPeriodType}
                  onChange={(e) =>
                    setPayrollForm({
                      ...payrollForm,
                      payPeriodType: e.target.value,
                    })
                  }
                >
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-Weekly (Every 2 weeks)</option>
                  <option value="semimonthly">
                    Semi-Monthly (Twice a month)
                  </option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => {
                  setShowPayrollModal(false);
                  setSelectedEmployee(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-save"
                onClick={() => savePayrollInfo(selectedEmployee.id)}
              >
                Save Payroll Info
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Entry Modal */}
      {editingEntry && (
        <div className="modal-overlay" onClick={() => setEditingEntry(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit Time Entry</h3>
              <button
                className="btn-close"
                onClick={() => setEditingEntry(null)}
              >
                ×
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveEdit();
              }}
            >
              <div className="form-group">
                <label>Clock In Time *</label>
                <input
                  type="datetime-local"
                  value={editForm.clockInTime}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clockInTime: e.target.value })
                  }
                  required
                />
              </div>

              <div className="form-group">
                <label>Clock Out Time</label>
                <input
                  type="datetime-local"
                  value={editForm.clockOutTime}
                  onChange={(e) =>
                    setEditForm({ ...editForm, clockOutTime: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Break Minutes</label>
                <input
                  type="number"
                  min="0"
                  value={editForm.breakMinutes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, breakMinutes: e.target.value })
                  }
                />
              </div>

              <div className="form-group">
                <label>Notes</label>
                <textarea
                  value={editForm.notes}
                  onChange={(e) =>
                    setEditForm({ ...editForm, notes: e.target.value })
                  }
                  placeholder="Add any notes about this entry..."
                />
              </div>

              {/* Audit Log */}
              {auditLog.length > 0 && (
                <div className="audit-log">
                  <h4>Change History</h4>
                  {auditLog.map((log, idx) => (
                    <div key={idx} className="audit-entry">
                      <div className="audit-user">
                        {log.modified_by_name || "System"}
                      </div>
                      <div className="audit-action">
                        {log.reason ||
                          log.modification_type ||
                          "Entry modified"}
                      </div>
                      <div className="audit-time">
                        {formatDateTimePST(log.created_at)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-modal btn-cancel"
                  onClick={() => setEditingEntry(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-modal btn-delete"
                  onClick={handleDeleteEntry}
                  disabled={actionLoading}
                >
                  Delete
                </button>
                <button
                  type="submit"
                  className="btn-modal btn-save"
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manual Entry Modal for Employees */}
      {showEnterTimeModal && (
        <div className="modal-overlay" onClick={closeManualEntryModal}>
          <div
            className="modal-content manual-entry-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>📝 {t('timeclock.add_manual_entry_title')}</h3>
              <button className="btn-close" onClick={closeManualEntryModal}>
                ×
              </button>
            </div>

            <div className="modal-body">
              <div
                className="warning-box"
                style={{
                  background: "#e0f2fe",
                  border: "1px solid #0ea5e9",
                  borderRadius: "0.5rem",
                  padding: "1rem",
                  marginBottom: "1.5rem",
                }}
              >
                <p
                  style={{ margin: 0, color: "#075985", fontSize: "0.875rem" }}
                >
                  {t('timeclock.manual_entry_note')}
                </p>
              </div>

              <form onSubmit={handleManualEntrySubmit}>
                <div className="form-group">
                  <label>{t('timeclock.label_date')} *</label>
                  <input
                    type="date"
                    value={manualEntry.date}
                    onChange={(e) =>
                      setManualEntry({ ...manualEntry, date: e.target.value })
                    }
                    max={getTodayPST()}
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label>{t('timeclock.label_clock_in_time')} *</label>
                    <input
                      type="time"
                      value={manualEntry.timeIn}
                      onChange={(e) =>
                        setManualEntry({
                          ...manualEntry,
                          timeIn: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>{t('timeclock.label_clock_out_time')} *</label>
                    <input
                      type="time"
                      value={manualEntry.timeOut}
                      onChange={(e) =>
                        setManualEntry({
                          ...manualEntry,
                          timeOut: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>{t('timeclock.label_break_minutes')}</label>
                  <input
                    type="number"
                    min="0"
                    value={manualEntry.breakMinutes}
                    onChange={(e) =>
                      setManualEntry({
                        ...manualEntry,
                        breakMinutes: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="modal-actions">
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={closeManualEntryModal}
                  >
                    {t('common.cancel')}
                  </button>
                  <button type="submit" className="btn-primary">
                    {t('timeclock.add_time_entry_button')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Paycheck Calculator Modal */}
      {showCalculator && payrollInfo && (
        <div className="modal-overlay" onClick={() => setShowCalculator(false)}>
          <div
            className="modal-content calculator-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{t("timeclock.paycheck_calculator_title")}</h3>
              <button
                className="btn-close"
                onClick={() => setShowCalculator(false)}
              >
                ×
              </button>
            </div>

            <div className="calculator-body">
              {/* Gross Pay Section */}
              <div className="calc-section">
                <h4>{t("timeclock.gross_pay_before_taxes")}</h4>
                {payrollInfo.employment_type === "hourly" ? (
                  <div className="gross-breakdown">
                    <div className="breakdown-item">
                      <span>
                        {t("timeclock.regular_hours")}:{" "}
                        {Math.min(payPeriodHours, 40).toFixed(6)}{" "}
                        {t("timeclock.hrs")}
                      </span>
                      <span>
                        @ ${payrollInfo.hourly_rate?.toFixed(2)}
                        {t("timeclock.per_hour")}
                      </span>
                      <span className="amount">
                        $
                        {(
                          Math.min(payPeriodHours, 40) *
                          (payrollInfo.hourly_rate || 0)
                        ).toFixed(2)}
                      </span>
                    </div>
                    {payPeriodHours > 40 && (
                      <div className="breakdown-item">
                        <span>
                          {t("timeclock.overtime_hours")}:{" "}
                          {(payPeriodHours - 40).toFixed(6)}{" "}
                          {t("timeclock.hrs")}
                        </span>
                        <span>
                          @ ${payrollInfo.overtime_rate?.toFixed(2)}
                          {t("timeclock.per_hour")}
                        </span>
                        <span className="amount">
                          $
                          {(
                            (payPeriodHours - 40) *
                            (payrollInfo.overtime_rate || 0)
                          ).toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="total-line">
                      <strong>{t("timeclock.gross_total")}</strong>
                      <strong>
                        $
                        {calculateCurrentPayPeriodAmount(
                          payrollInfo,
                          payPeriodHours
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                ) : (
                  <div className="gross-breakdown">
                    <div className="breakdown-item">
                      <span>{t("timeclock.salary_pay_period_amount")}</span>
                      <span className="amount">
                        $
                        {calculateCurrentPayPeriodAmount(
                          payrollInfo,
                          payPeriodHours
                        ).toFixed(2)}
                      </span>
                    </div>
                    <div className="total-line">
                      <strong>{t("timeclock.gross_total")}</strong>
                      <strong>
                        $
                        {calculateCurrentPayPeriodAmount(
                          payrollInfo,
                          payPeriodHours
                        ).toFixed(2)}
                      </strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Tax Rate Input Section */}
              <div className="calc-section tax-section">
                <h4>{t("timeclock.your_tax_rate")}</h4>
                <p className="tax-description">
                  {t("timeclock.tax_rate_description")}
                </p>
                <div className="tax-input-group">
                  <label>{t("timeclock.total_tax_rate_label")}</label>
                  <div className="input-with-suffix">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      value={employeeTaxRate}
                      onChange={(e) =>
                        setEmployeeTaxRate(parseFloat(e.target.value) || 0)
                      }
                      placeholder="25"
                    />
                    <span className="suffix">%</span>
                  </div>
                  <button
                    className="btn-save-tax"
                    onClick={saveTaxRate}
                    disabled={savingTaxRate}
                  >
                    {savingTaxRate
                      ? t("timeclock.saving")
                      : t("timeclock.save_my_rate")}
                  </button>
                </div>
                <div className="tax-examples">
                  <p>
                    <strong>{t("timeclock.common_examples")}</strong>
                  </p>
                  <ul>
                    <li>{t("timeclock.tax_example_low")}</li>
                    <li>{t("timeclock.tax_example_mid")}</li>
                    <li>{t("timeclock.tax_example_high")}</li>
                  </ul>
                </div>
              </div>

              {/* Deductions Breakdown */}
              <div className="calc-section">
                <h4>{t("timeclock.estimated_deductions")}</h4>
                <div className="deductions-breakdown">
                  <div className="deduction-item">
                    <span>
                      {t("timeclock.taxes_label", { rate: employeeTaxRate })}
                    </span>
                    <span className="deduction-amount">
                      -$
                      {(
                        calculateCurrentPayPeriodAmount(
                          payrollInfo,
                          payPeriodHours
                        ) *
                        (employeeTaxRate / 100)
                      ).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Net Pay Section */}
              <div className="calc-section net-pay-section">
                <div className="net-pay-line">
                  <h3>{t("timeclock.estimated_take_home_pay")}</h3>
                  <h3 className="net-amount">
                    $
                    {(
                      calculateCurrentPayPeriodAmount(
                        payrollInfo,
                        payPeriodHours
                      ) *
                      (1 - employeeTaxRate / 100)
                    ).toFixed(2)}
                  </h3>
                </div>
                <p className="disclaimer">
                  {t("timeclock.estimate_disclaimer")}
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                className="btn-close-modal"
                onClick={() => setShowCalculator(false)}
              >
                {t("common.close")}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Calendar View Component
const CalendarView = ({
  currentMonth,
  onChangeMonth,
  days,
  onSelectDate,
  selectedDate,
  onEditEntry,
  calendarView,
  onViewChange,
  onGoToToday,
  openManualEntryForDate,
  t,
}) => {
  const monthNames = [
    t("timeclock.month_january"),
    t("timeclock.month_february"),
    t("timeclock.month_march"),
    t("timeclock.month_april"),
    t("timeclock.month_may"),
    t("timeclock.month_june"),
    t("timeclock.month_july"),
    t("timeclock.month_august"),
    t("timeclock.month_september"),
    t("timeclock.month_october"),
    t("timeclock.month_november"),
    t("timeclock.month_december"),
  ];

  const dayNames = [
    t("timeclock.day_sun"),
    t("timeclock.day_mon"),
    t("timeclock.day_tue"),
    t("timeclock.day_wed"),
    t("timeclock.day_thu"),
    t("timeclock.day_fri"),
    t("timeclock.day_sat"),
  ];

  const monthSummary = days
    .filter((d) => d && d.hasEntries)
    .reduce(
      (acc, day) => ({
        totalHours: acc.totalHours + parseFloat(day.totalHours || 0),
        daysWorked: acc.daysWorked + 1,
      }),
      { totalHours: 0, daysWorked: 0 }
    );

  return (
    <div className="calendar-view">
      {/* Month Navigation */}
      <div className="calendar-header">
        <button className="btn-nav" onClick={() => onChangeMonth(-1)}>
          ←{" "}
          {calendarView === "month"
            ? t("timeclock.previous")
            : t("timeclock.prev_week")}
        </button>
        <h3>
          {calendarView === "month"
            ? `${
                monthNames[currentMonth.getMonth()]
              } ${currentMonth.getFullYear()}`
            : `Week of ${
                monthNames[currentMonth.getMonth()]
              } ${currentMonth.getDate()}, ${currentMonth.getFullYear()}`}
        </h3>
        <button className="btn-nav" onClick={() => onChangeMonth(1)}>
          {calendarView === "month"
            ? t("timeclock.next")
            : t("timeclock.next_week")}{" "}
          →
        </button>
      </div>

      {/* View Controls */}
      <div className="calendar-controls">
        <div className="view-toggle-group">
          <button
            className={`btn-view-toggle ${
              calendarView === "week" ? "active" : ""
            }`}
            onClick={() => onViewChange("week")}
          >
            {t("timeclock.week_view")}
          </button>
          <button
            className={`btn-view-toggle ${
              calendarView === "month" ? "active" : ""
            }`}
            onClick={() => onViewChange("month")}
          >
            {t("timeclock.month_view")}
          </button>
        </div>
        <button className="btn-today" onClick={onGoToToday}>
          {t("timeclock.today_button")}
        </button>
      </div>

      {/* Month Summary */}
      <div className="calendar-summary">
        <div className="summary-item">
          <span className="summary-label">
            {calendarView === "month"
              ? t("timeclock.days_worked")
              : t("timeclock.this_week")}
            :
          </span>
          <span className="summary-value">{monthSummary.daysWorked}</span>
        </div>
        <div className="summary-item">
          <span className="summary-label">{t("timeclock.total_hours")}:</span>
          <span className="summary-value">
            {monthSummary.totalHours.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="calendar-grid">
        {/* Day names header */}
        {dayNames.map((day) => (
          <div key={day} className="calendar-day-name">
            {day}
          </div>
        ))}

        {/* Calendar days */}
        {days.map((day, index) => (
          <div
            key={index}
            className={`calendar-day ${!day ? "empty" : ""} ${
              day?.isToday ? "today" : ""
            } ${day?.hasEntries ? "has-entries" : ""} ${
              selectedDate === day?.date ? "selected" : ""
            }`}
            onClick={() => day && onSelectDate(day.date)}
          >
            {day && (
              <>
                <div className="day-number">{day.day}</div>
                {day.hasEntries && (
                  <div className="day-hours">
                    {day.totalHours}h
                    <div className="entries-indicator">
                      {day.entries.length}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ))}
      </div>

      {/* Selected Date Details */}
      {selectedDate && (
        <div className="date-details">
          <h4>{formatDatePST(selectedDate)}</h4>
          {(() => {
            const dayData = days.find((d) => d && d.date === selectedDate);

            if (!dayData || !dayData.hasEntries) {
              return (
                <>
                  <p className="no-entries">{t("timeclock.no_time_entries")}</p>
                  <button
                    className="btn-secondary"
                    onClick={() => openManualEntryForDate(selectedDate)}
                    style={{
                      marginTop: "1rem",
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                    }}
                  >
                    📝 {t("timeclock.add_time_entry_for_day")}
                  </button>
                </>
              );
            }
            return (
              <>
                <div className="entries-list">
                  {dayData.entries.map((entry, idx) => (
                    <div
                      key={idx}
                      className="entry-item"
                      onClick={() => onEditEntry(entry)}
                      title="Click to edit or delete this entry"
                    >
                      <div className="entry-time">
                        {formatTimePST(entry.clock_in_time)}
                        {" - "}
                        {entry.clock_out_time
                          ? formatTimePST(entry.clock_out_time)
                          : "In Progress"}
                      </div>
                      <div className="entry-hours-badge">
                        {entry.total_hours
                          ? `${entry.total_hours.toFixed(2)} hrs`
                          : "-"}
                      </div>
                      {entry.break_minutes > 0 && (
                        <div className="entry-break">
                          Break: {entry.break_minutes} min
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <button
                  className="btn-secondary"
                  onClick={() => openManualEntryForDate(selectedDate)}
                  style={{
                    marginTop: "1rem",
                    width: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  ➕ {t("timeclock.add_another_entry_for_day")}
                </button>
              </>
            );
          })()}
        </div>
      )}
    </div>
  );
};

// Admin Live View Component
const AdminLiveView = ({ token, API_BASE, user, onSetPayroll, t }) => {
  const [liveEmployees, setLiveEmployees] = useState([]);
  const [allEmployees, setAllEmployees] = useState([]);
  const [employeePayrollInfo, setEmployeePayrollInfo] = useState({}); // Store payroll info by employee ID
  const [loading, setLoading] = useState(true);
  const [showPayrollSection, setShowPayrollSection] = useState(false);
  const [manualEntries, setManualEntries] = useState([]);
  const [showManualEntriesLog, setShowManualEntriesLog] = useState(true);
  const [showHoursReport, setShowHoursReport] = useState(false);
  const [hoursReportData, setHoursReportData] = useState([]);
  const [reportStartDate, setReportStartDate] = useState("");
  const [reportEndDate, setReportEndDate] = useState("");
  const [showEmployeeAudit, setShowEmployeeAudit] = useState(false);
  const [selectedEmployeeForAudit, setSelectedEmployeeForAudit] =
    useState(null);
  const [auditEntries, setAuditEntries] = useState([]);

  // Initialize default date range (last 2 weeks)
  useEffect(() => {
    const today = new Date();
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(today.getDate() - 14);

    setReportEndDate(today.toISOString().split("T")[0]);
    setReportStartDate(twoWeeksAgo.toISOString().split("T")[0]);
  }, []);

  useEffect(() => {
    if (token) {
      fetchLiveStatus();
      fetchAllEmployees();
      fetchManualEntries();
      const interval = setInterval(() => {
        fetchLiveStatus();
        fetchManualEntries();
      }, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  // Fetch payroll info for all employees when payroll section is shown
  useEffect(() => {
    if (showPayrollSection && allEmployees.length > 0) {
      fetchAllPayrollInfo();
    }
  }, [showPayrollSection, allEmployees]);

  const fetchManualEntries = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/timeclock/admin/entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        // Filter entries with [Manual Entry] in notes (last 24 hours)
        const oneDayAgo = new Date();
        oneDayAgo.setDate(oneDayAgo.getDate() - 1);
        const manual = data.entries
          .filter(
            (entry) =>
              entry.notes &&
              entry.notes.includes("[Manual Entry]") &&
              new Date(entry.clock_in_time) >= oneDayAgo
          )
          .sort(
            (a, b) => new Date(b.clock_in_time) - new Date(a.clock_in_time)
          );

        // Get seen entry IDs from localStorage
        const seenEntriesStr = localStorage.getItem("seenManualEntries");
        const seenEntries = seenEntriesStr ? JSON.parse(seenEntriesStr) : [];

        // Filter out entries that have been seen
        const unseenEntries = manual.filter(
          (entry) => !seenEntries.includes(entry.id)
        );

        setManualEntries(unseenEntries);

        // If there are unseen entries, show the banner
        if (unseenEntries.length > 0) {
          setShowManualEntriesLog(true);
        }
      }
    } catch (error) {
      console.error("Error fetching manual entries:", error);
    }
  };

  const dismissManualEntriesLog = () => {
    // Mark all current entries as seen
    const seenEntriesStr = localStorage.getItem("seenManualEntries");
    const seenEntries = seenEntriesStr ? JSON.parse(seenEntriesStr) : [];

    // Add current manual entry IDs to seen list
    const currentEntryIds = manualEntries.map((entry) => entry.id);
    const updatedSeenEntries = [
      ...new Set([...seenEntries, ...currentEntryIds]),
    ];

    // Keep only last 100 seen entries to prevent localStorage bloat
    const recentSeenEntries = updatedSeenEntries.slice(-100);
    localStorage.setItem(
      "seenManualEntries",
      JSON.stringify(recentSeenEntries)
    );

    // Hide the banner
    setShowManualEntriesLog(false);
  };

  const fetchHoursReport = async () => {
    if (!reportStartDate || !reportEndDate) {
      alert("Please select both start and end dates");
      return;
    }

    if (new Date(reportEndDate) < new Date(reportStartDate)) {
      alert("End date must be after start date");
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/timeclock/admin/entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        // Filter entries by date range
        const startDate = new Date(reportStartDate);
        startDate.setHours(0, 0, 0, 0);
        const endDate = new Date(reportEndDate);
        endDate.setHours(23, 59, 59, 999);

        const filteredEntries = data.entries.filter((entry) => {
          const clockInDate = new Date(entry.clock_in_time);
          return clockInDate >= startDate && clockInDate <= endDate;
        });

        // Aggregate by employee
        const employeeMap = {};
        filteredEntries.forEach((entry) => {
          const employeeId = entry.employee_id;
          if (!employeeMap[employeeId]) {
            employeeMap[employeeId] = {
              employeeId,
              employeeName: entry.employee_name,
              totalHours: 0,
              regularHours: 0,
              overtimeHours: 0,
              estimatedPay: 0,
            };
          }

          const hours = parseFloat(entry.total_hours) || 0;
          employeeMap[employeeId].totalHours += hours;
        });

        // Calculate regular/OT split and pay for each employee
        const reportData = await Promise.all(
          Object.values(employeeMap).map(async (empData) => {
            // Fetch payroll info for this employee
            const payrollResponse = await fetch(
              `${API_BASE}/api/timeclock/admin/payroll-info/${empData.employeeId}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            const payrollData = await payrollResponse.json();

            if (payrollData.success && payrollData.payrollInfo) {
              const payroll = payrollData.payrollInfo;

              // Calculate regular and overtime hours
              empData.regularHours = Math.min(empData.totalHours, 40);
              empData.overtimeHours = Math.max(empData.totalHours - 40, 0);

              // Calculate estimated pay
              if (payroll.employment_type === "hourly") {
                const regularPay =
                  empData.regularHours * (payroll.hourly_rate || 0);
                const overtimePay =
                  empData.overtimeHours * (payroll.overtime_rate || 0);
                empData.estimatedPay = regularPay + overtimePay;
              } else {
                // For salary, estimate based on pay period
                const annualSalary = payroll.salary || 0;
                const weeksInRange =
                  (new Date(reportEndDate) - new Date(reportStartDate)) /
                  (7 * 24 * 60 * 60 * 1000);
                empData.estimatedPay = (annualSalary / 52) * weeksInRange;
              }
            }

            return empData;
          })
        );

        setHoursReportData(
          reportData.sort((a, b) =>
            a.employeeName.localeCompare(b.employeeName)
          )
        );
      }
    } catch (error) {
      console.error("Error fetching hours report:", error);
      alert("Failed to generate hours report. Please try again.");
    }
  };

  const fetchEmployeeAudit = async (employee) => {
    setSelectedEmployeeForAudit(employee);
    setShowEmployeeAudit(true);

    try {
      const response = await fetch(`${API_BASE}/api/timeclock/admin/entries`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();

      if (data.success) {
        // Filter entries for this specific employee, sorted by most recent
        const employeeEntries = data.entries
          .filter((entry) => entry.employee_id === employee.id)
          .sort(
            (a, b) => new Date(b.clock_in_time) - new Date(a.clock_in_time)
          );

        setAuditEntries(employeeEntries);
      }
    } catch (error) {
      console.error("Error fetching employee audit:", error);
      alert("Failed to fetch employee time entries");
    }
  };

  const exportToCSV = () => {
    if (hoursReportData.length === 0) {
      alert("No data to export");
      return;
    }

    // Create CSV content
    const headers = [
      "Employee Name",
      "Total Hours",
      "Regular Hours",
      "Overtime Hours",
      "Estimated Pay",
    ];
    const rows = hoursReportData.map((row) => [
      row.employeeName,
      row.totalHours.toFixed(2),
      row.regularHours.toFixed(2),
      row.overtimeHours.toFixed(2),
      row.estimatedPay.toFixed(2),
    ]);

    // Add totals row
    const totals = [
      "TOTAL",
      hoursReportData.reduce((sum, row) => sum + row.totalHours, 0).toFixed(2),
      hoursReportData
        .reduce((sum, row) => sum + row.regularHours, 0)
        .toFixed(2),
      hoursReportData
        .reduce((sum, row) => sum + row.overtimeHours, 0)
        .toFixed(2),
      hoursReportData
        .reduce((sum, row) => sum + row.estimatedPay, 0)
        .toFixed(2),
    ];

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.join(",")),
      totals.join(","),
    ].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `hours_report_${reportStartDate}_to_${reportEndDate}.csv`;
    link.style.display = "none";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const fetchAllEmployees = async () => {
    try {
      const response = await fetch(`${API_BASE}/api/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        // Include ALL users (employees, admins, super admins)
        setAllEmployees(data.users);
      } else {
        console.error("Failed to fetch employees:", data.message);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  const fetchAllPayrollInfo = async () => {
    try {
      // Fetch payroll info for each employee
      const payrollPromises = allEmployees.map(async (employee) => {
        try {
          const response = await fetch(
            `${API_BASE}/api/timeclock/admin/payroll-info/${employee.id}`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
          const data = await response.json();
          return { employeeId: employee.id, payrollInfo: data.payrollInfo };
        } catch (error) {
          console.error(
            `Error fetching payroll for employee ${employee.id}:`,
            error
          );
          return { employeeId: employee.id, payrollInfo: null };
        }
      });

      const results = await Promise.all(payrollPromises);
      const payrollMap = {};
      results.forEach(({ employeeId, payrollInfo }) => {
        payrollMap[employeeId] = payrollInfo;
      });
      setEmployeePayrollInfo(payrollMap);
    } catch (error) {
      console.error("Error fetching all payroll info:", error);
    }
  };

  const fetchLiveStatus = async () => {
    try {
      const response = await fetch(
        `${API_BASE}/api/timeclock/admin/live-status`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      const data = await response.json();
      if (data.success) {
        setLiveEmployees(data.entries);
      }
    } catch (error) {
      console.error("Error fetching live status:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    return formatTimePST(dateString);
  };

  if (loading) {
    return (
      <div className="timeclock-manager">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>{t("timeclock.loading_time_clock")}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-live-view">
      {/* Manual Entries Log */}
      {manualEntries.length > 0 && showManualEntriesLog && (
        <div
          className="warning-banner"
          style={{
            background: "linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)",
            border: "2px solid #3b82f6",
            borderRadius: "0.75rem",
            padding: "1rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem",
            position: "relative",
          }}
        >
          <button
            onClick={dismissManualEntriesLog}
            style={{
              position: "absolute",
              top: "0.75rem",
              right: "0.75rem",
              background: "rgba(255, 255, 255, 0.8)",
              border: "1px solid #3b82f6",
              borderRadius: "50%",
              width: "28px",
              height: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: "1.25rem",
              color: "#1e40af",
              fontWeight: "bold",
              transition: "all 0.2s",
              lineHeight: "1",
              padding: "0",
              paddingBottom: "5px",
            }}
            onMouseOver={(e) => {
              e.target.style.background = "#3b82f6";
              e.target.style.color = "white";
            }}
            onMouseOut={(e) => {
              e.target.style.background = "rgba(255, 255, 255, 0.8)";
              e.target.style.color = "#1e40af";
            }}
            title="Dismiss notification"
          >
            ×
          </button>
          <div style={{ fontSize: "2rem" }}>📝</div>
          <div style={{ flex: 1, paddingRight: "2rem" }}>
            <div
              style={{
                fontWeight: 700,
                color: "#1e40af",
                marginBottom: "0.5rem",
              }}
            >
              {manualEntries.length} Manual Time{" "}
              {manualEntries.length === 1 ? "Entry" : "Entries"} (Last 24 Hours)
            </div>
            <div
              style={{
                fontSize: "0.875rem",
                color: "#1e3a8a",
                marginBottom: "0.75rem",
              }}
            >
              Employees have added these missed clock-in/out entries:
            </div>
            <div
              style={{
                background: "rgba(255, 255, 255, 0.7)",
                borderRadius: "0.5rem",
                padding: "0.75rem",
                maxHeight: "200px",
                overflowY: "auto",
              }}
            >
              {manualEntries.map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: "0.5rem",
                    borderBottom: "1px solid rgba(59, 130, 246, 0.2)",
                    fontSize: "0.875rem",
                  }}
                >
                  <strong>{entry.employee_name}</strong> -{" "}
                  {formatTime(entry.clock_in_time)} to{" "}
                  {formatTime(entry.clock_out_time)}
                  <span style={{ color: "#6b7280", marginLeft: "0.5rem" }}>
                    ({entry.total_hours} hrs)
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hours Report Button */}
      <div className="admin-section" style={{ marginBottom: "1rem" }}>
        <button
          onClick={() => setShowHoursReport(true)}
          className="btn-primary"
          style={{
            width: "100%",
            padding: "1rem",
            fontSize: "1rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
          }}
        >
          📊 {t("timeclock.view_hours_report")} & Export
        </button>
      </div>

      {/* Live Clock-Ins Section */}
      <div className="admin-section">
        <div className="live-header">
          <h3>{t("timeclock.currently_clocked_in")}</h3>
          <div className="live-count">
            <Users size={20} />
            <span>
              {liveEmployees.length}{" "}
              {liveEmployees.length === 1 ? "Employee" : "Employees"}
            </span>
          </div>
        </div>

        {liveEmployees.length === 0 ? (
          <div className="empty-state">
            <Clock size={48} />
            <p>{t("timeclock.no_employees_clocked_in")}</p>
          </div>
        ) : (
          <div className="employee-list">
            {liveEmployees.map((entry) => (
              <div key={entry.id} className="employee-card">
                <div className="employee-info">
                  <div className="employee-name">{entry.employee_name}</div>
                  <div className="employee-details">
                    <span>
                      {t("timeclock.clocked_in_at")}:{" "}
                      {formatTime(entry.clock_in_time)}
                    </span>
                    {entry.isOnBreak && (
                      <span className="break-badge">
                        <Coffee size={14} />
                        {t("timeclock.on_break")}
                      </span>
                    )}
                  </div>
                </div>
                <div className="employee-hours">
                  <div className="hours-value">{entry.currentHours}</div>
                  <div className="hours-label">
                    {t("timeclock.hours_today")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payroll Management Section */}
      <div className="admin-section">
        <div className="section-toggle">
          <h3>{t("timeclock.employee_payroll_management")}</h3>
          <button
            className="btn-toggle"
            onClick={() => setShowPayrollSection(!showPayrollSection)}
          >
            {showPayrollSection ? (
              <>{t("timeclock.hide")}</>
            ) : (
              <>{t("timeclock.show")}</>
            )}
          </button>
        </div>

        {showPayrollSection && (
          <div className="payroll-management">
            <p className="section-description">
              Set hourly rates and employment details for employees
            </p>
            {allEmployees.length === 0 ? (
              <div className="empty-state">
                <p>Loading employees or no employees found...</p>
                <p style={{ fontSize: "0.875rem", color: "#6b7280" }}>
                  Check browser console for errors
                </p>
              </div>
            ) : (
              <div className="employee-payroll-list">
                {allEmployees
                  .filter((employee) => {
                    // Super admin can see all users
                    if (user?.role === "super_admin") return true;
                    // Admin can see employees and other admins (but not super_admin)
                    if (user?.role === "admin") {
                      return (
                        employee.role === "employee" ||
                        employee.role === "admin"
                      );
                    }
                    return false;
                  })
                  .map((employee) => {
                    const payrollInfo = employeePayrollInfo[employee.id];
                    return (
                      <div key={employee.id} className="payroll-employee-card">
                        <div className="employee-info">
                          <div className="employee-name">
                            {employee.full_name}
                          </div>
                          <div className="employee-role">{employee.role}</div>
                          {payrollInfo ? (
                            <div className="payroll-summary">
                              <div className="payroll-detail">
                                <span className="label">
                                  {t("timeclock.type")}:
                                </span>
                                <span className="value">
                                  {payrollInfo.employment_type === "hourly"
                                    ? ` ${t('timeclock.type_hourly')}`
                                    : ` ${t('timeclock.type_salary')}`}
                                </span>
                              </div>
                              {payrollInfo.employment_type === "hourly" ? (
                                <>
                                  <div className="payroll-detail">
                                    <span className="label">
                                      {t("timeclock.rate")}
                                    </span>
                                    <span className="value">
                                      ${payrollInfo.hourly_rate?.toFixed(2)} {t('timeclock.per_hour')}
                                    </span>
                                  </div>
                                  <div className="payroll-detail">
                                    <span className="label">
                                      {t("timeclock.ot_rate")}
                                    </span>
                                    <span className="value">
                                      ${payrollInfo.overtime_rate?.toFixed(2)} {t('timeclock.per_hour')}
                                    </span>
                                  </div>
                                </>
                              ) : (
                                <div className="payroll-detail">
                                  <span className="label">
                                    {t("timeclock.salary")}:
                                  </span>
                                  <span className="value">
                                    ${payrollInfo.salary?.toFixed(2)} {t('timeclock.per_year')}
                                  </span>
                                </div>
                              )}
                              <div className="payroll-detail">
                                <span className="label">
                                  {t("timeclock.period")}:
                                </span>
                                  <span className="value">
                                    {payrollInfo.pay_period_type === "weekly" && (
                                      <>📅 {t('timeclock.weekly')}</>
                                    )}
                                    {payrollInfo.pay_period_type === "biweekly" && (
                                      <>📅 {t('timeclock.biweekly')}</>
                                    )}
                                    {payrollInfo.pay_period_type === "semimonthly" && (
                                      <>📅 {t('timeclock.semimonthly')}</>
                                    )}
                                    {payrollInfo.pay_period_type === "monthly" && (
                                      <>📅 {t('timeclock.monthly')}</>
                                    )}
                                  </span>
                              </div>
                            </div>
                          ) : (
                            <div className="no-payroll-info">
                              <span className="warning-icon">⚠️</span>
                              <span>{t("timeclock.no_payroll_info_set")}</span>
                            </div>
                          )}
                        </div>
                        <button
                          className="btn-set-payroll"
                          onClick={() => onSetPayroll(employee)}
                        >
                          {payrollInfo ? t('timeclock.edit') : t('timeclock.set')}{' '}
                          {t('timeclock.payroll_info_button')}
                        </button>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Hours Report Modal */}
      {showHoursReport && (
        <div
          className="modal-overlay"
          onClick={() => setShowHoursReport(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: "900px", maxHeight: "90vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>{t("timeclock.hours_report_title")}</h3>
              <button
                className="btn-close"
                onClick={() => setShowHoursReport(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div style={{ marginBottom: "1.5rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr auto",
                    gap: "1rem",
                    alignItems: "end",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: 600,
                        marginBottom: "0.5rem",
                        color: "#374151",
                      }}
                    >
                      {t("timeclock.start_date")}
                    </label>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #d1d5db",
                        fontSize: "1rem",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontWeight: 600,
                        marginBottom: "0.5rem",
                        color: "#374151",
                      }}
                    >
                      {t("timeclock.end_date")}
                    </label>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.5rem",
                        borderRadius: "0.5rem",
                        border: "1px solid #d1d5db",
                        fontSize: "1rem",
                      }}
                    />
                  </div>
                  <button
                    onClick={fetchHoursReport}
                    className="btn-primary"
                    style={{ padding: "0.5rem 1.5rem" }}
                  >
                    {t("timeclock.generate_report")}
                  </button>
                </div>
              </div>

              {hoursReportData.length > 0 && (
                <>
                  <div
                    style={{
                      background: "#f9fafb",
                      borderRadius: "0.5rem",
                      padding: "1rem",
                      marginBottom: "1rem",
                      overflowX: "auto",
                    }}
                  >
                    <table
                      style={{ width: "100%", borderCollapse: "collapse" }}
                    >
                      <thead>
                        <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                          <th
                            style={{
                              textAlign: "left",
                              padding: "0.75rem",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {t("timeclock.employee")}
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "0.75rem",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {t("timeclock.total_hours")}
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "0.75rem",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {t("timeclock.regular_hours")}
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "0.75rem",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {t("timeclock.overtime_hours")}
                          </th>
                          <th
                            style={{
                              textAlign: "right",
                              padding: "0.75rem",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {t("timeclock.estimated_pay")}
                          </th>
                          <th
                            style={{
                              textAlign: "center",
                              padding: "0.75rem",
                              fontWeight: 600,
                              color: "#374151",
                            }}
                          >
                            {t("timeclock.actions")}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {hoursReportData.map((row, idx) => (
                          <tr
                            key={idx}
                            style={{ borderBottom: "1px solid #e5e7eb" }}
                          >
                            <td
                              style={{ padding: "0.75rem", color: "#111827" }}
                            >
                              {row.employeeName}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                color: "#111827",
                                fontWeight: 500,
                              }}
                            >
                              {row.totalHours.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                color: "#111827",
                              }}
                            >
                              {row.regularHours.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                color: "#111827",
                              }}
                            >
                              {row.overtimeHours.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "right",
                                color: "#059669",
                                fontWeight: 600,
                              }}
                            >
                              ${row.estimatedPay.toFixed(2)}
                            </td>
                            <td
                              style={{
                                padding: "0.75rem",
                                textAlign: "center",
                              }}
                            >
                              <button
                                onClick={() =>
                                  fetchEmployeeAudit(
                                    allEmployees.find(
                                      (e) => e.id === row.employeeId
                                    )
                                  )
                                }
                                style={{
                                  padding: "0.25rem 0.75rem",
                                  background:
                                    "linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)",
                                  color: "white",
                                  border: "none",
                                  borderRadius: "0.375rem",
                                  cursor: "pointer",
                                  fontSize: "0.875rem",
                                  fontWeight: 500,
                                }}
                              >
                                🔍 {t("timeclock.audit")}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr
                          style={{
                            borderTop: "2px solid #e5e7eb",
                            fontWeight: 700,
                          }}
                        >
                          <td style={{ padding: "0.75rem", color: "#111827" }}>
                            {t("timeclock.total")}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              textAlign: "right",
                              color: "#111827",
                            }}
                          >
                            {hoursReportData
                              .reduce((sum, row) => sum + row.totalHours, 0)
                              .toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              textAlign: "right",
                              color: "#111827",
                            }}
                          >
                            {hoursReportData
                              .reduce((sum, row) => sum + row.regularHours, 0)
                              .toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              textAlign: "right",
                              color: "#111827",
                            }}
                          >
                            {hoursReportData
                              .reduce((sum, row) => sum + row.overtimeHours, 0)
                              .toFixed(2)}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              textAlign: "right",
                              color: "#059669",
                            }}
                          >
                            $
                            {hoursReportData
                              .reduce((sum, row) => sum + row.estimatedPay, 0)
                              .toFixed(2)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  <button
                    onClick={exportToCSV}
                    className="btn-primary"
                    style={{
                      width: "100%",
                      padding: "0.75rem",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      background:
                        "linear-gradient(135deg, #059669 0%, #047857 100%)",
                    }}
                  >
                    📥 {t("timeclock.download_csv_payroll")}
                  </button>
                </>
              )}

              {hoursReportData.length === 0 &&
                reportStartDate &&
                reportEndDate && (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "2rem",
                      color: "#6b7280",
                      background: "#f9fafb",
                      borderRadius: "0.5rem",
                    }}
                  >
                    <p>{t("timeclock.no_hours_data_found")}</p>
                    <p style={{ fontSize: "0.875rem", marginTop: "0.5rem" }}>
                      {t("timeclock.try_selecting_different_date_range")}
                    </p>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Employee Audit Modal */}
      {showEmployeeAudit && selectedEmployeeForAudit && (
        <div
          className="modal-overlay"
          onClick={() => setShowEmployeeAudit(false)}
        >
          <div
            className="modal-content"
            style={{ maxWidth: "1000px", maxHeight: "90vh", overflow: "auto" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>
                🔍 {t("timeclock.time_entry_audit")} -{" "}
                {selectedEmployeeForAudit.full_name}
              </h3>
              <button
                className="btn-close"
                onClick={() => setShowEmployeeAudit(false)}
              >
                ×
              </button>
            </div>

            <div className="modal-body">
              <div
                style={{
                  marginBottom: "1rem",
                  padding: "1rem",
                  background: "#f0f9ff",
                  borderRadius: "0.5rem",
                  border: "1px solid #3b82f6",
                }}
              >
                <div
                  style={{
                    fontWeight: 600,
                    color: "#1e40af",
                    marginBottom: "0.5rem",
                  }}
                >
                  {t("timeclock.employee_information")}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(2, 1fr)",
                    gap: "0.5rem",
                    fontSize: "0.875rem",
                  }}
                >
                  <div>
                    <strong>{t("timeclock.name")}:</strong>{" "}
                    {selectedEmployeeForAudit.full_name}
                  </div>
                  <div>
                    <strong>{t("timeclock.email")}:</strong>{" "}
                    {selectedEmployeeForAudit.email}
                  </div>
                  <div>
                    <strong>{t("timeclock.role")}:</strong>{" "}
                    {selectedEmployeeForAudit.role}
                  </div>
                  <div>
                    <strong>{t("timeclock.total_entries")}:</strong>{" "}
                    {auditEntries.length}
                  </div>
                </div>
              </div>

              {auditEntries.length > 0 ? (
                <div
                  style={{
                    background: "#f9fafb",
                    borderRadius: "0.5rem",
                    padding: "1rem",
                    maxHeight: "500px",
                    overflowY: "auto",
                  }}
                >
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead
                      style={{
                        position: "sticky",
                        top: 0,
                        background: "#f9fafb",
                        zIndex: 1,
                      }}
                    >
                      <tr style={{ borderBottom: "2px solid #e5e7eb" }}>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "0.75rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {t("timeclock.date")}
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "0.75rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {t("timeclock.clock_in")}
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "0.75rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {t("timeclock.clock_out")}
                        </th>
                        <th
                          style={{
                            textAlign: "center",
                            padding: "0.75rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {t("timeclock.break_min")}
                        </th>
                        <th
                          style={{
                            textAlign: "right",
                            padding: "0.75rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {t("timeclock.total_hours")}
                        </th>
                        <th
                          style={{
                            textAlign: "left",
                            padding: "0.75rem",
                            fontWeight: 600,
                            color: "#374151",
                          }}
                        >
                          {t("timeclock.notes")}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditEntries.map((entry) => (
                        <tr
                          key={entry.id}
                          style={{ borderBottom: "1px solid #e5e7eb" }}
                        >
                          <td style={{ padding: "0.75rem", color: "#111827" }}>
                            {new Date(entry.clock_in_time).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "0.75rem", color: "#111827" }}>
                            {new Date(entry.clock_in_time).toLocaleTimeString()}
                          </td>
                          <td style={{ padding: "0.75rem", color: "#111827" }}>
                            {entry.clock_out_time
                              ? new Date(
                                  entry.clock_out_time
                                ).toLocaleTimeString()
                              : "Still clocked in"}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              textAlign: "center",
                              color: "#111827",
                            }}
                          >
                            {entry.break_minutes || 0}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              textAlign: "right",
                              color: "#059669",
                              fontWeight: 600,
                            }}
                          >
                            {entry.total_hours || "N/A"}
                          </td>
                          <td
                            style={{
                              padding: "0.75rem",
                              color: "#6b7280",
                              fontSize: "0.875rem",
                            }}
                          >
                            {entry.notes &&
                            entry.notes.includes("[Manual Entry]") ? (
                              <span
                                style={{
                                  background: "#dbeafe",
                                  color: "#1e40af",
                                  padding: "0.25rem 0.5rem",
                                  borderRadius: "0.25rem",
                                  fontWeight: 500,
                                }}
                              >
                                📝 Manual Entry
                              </span>
                            ) : (
                              entry.notes || "-"
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: "center",
                    padding: "2rem",
                    color: "#6b7280",
                    background: "#f9fafb",
                    borderRadius: "0.5rem",
                  }}
                >
                  <p>{t("timeclock.no_time_entries_found")}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TimeClockManager;