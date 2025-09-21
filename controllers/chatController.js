const { Conversation, Message, Client, User } = require('../models/associations');
const { Op } = require('sequelize');

// Get all conversations for the agency
exports.getConversations = async (req, res, next) => {
  try {
    const agencyId = req.user.id;

    const conversations = await Conversation.findAll({
      where: { agencyId, isActive: true },
      include: [{
        model: Client,
        as: 'client',
        attributes: ['id', 'name', 'company']
      }],
      order: [['lastMessageTime', 'DESC']]
    });

    const formattedConversations = conversations.map(c => ({
      id: c.id,
      client: c.client?.name || 'Unknown',
      company: c.client?.company || '',
      lastMessage: c.lastMessage || '',
      time: c.lastMessageTime?.toISOString() || c.updatedAt.toISOString(),
      unread: c.unreadCount || 0,
      online: false // Would need real-time implementation
    }));

    res.json({ success: true, data: formattedConversations });
  } catch (error) {
    next(error);
  }
};

// Get messages for a specific conversation
exports.getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const agencyId = req.user.id;

    // Verify conversation belongs to agency
    const conversation = await Conversation.findOne({
      where: { id: conversationId, agencyId }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    const messages = await Message.findAll({
      where: { conversationId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'email'] },
        { model: User, as: 'receiver', attributes: ['id', 'email'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    const formattedMessages = messages.map(m => ({
      id: m.id,
      sender: m.senderType === 'agency' ? 'me' : 'client',
      message: m.content,
      time: m.createdAt.toISOString()
    }));

    res.json({ success: true, data: formattedMessages });
  } catch (error) {
    next(error);
  }
};

// Send a message in a conversation
exports.sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const agencyId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message is required' }
      });
    }

    // Verify conversation belongs to agency
    const conversation = await Conversation.findOne({
      where: { id: conversationId, agencyId }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    // Create the message
    const newMessage = await Message.create({
      conversationId,
      senderId: agencyId,
      receiverId: conversation.clientId,
      senderType: 'agency',
      content: message.trim(),
      isRead: false
    });

    // Update conversation's last message
    await conversation.update({
      lastMessage: message.trim(),
      lastMessageTime: new Date(),
      unreadCount: conversation.unreadCount + 1 // Increment for client
    });

    res.json({
      success: true,
      data: {
        id: newMessage.id,
        sender: 'me',
        message: newMessage.content,
        time: newMessage.createdAt.toISOString()
      }
    });
  } catch (error) {
    next(error);
  }
};

// Mark messages as read in a conversation
exports.markMessagesRead = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const agencyId = req.user.id;

    // Verify conversation belongs to agency
    const conversation = await Conversation.findOne({
      where: { id: conversationId, agencyId }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    // Mark all unread messages from client as read
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId,
          senderType: 'client',
          isRead: false
        }
      }
    );

    // Reset unread count
    await conversation.update({ unreadCount: 0 });

    res.json({ success: true, message: 'Messages marked as read' });
  } catch (error) {
    next(error);
  }
};