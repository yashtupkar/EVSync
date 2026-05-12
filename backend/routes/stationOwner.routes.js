const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { 
    addStationRequest, 
    getMyStations, 
    assignOperator 
} = require('../controllers/stationOwnerController');
const { getHostSummary, getHostBookings } = require('../controllers/bookingController');

// All routes here require being logged in
router.use(authMiddleware);

router.post('/add-request', authorize('station_owner', 'user'), addStationRequest);
router.get('/my-stations', authorize('station_owner', 'user'), getMyStations);
router.post('/assign-operator', authorize('station_owner', 'admin'), assignOperator);

// Host Dashboard Routes
router.get('/host-summary', authorize('user', 'station_owner'), getHostSummary);
router.get('/host-bookings', authorize('user', 'station_owner'), getHostBookings);


module.exports = router;
