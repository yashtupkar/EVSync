const express = require('express');
const { authMiddleware } = require('../middleware/authMiddleware');
const { uploadStation } = require('../middleware/uploadMiddleware');
const router = express.Router();

router.post('/station-image', authMiddleware, uploadStation.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded' });
    }
    
    // Cloudinary returns the URL in req.file.path
    res.status(200).json({ 
      success: true, 
      imageUrl: req.file.path 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
