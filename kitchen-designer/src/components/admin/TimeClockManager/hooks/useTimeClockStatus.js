import { useState, useEffect } from 'react';

// Hook to manage time clock status and actions (clock in/out/break)
export const useTimeClockStatus = (token, API_BASE, t, onStatusChange, onPeriodChange) => {
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
        if (onStatusChange) onStatusChange(data);
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
        if (onPeriodChange) onPeriodChange(data);
      }
    } catch (error) {
      console.error("Error fetching period:", error);
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

  // Fetch status on mount and poll every 30 seconds
  useEffect(() => {
    if (token) {
      fetchStatus();
      fetchCurrentPeriod();
      const interval = setInterval(fetchStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [token]);

  return {
    loading,
    actionLoading,
    status,
    currentPeriod,
    fetchStatus,
    fetchCurrentPeriod,
    handleClockIn,
    handleClockOut,
    handleStartBreak,
    handleEndBreak,
  };
};
