const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { 
    addStationRequest, 
    getMyStations, 
    assignOperator 
} = require('../controllers/stationOwnerController');

// All routes here require being logged in and having the station_owner role
router.use(authMiddleware);
router.use(authorize('station_owner'));

router.post('/add', addStationRequest);
router.get('/my-stations', getMyStations);
router.post('/assign-operator', assignOperator);

module.exports = router;
