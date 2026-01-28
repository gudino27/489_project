import { useState } from 'react';
import { getTodayPST, toPSTDateString, extractPSTDate } from '../utils/timezoneUtils';

// Hook to manage calendar state and navigation
export const useCalendar = (token, API_BASE) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthEntries, setMonthEntries] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarView, setCalendarView] = useState("month");
  const [showEnterTimeModal, setShowEnterTimeModal] = useState(false);
  const [manualEntry, setManualEntry] = useState({
    date: getTodayPST(),
    timeIn: "",
    timeOut: "",
    breakMinutes: 0,
    notes: "",
  });

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
        const entriesByDate = {};
        data.entries.forEach((entry) => {
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
    const startDay = firstDay.getDay();
    const days = [];
    const todayPST = getTodayPST();

    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const entries = monthEntries[dateStr] || [];
      const totalHours = entries.reduce((sum, e) => sum + (e.total_hours || 0), 0);

      days.push({
        day,
        date: dateStr,
        isToday: dateStr === todayPST,
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
      newDate.setDate(newDate.getDate() + direction * 7);
    } else {
      newDate.setMonth(newDate.getMonth() + direction);
    }
    setCurrentMonth(newDate);
    fetchMonthEntries(newDate);
  };

  const getWeekDays = (date) => {
    const days = [];
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());
    const todayPST = getTodayPST();

    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startOfWeek);
      currentDate.setDate(startOfWeek.getDate() + i);
      const dateStr = toPSTDateString(currentDate);
      const entries = monthEntries[dateStr] || [];
      const totalHours = entries.reduce((sum, e) => sum + (parseFloat(e.total_hours) || 0), 0).toFixed(6);

      days.push({
        day: currentDate.getDate(),
        date: dateStr,
        isToday: dateStr === todayPST,
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
    setSelectedDate(getTodayPST());
  };

  const openManualEntryForDate = (dateString) => {
    setManualEntry({
      date: dateString,
      timeIn: "",
      timeOut: "",
      breakMinutes: 0,
      notes: "",
    });
    setShowEnterTimeModal(true);
  };

  const closeManualEntryModal = () => {
    setShowEnterTimeModal(false);
    setManualEntry({
      date: getTodayPST(),
      timeIn: "",
      timeOut: "",
      breakMinutes: 0,
      notes: "",
    });
  };

  return {
    currentMonth,
    monthEntries,
    selectedDate,
    setSelectedDate,
    calendarView,
    setCalendarView,
    showEnterTimeModal,
    setShowEnterTimeModal,
    manualEntry,
    setManualEntry,
    fetchMonthEntries,
    getDaysInMonth,
    getWeekDays,
    changeMonth,
    goToToday,
    openManualEntryForDate,
    closeManualEntryModal,
  };
};
