
// SMS UTILITIES Via Twilio
// REQUIRED IMPORTS
const twilio = require("twilio");
// Twilio client initialization
let twilioClient = null;
if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
  try {
    if (process.env.TWILIO_ACCOUNT_SID.startsWith("AC")) {
      twilioClient = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      );
      console.log("Twilio client initialized successfully");
    } else {
      console.warn(
        'Invalid Twilio Account SID format. Account SID must start with "AC"'
      );
    }
  } catch (error) {
    console.error("Failed to initialize Twilio client:", error.message);
  }
}
// EXPORTS 
module.exports = {
  twilioClient
};

