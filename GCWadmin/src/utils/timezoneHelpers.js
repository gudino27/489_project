/**
 * PST/PDT Timezone Helper Functions
 * All time clock entries are stored and displayed in Pacific Standard Time
 */

const TIMEZONE = 'America/Los_Angeles'; // PST/PDT

/**
 * Parse PST timestamp from database
 * Database format: "2025-10-19 18:08:00" (already in PST)
 * @param {string} pstTimestamp - Timestamp string from database
 * @returns {Date|null} Date object representing the PST time
 */
export const parsePSTTimestamp = (pstTimestamp) => {
  if (!pstTimestamp) return null;

  // Parse as UTC to preserve the values, then format as PST
  const parts = pstTimestamp.split(/[- :]/);
  return new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));
};

/**
 * Format time in PST
 * @param {string} dateTimeStr - Timestamp string
 * @returns {string} Formatted time (e.g., "6:08 PM")
 */
export const formatTimePST = (dateTimeStr) => {
  if (!dateTimeStr) return '--:--';

  let date;
  if (typeof dateTimeStr === 'string' && dateTimeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    // Database format: "2025-10-19 18:08:00" - this IS the PST time
    const parts = dateTimeStr.split(/[- :]/);
    date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));
  } else {
    date = new Date(dateTimeStr);
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC', // Display as-is since we converted to UTC representing PST
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Format date in PST
 * @param {string} dateTimeStr - Timestamp string
 * @returns {string} Formatted date (e.g., "Wed, Oct 19")
 */
export const formatDatePST = (dateTimeStr) => {
  if (!dateTimeStr) return '';

  let date;
  if (typeof dateTimeStr === 'string' && dateTimeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    // Database format: "2025-10-19 18:08:00"
    const parts = dateTimeStr.split(/[- :]/);
    date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));
  } else if (typeof dateTimeStr === 'string' && dateTimeStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
    // Date only format: "2025-10-19"
    const parts = dateTimeStr.split('-');
    date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 0, 0, 0));
  } else {
    date = new Date(dateTimeStr);
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

/**
 * Format full date and time in PST
 * @param {string} dateTimeStr - Timestamp string
 * @returns {string} Formatted datetime (e.g., "Wednesday, October 19, 2025 at 6:08 PM")
 */
export const formatDateTimePST = (dateTimeStr) => {
  if (!dateTimeStr) return '';

  let date;
  if (typeof dateTimeStr === 'string' && dateTimeStr.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
    const parts = dateTimeStr.split(/[- :]/);
    date = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], parts[3], parts[4], parts[5]));
  } else {
    date = new Date(dateTimeStr);
  }

  return new Intl.DateTimeFormat('en-US', {
    timeZone: 'UTC',
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  }).format(date);
};

/**
 * Get current date in PST as YYYY-MM-DD string
 * @returns {string} Current PST date (e.g., "2025-10-19")
 */
export const getTodayPST = () => {
  const now = new Date();
  const pstDate = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now);

  // Convert from MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = pstDate.split('/');
  return `${year}-${month}-${day}`;
};

/**
 * Convert a Date object to PST date string
 * @param {Date} date - JavaScript Date object
 * @returns {string} PST date string (e.g., "2025-10-19")
 */
export const toPSTDateString = (date) => {
  const pstDate = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);

  // Convert from MM/DD/YYYY to YYYY-MM-DD
  const [month, day, year] = pstDate.split('/');
  return `${year}-${month}-${day}`;
};

/**
 * Extract date portion from PST timestamp
 * @param {string} pstTimestamp - Timestamp string (e.g., "2025-10-19 18:08:00")
 * @returns {string} Date portion (e.g., "2025-10-19")
 */
export const extractPSTDate = (pstTimestamp) => {
  if (!pstTimestamp) return '';

  // Handle both "2025-10-19 18:08:00" and "2025-10-19T12:26:00" formats
  if (pstTimestamp.includes(' ')) {
    return pstTimestamp.split(' ')[0];
  } else if (pstTimestamp.includes('T')) {
    return pstTimestamp.split('T')[0];
  }

  return pstTimestamp;
};

/**
 * Get start and end of current week in PST (Sunday to Saturday)
 * @returns {Object} { startOfWeek: Date, endOfWeek: Date }
 */
export const getCurrentWeekPST = () => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Sunday
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Saturday
  endOfWeek.setHours(23, 59, 59, 999);

  return { startOfWeek, endOfWeek };
};

/**
 * Get start and end of last week in PST (Sunday to Saturday)
 * @returns {Object} { startOfWeek: Date, endOfWeek: Date }
 */
export const getLastWeekPST = () => {
  const { startOfWeek, endOfWeek } = getCurrentWeekPST();

  const lastWeekStart = new Date(startOfWeek);
  lastWeekStart.setDate(startOfWeek.getDate() - 7);

  const lastWeekEnd = new Date(endOfWeek);
  lastWeekEnd.setDate(endOfWeek.getDate() - 7);

  return { startOfWeek: lastWeekStart, endOfWeek: lastWeekEnd };
};

/**
 * Get the timezone abbreviation (PST or PDT)
 * @returns {string} "PST" or "PDT" based on current date
 */
export const getTimezoneAbbreviation = () => {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: TIMEZONE,
    timeZoneName: 'short',
  });

  const parts = formatter.formatToParts(now);
  const timeZonePart = parts.find(part => part.type === 'timeZoneName');

  return timeZonePart ? timeZonePart.value : 'PST';
};

/**
 * Check if a date is today in PST
 * @param {string} dateString - Date string (YYYY-MM-DD)
 * @returns {boolean} True if date is today in PST
 */
export const isTodayPST = (dateString) => {
  return dateString === getTodayPST();
};

/**
 * Calculate hours between two PST timestamps
 * @param {string} startTime - Start timestamp
 * @param {string} endTime - End timestamp
 * @param {number} breakMinutes - Break time in minutes to subtract
 * @returns {number} Hours worked (with 2 decimal places)
 */
export const calculateHours = (startTime, endTime, breakMinutes = 0) => {
  if (!startTime || !endTime) return 0;

  const start = parsePSTTimestamp(startTime);
  const end = parsePSTTimestamp(endTime);

  if (!start || !end) return 0;

  const diffMs = end - start;
  const diffMins = Math.floor(diffMs / 60000) - breakMinutes;
  const hours = diffMins / 60;

  return parseFloat(hours.toFixed(2));
};

export default {
  parsePSTTimestamp,
  formatTimePST,
  formatDatePST,
  formatDateTimePST,
  getTodayPST,
  toPSTDateString,
  extractPSTDate,
  getCurrentWeekPST,
  getLastWeekPST,
  getTimezoneAbbreviation,
  isTodayPST,
  calculateHours,
};
