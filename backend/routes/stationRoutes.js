const express = require('express');
const router = express.Router();
const stationController = require('../controllers/stationController');

// Find nearby stations (Public)
router.get('/nearby', stationController.getNearbyStations);

// Admin Routes (Simplified for hackathon - add actual auth later)
router.get('/', stationController.getAllStations);
router.post('/', stationController.createStation);
router.get('/users', stationController.getAllUsers);

module.exports = router;
