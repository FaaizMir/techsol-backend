const express = require('express');
const authMiddleware = require('../middleware/authMiddleware');
const protectedController = require('../controllers/protectedController');
const router = express.Router();

router.get('/profile', authMiddleware, protectedController.getProfile);
router.get('/check-auth', authMiddleware, protectedController.checkAuth);

module.exports = router;