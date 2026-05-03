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

module.exports = router;


