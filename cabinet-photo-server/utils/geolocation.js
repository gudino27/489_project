
// GEOLOCATION UTILITIES

// This file contains IP-based geolocation lookup functionality
const axios = require("axios");
async function getLocationFromIP(ip) {
  console.log('getLocationFromIP called with IP:', ip);
  try {
    // Use freeipapi.com (free, HTTPS support, 60 requests/minute)
    const response = await axios.get(`https://freeipapi.com/api/json/${ip}`);
    const data = response.data;

    if (data.countryName) {
      return {
        country: data.countryName || 'Unknown',
        region: data.regionName || 'Unknown',
        city: data.cityName || 'Unknown',
        timezone: data.timeZones?.[0] || 'UTC'
      };
    }
  } catch (error) {
    console.error('Error getting location from IP:', error);
  }
  // Fallback for any errors
  return {
    country: 'Unknown',
    region: 'Unknown',
    city: 'Unknown',
    timezone: 'UTC'
  };
}
// EXPORTS
module.exports = {
  getLocationFromIP
};

