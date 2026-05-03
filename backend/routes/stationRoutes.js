const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// Find nearby stations (Public)
router.get('/nearby', stationController.getNearbyStations);
router.get('/:id', stationController.getStationById);
router.get('/', stationController.getAllStations);
router.post('/', stationController.createStation);
router.get('/users', stationController.getAllUsers);
router.post('/:id/reviews', stationController.addReview);

module.exports = router;
