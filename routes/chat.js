const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const authMiddleware = require('../middleware/authMiddleware');

// All chat routes require authentication
router.use(authMiddleware);

// Conversation management
router.get('/conversations', chatController.getConversations);
router.get('/conversations/:conversationId/messages', chatController.getConversationMessages);
router.post('/conversations/:conversationId/messages', chatController.sendMessage);
router.post('/messages', chatController.sendMessage); // Allow sending message without conversationId (for new conversations)
router.put('/conversations/:conversationId/read', chatController.markMessagesRead);
router.delete('/conversations/:conversationId', chatController.deleteConversation);

// Statistics and search
router.get('/stats', chatController.getConversationStats);
router.get('/search', chatController.searchMessages);

module.exports = router;