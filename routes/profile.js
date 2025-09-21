const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// All profile routes require authentication
router.use(authMiddleware);

// Profile endpoints
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post('/picture', uploadMiddleware.single('profilePicture'), profileController.updateProfilePicture);
router.put('/password', profileController.changePassword);

module.exports = router;