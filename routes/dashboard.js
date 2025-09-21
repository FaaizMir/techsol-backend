const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const authMiddleware = require('../middleware/authMiddleware');

// All dashboard routes require authentication
router.use(authMiddleware);

// Dashboard endpoints
router.get('/stats', dashboardController.getStats);
router.get('/recent-projects', dashboardController.getRecentProjects);
router.get('/recent-messages', dashboardController.getRecentMessages);

module.exports = router;