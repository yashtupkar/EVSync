const twilio = require('twilio');
const dotenv = require('dotenv');

dotenv.config();

let client;

const getTwilioClient = () => {
  if (client) return client;
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  if (sid && token) {
    try {
      client = twilio(sid, token);
      console.log('✅ Twilio Client Initialized');
      return client;
    } catch (err) {
      console.error('❌ Twilio Init Error:', err.message);
    }
  }
  return null;
};

/**
 * Sends a booking confirmation SMS to the user
 */
const sendBookingConfirmation = async (to, bookingDetails) => {
  const { stationName, date, time, otp, chargerId } = bookingDetails;
  const twilioNumber = process.env.TWILIO_PHONE_NUMBER;
  
  const message = `⚡ EVSync: Your booking at ${stationName} is confirmed!\n📅 Date: ${date}\n⏰ Time: ${time}\n🔌 Charger: ${chargerId}\n🔑 OTP: ${otp}\nDrive safe!`;

  try {
    const activeClient = getTwilioClient();
    if (!activeClient) {
      console.warn('⚠️ Twilio not configured. Message:', message);
      return { success: false, error: 'Twilio not configured' };
    }

    const response = await activeClient.messages.create({
      body: message,
      from: twilioNumber,
      to: to.startsWith('+') ? to : `+91${to}`
    });

    console.log('✅ SMS sent successfully:', response.sid);
    return { success: true, sid: response.sid };
  } catch (error) {
    console.error('❌ Failed to send SMS:', error.message);
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmation
};

