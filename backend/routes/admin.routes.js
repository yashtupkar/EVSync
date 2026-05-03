const express = require('express');
const router = express.Router();
const { authMiddleware, authorize } = require('../middleware/authMiddleware');
const { 
    getPendingStations, 
    approveStation, 
    rejectStation,
    getAllUsers,
    getAllStationRequests,
    createAdminStation,
    updateAdminStation,
    deleteAdminStation
} = require('../controllers/adminController');

// All routes here require being logged in and having the admin role
router.use(authMiddleware);
router.use(authorize('admin'));

router.get('/pending-stations', getPendingStations);
router.get('/all-stations', getAllStationRequests);
router.post('/approve/:id', approveStation);
router.post('/reject/:id', rejectStation);
router.get('/users', getAllUsers);

// Full CRUD for stations
router.post('/station', createAdminStation);
router.put('/station/:id', updateAdminStation);
router.delete('/station/:id', deleteAdminStation);

module.exports = router;
