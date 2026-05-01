const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { getUser, updateProfile, addVehicle } = require('../controllers/userController');
const upload = require('../middleware/uploadMiddleware');
const router = express.Router();

router.get('/', authMiddleware, getUser);
router.put('/update-profile', authMiddleware, upload.single('avatar'),  updateProfile);
router.post('/add-vehicle', authMiddleware, addVehicle);

module.exports = router;
