const express = require('express');
const { googleLogin, sendOTP, verifyOTP, verifyOnly } = require('../controllers/authController');

const router = express.Router();

router.post('/google', googleLogin);
router.post('/login/phone', sendOTP);
router.post('/login/phone/verify', verifyOTP);
router.post('/verify-only', verifyOnly);

module.exports = router;
