const express = require('express');
const router = express.Router();
const bookingController = require('../controllers/bookingController');
const { authMiddleware } = require('../middleware/authMiddleware');

// Get available slots for a station's charger (Public/User)
router.get('/slots', bookingController.getAvailableSlots);

// Create a new booking (Protected)
router.post('/create', authMiddleware, bookingController.createBooking);

// Confirm booking after payment (Protected)
router.post('/confirm', authMiddleware, bookingController.confirmBooking);

// Get user's personal bookings (Protected)
router.get('/my-bookings', authMiddleware, bookingController.getUserBookings);

// Station Specific Bookings (for operators/owners)
router.get('/station/:stationId', authMiddleware, bookingController.getStationBookings);

// Get single booking for verification (Protected)
router.get('/:bookingId', authMiddleware, bookingController.getBookingById);

// Update booking status (Protected)
router.patch('/:bookingId/status', authMiddleware, bookingController.updateBookingStatus);

// Start charging session (Protected)
router.post('/:bookingId/start-charging', authMiddleware, bookingController.startCharging);

// Start charging session (MQTT Unmanned)
router.post('/:bookingId/start-mqtt', authMiddleware, bookingController.startMqttCharging);

// Stop charging session (Protected)
router.post('/:bookingId/stop-charging', authMiddleware, bookingController.stopCharging);

// Generate bill (Protected)
router.post('/:bookingId/generate-bill', authMiddleware, bookingController.generateBill);

// Confirm bill payment (Protected)
router.post('/confirm-bill', authMiddleware, bookingController.confirmBillPayment);

module.exports = router;


