/**
 * Date and time formatting utilities for Pacific Time (America/Los_Angeles)
 * These utilities ensure all dates/times display consistently in Pacific Time
 * across the entire application, regardless of server timezone or UTC storage.
 */

/**
 * Format a date in Pacific Time
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted date (e.g., "9/29/2025")
 */
export const formatDatePacific = (dateString, options = {}) => {
  if (!dateString) return 'N/A';

  // Handle dates from SQLite/database that come without timezone info
  let date;
  if (typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('T')) {
    // Format: "YYYY-MM-DD HH:MM:SS" or "YYYY-MM-DD" - treat as UTC
    date = new Date(dateString.replace(' ', 'T') + 'Z');
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) return 'Invalid Date';

  return date.toLocaleDateString('en-US', {
    timeZone: 'America/Los_Angeles',
    ...options
  });
};

/**
 * Format a date and time in Pacific Time
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted date and time (e.g., "9/29/2025, 7:36:35 PM")
 */
export const formatDateTimePacific = (dateString, options = {}) => {
  if (!dateString) return 'N/A';

  // Handle dates from SQLite/database that come without timezone info
  // SQLite returns format: "YYYY-MM-DD HH:MM:SS" which should be treated as UTC
  let date;
  if (typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('T')) {
    // Format: "YYYY-MM-DD HH:MM:SS" - append 'Z' to treat as UTC
    date = new Date(dateString.replace(' ', 'T') + 'Z');
  } else {
    date = new Date(dateString);
  }

  if (isNaN(date.getTime())) return 'Invalid Date';

  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    ...options
  });
};

/**
 * Format only time in Pacific Time
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} options - Additional Intl.DateTimeFormat options
 * @returns {string} Formatted time (e.g., "7:36:35 PM")
 */
export const formatTimePacific = (dateString, options = {}) => {
  if (!dateString) return 'N/A';

  // Handle dates from SQLite/database that come without timezone info
  let date;
  if (typeof dateString === 'string' && !dateString.includes('Z') && !dateString.includes('+') && !dateString.includes('T')) {
    // Format: "YYYY-MM-DD HH:MM:SS" - treat as UTC
    date = new Date(dateString.replace(' ', 'T') + 'Z');
  } else {
    date = new Date(dateString);
  }
  if (isNaN(date.getTime())) return 'Invalid Date';

  return date.toLocaleTimeString('en-US', {
    timeZone: 'America/Los_Angeles',
    ...options
  });
};

/**
 * Format a date with custom format in Pacific Time
 * @param {string|Date} dateString - Date string or Date object
 * @param {object} formatOptions - Intl.DateTimeFormat options
 * @returns {string} Formatted date/time
 */
export const formatCustomPacific = (dateString, formatOptions = {}) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  return date.toLocaleString('en-US', {
    timeZone: 'America/Los_Angeles',
    ...formatOptions
  });
};

/**
 * Get current date/time in Pacific Time
 * @returns {Date} Current date object
 */
export const nowPacific = () => {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
};

/**
 * Format date for display with relative time (e.g., "Today at 3:45 PM", "Yesterday at 2:30 PM")
 * @param {string|Date} dateString - Date string or Date object
 * @returns {string} Formatted relative date/time
 */
export const formatRelativeDateTimePacific = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Invalid Date';

  const now = new Date();
  const pacificDate = new Date(date.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  const pacificNow = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));

  const diffMs = pacificNow - pacificDate;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  const timeStr = formatTimePacific(dateString);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24 && pacificDate.toDateString() === pacificNow.toDateString()) {
    return `Today at ${timeStr}`;
  }
  if (diffDays === 1) return `Yesterday at ${timeStr}`;
  if (diffDays < 7) return `${diffDays} days ago at ${timeStr}`;

  return formatDateTimePacific(dateString);
};