const twilio = require('twilio');
const Station = require('../models/Station');

// Load environment variables (should already be done in server.js, but good to be sure)
// process.env.TWILIO_ACCOUNT_SID
// process.env.TWILIO_AUTH_TOKEN
// process.env.TWILIO_PHONE_NUMBER

const sendSOS = async (req, res) => {
  try {
    const { contacts, locationMessage, userName, emergencyType, userLat, userLng } = req.body;
    console.log("SOS Request Received. User Coordinates:", { userLat, userLng });

    if (!contacts || !Array.isArray(contacts) || contacts.length === 0) {
      return res.status(400).json({ message: "No emergency contacts provided." });
    }

    if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN || !process.env.TWILIO_PHONE_NUMBER) {
       console.error("Twilio credentials missing in environment variables.");
       return res.status(500).json({ message: "SMS service is not configured on the server." });
    }

    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

    const safeName = userName ? userName : "A user";
    const safeType = emergencyType ? emergencyType : "General Emergency";
    
    const messageBody = `🚨 EMERGENCY ALERT 🚨\n${safeName} has reported a [${safeType}].\n\nLocation: ${locationMessage}`;

    const sendPromises = contacts.map(contact => {
        // Format phone number to E.164 standard (assuming Indian numbers for this app based on +91 prefix in UI)
        // If the number already has a country code, we might need to handle it, but based on the UI, the user just enters the 10 digit number.
        let formattedPhone = contact.phone;
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+91${formattedPhone}`; // Defaulting to India as per UI
        }

        return client.messages.create({
            body: messageBody,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: formattedPhone
        });
    });

    await Promise.all(sendPromises);

    // --- ALERTS FOR NEARBY STATIONS (Owners, Operators, Admins) ---
    try {
        let alertedOwnerIds = [];
        let alertedOperatorIds = [];
        let nearbyStationsCount = 0;

        if (userLat && userLng) {
            const latFloat = parseFloat(userLat);
            const lngFloat = parseFloat(userLng);
            
            // Find stations within 10km (10000 meters)
            const nearbyStations = await Station.find({
                location: {
                    $near: {
                        $geometry: {
                            type: "Point",
                            coordinates: [lngFloat, latFloat] // MongoDB uses [lng, lat]
                        },
                        $maxDistance: 10000 
                    }
                }
            }).select('ownerId operatorIds name');

            nearbyStationsCount = nearbyStations.length;
            
            nearbyStations.forEach(station => {
                if (station.ownerId) alertedOwnerIds.push(station.ownerId.toString());
                if (station.operatorIds && station.operatorIds.length > 0) {
                    station.operatorIds.forEach(opId => alertedOperatorIds.push(opId.toString()));
                }
            });

            // Remove duplicates
            alertedOwnerIds = [...new Set(alertedOwnerIds)];
            alertedOperatorIds = [...new Set(alertedOperatorIds)];
        } else {
            console.log("No valid userLat/userLng provided. Skipping geospatial query.");
        }

        // Emit Socket.io event globally
        const io = req.app.get('socketio');
        if (io) {
            io.emit('emergency-alert', {
                userName: safeName,
                emergencyType: safeType,
                locationMessage,
                userLat,
                userLng,
                alertedOwnerIds,
                alertedOperatorIds,
                timestamp: new Date()
            });
            console.log(`SOS Alert emitted via Socket.io. Alerting ${alertedOwnerIds.length} owners and ${alertedOperatorIds.length} operators across ${nearbyStationsCount} stations.`);
        }
    } catch (dbError) {
        console.error("Error finding nearby stations or emitting socket alert:", dbError);
        // We do not throw here to ensure the 200 OK SMS response still gets sent
    }

    res.status(200).json({ message: "SOS alerts sent successfully to all contacts." });
  } catch (error) {
    console.error("Error sending SOS via Twilio:", error);
    res.status(500).json({ message: "Failed to send SOS alerts.", error: error.message });
  }
};

module.exports = {
  sendSOS
};
