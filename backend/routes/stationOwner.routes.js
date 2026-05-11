const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { 
    addStationRequest, 
    getMyStations, 
    assignOperator 
} = require('../controllers/stationOwnerController');

// All routes here require being logged in
router.use(authMiddleware);

router.post('/add-request', authorize('station_owner', 'user'), addStationRequest);
router.get('/my-stations', authorize('station_owner'), getMyStations);
router.post('/assign-operator', authorize('station_owner', 'admin'), assignOperator);


module.exports = router;
