const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// All chat routes require authentication
router.use(authMiddleware);

// Chat endpoints
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId/messages', chatController.getConversationMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.put('/conversations/:conversationId/read', chatController.markMessagesRead);

module.exports = router;