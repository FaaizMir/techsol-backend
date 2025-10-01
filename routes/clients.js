const express = require('express');
const router = express.Router();
const clientsController = require('../controllers/clientsController');
const authMiddleware = require('../middleware/authMiddleware');

// All client routes require authentication
router.use(authMiddleware);

// Client endpoints
router.get('/', clientsController.getAllClients);
router.get('/:clientId', clientsController.getClientDetails);
router.put('/:clientId', clientsController.updateClient);
router.post('/', clientsController.createClient);

module.exports = router;