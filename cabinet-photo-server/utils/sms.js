
// SMS UTILITIES Via Twilio
// REQUIRED IMPORTS
const twilio = require("twilio");
const { getDb } = require("../db-helpers");

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

// SMS routing helper functions
async function getSmsRoutingRecipients(messageType) {
  const db = await getDb();
  try {
    const recipients = await db.all(
      `SELECT phone_number, name FROM sms_routing_recipients
       WHERE message_type = ? AND is_active = 1
       ORDER BY priority_order ASC`,
      [messageType]
    );
    return recipients;
  } catch (error) {
    console.error("Error getting SMS routing recipients:", error);
    return [];
  }
}

async function getSmsRoutingSettings(messageType) {
  const db = await getDb();
  try {
    const settings = await db.get(
      "SELECT * FROM sms_routing_settings WHERE message_type = ?",
      [messageType]
    );
    return settings || { is_enabled: true, routing_mode: "single" };
  } catch (error) {
    console.error("Error getting SMS routing settings:", error);
    return { is_enabled: true, routing_mode: "single" };
  }
}

async function sendSmsWithRouting(messageType, messageBody, options = {}) {
  if (!twilioClient) {
    console.warn("  Twilio client not available for SMS routing");
    return { success: false, error: "SMS service not configured" };
  }

  try {
    const settings = await getSmsRoutingSettings(messageType);

    if (!settings.is_enabled) {
      console.log(` SMS routing disabled for ${messageType}`);
      return { success: true, message: "SMS routing disabled" };
    }

    const recipients = await getSmsRoutingRecipients(messageType);

    if (recipients.length === 0) {
      console.warn(`  No SMS recipients configured for ${messageType}`);
      return { success: false, error: "No recipients configured" };
    }

    const results = [];
    const targetRecipients =
      settings.routing_mode === "single" ? [recipients[0]] : recipients;

    for (const recipient of targetRecipients) {
      try {
        const smsOptions = {
          body: messageBody,
          to: recipient.phone_number,
        };

        if (process.env.TWILIO_MESSAGING_SERVICE_SID) {
          smsOptions.messagingServiceSid =
            process.env.TWILIO_MESSAGING_SERVICE_SID;
        } else if (process.env.TWILIO_PHONE_NUMBER) {
          smsOptions.from = process.env.TWILIO_PHONE_NUMBER;
        }

        const result = await twilioClient.messages.create(smsOptions);

        // Log to SMS routing history
        const db = await getDb();
        await db.run(
          `INSERT INTO sms_routing_history
           (message_type, recipient_phone, recipient_name, message_content, twilio_sid, delivery_status)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            messageType,
            recipient.phone_number,
            recipient.name,
            messageBody,
            result.sid,
            "sent",
          ]
        );

        results.push({
          success: true,
          recipient: recipient.name,
          phone: recipient.phone_number,
          sid: result.sid,
        });

        console.log(
          ` SMS sent to ${recipient.name} (${recipient.phone_number}) - SID: ${result.sid}`
        );
      } catch (error) {
        const db = await getDb();
        await db.run(
          `INSERT INTO sms_routing_history
           (message_type, recipient_phone, recipient_name, message_content, delivery_status, error_message)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            messageType,
            recipient.phone_number,
            recipient.name,
            messageBody,
            "failed",
            error.message,
          ]
        );

        results.push({
          success: false,
          recipient: recipient.name,
          phone: recipient.phone_number,
          error: error.message,
        });

        console.error(`  SMS failed to ${recipient.name}: ${error.message}`);
      }
    }

    return {
      success: results.some((r) => r.success),
      results,
      totalSent: results.filter((r) => r.success).length,
      totalFailed: results.filter((r) => !r.success).length,
    };
  } catch (error) {
    console.error("SMS routing error:", error);
    return { success: false, error: error.message };
  }
}

// EXPORTS 
module.exports = {
  twilioClient,
  sendSmsWithRouting,
  getSmsRoutingRecipients,
  getSmsRoutingSettings
};

