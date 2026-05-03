const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');
const { authMiddleware } = require('../middleware/authMiddleware');


// Find nearby stations (Public)
router.get('/nearby', stationController.getNearbyStations);
router.get('/:id', stationController.getStationById);
router.get('/', stationController.getAllStations);
router.post('/', stationController.createStation);
router.get('/users', stationController.getAllUsers);
router.post('/:id/reviews', stationController.addReview);

// Operator Routes
router.get('/operator/my-station', authMiddleware, stationController.getOperatorStation);
router.patch('/:id/chargers/:chargerId/status', authMiddleware, stationController.updateChargerStatus);


module.exports = router;
