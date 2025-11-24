const { Conversation, Message, Client, User } = require('../models/associations');
const { Op } = require('sequelize');

// Get all conversations for the user (admin sees all client conversations, client sees their conversation with admin)
exports.getConversations = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let conversations;

    if (userRole === 'admin') {
      // Admin sees all conversations with clients
      conversations = await Conversation.findAll({
        where: { agencyId: userId, isActive: true },
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

      return res.json({ success: true, data: formattedConversations });
    } else {
      // Client (user role) sees their conversation with admin
      // First find the client record for this user
      const client = await Client.findOne({
        where: { email: req.user.email } // Assuming client email matches user email
      });

      if (!client) {
        return res.json({ success: true, data: [] });
      }

      conversations = await Conversation.findAll({
        where: { clientId: client.id, isActive: true },
        include: [{
          model: User,
          as: 'agency',
          attributes: ['id', 'firstName', 'lastName', 'company']
        }],
        order: [['lastMessageTime', 'DESC']]
      });

      const formattedConversations = conversations.map(c => ({
        id: c.id,
        agency: `${c.agency?.firstName || ''} ${c.agency?.lastName || ''}`.trim() || 'Admin',
        company: c.agency?.company || '',
        lastMessage: c.lastMessage || '',
        time: c.lastMessageTime?.toISOString() || c.updatedAt.toISOString(),
        unread: c.unreadCount || 0,
        online: false
      }));

      return res.json({ success: true, data: formattedConversations });
    }
  } catch (error) {
    next(error);
  }
};

// Get messages for a specific conversation
exports.getConversationMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the conversation
    const conversation = await Conversation.findOne({
      where: { id: conversationId, isActive: true }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    // Check if user has access to this conversation
    let hasAccess = false;
    if (userRole === 'admin') {
      hasAccess = conversation.agencyId === userId;
    } else {
      // For client (user role), check if they are the client in this conversation
      const client = await Client.findOne({
        where: { email: req.user.email }
      });
      hasAccess = client && conversation.clientId === client.id;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    const messages = await Message.findAll({
      where: { conversationId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'receiver', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'ASC']]
    });

    const formattedMessages = messages.map(m => ({
      id: m.id,
      sender: m.senderType === (userRole === 'admin' ? 'agency' : 'client') ? 'me' : 'other',
      senderName: m.senderType === 'agency' ?
        `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`.trim() || 'Admin' :
        'Client',
      message: m.content,
      time: m.createdAt.toISOString(),
      senderType: m.senderType
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
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Message is required' }
      });
    }

    let conversation;

    if (conversationId) {
      // Existing conversation
      conversation = await Conversation.findOne({
        where: { id: conversationId, isActive: true }
      });

      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Conversation not found' }
        });
      }

      // Check access
      let hasAccess = false;
      if (userRole === 'admin') {
        hasAccess = conversation.agencyId === userId;
      } else {
        const client = await Client.findOne({
          where: { email: req.user.email }
        });
        hasAccess = client && conversation.clientId === client.id;
      }

      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: { code: 'FORBIDDEN', message: 'Access denied' }
        });
      }
    } else {
      // New conversation - only clients can start new conversations
      if (userRole === 'admin') {
        return res.status(400).json({
          success: false,
          error: { code: 'VALIDATION_ERROR', message: 'Admins must specify conversationId' }
        });
      }

      // Find client record
      let client = await Client.findOne({
        where: { email: req.user.email }
      });

      if (!client) {
        // Create a basic client record using user information
        const userRecord = await User.findByPk(req.user.id);
        if (!userRecord) {
          return res.status(404).json({
            success: false,
            error: { code: 'NOT_FOUND', message: 'User not found' }
          });
        }

        client = await Client.create({
          name: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || req.user.email.split('@')[0],
          email: req.user.email,
          company: userRecord.company || '',
          country: userRecord.country || 'Unknown',
          phone: userRecord.phone || '',
          contactPerson: userRecord.firstName || '',
          status: 'active'
        });
      }

      // Find admin user (assuming there's an admin user)
      const adminUser = await User.findOne({
        where: { role: 'admin' }
      });

      if (!adminUser) {
        return res.status(404).json({
          success: false,
          error: { code: 'NOT_FOUND', message: 'Admin not found' }
        });
      }

      // Check if conversation already exists
      conversation = await Conversation.findOne({
        where: {
          clientId: client.id,
          agencyId: adminUser.id,
          isActive: true
        }
      });

      if (!conversation) {
        // Create new conversation
        conversation = await Conversation.create({
          clientId: client.id,
          agencyId: adminUser.id,
          lastMessage: message.trim(),
          lastMessageTime: new Date(),
          unreadCount: 1, // Admin will see this as unread
          isActive: true
        });
      }
    }

    // Create the message
    const senderType = userRole === 'admin' ? 'agency' : 'client';
    const receiverId = userRole === 'admin' ? conversation.clientId : conversation.agencyId;

    const newMessage = await Message.create({
      conversationId: conversation.id,
      senderId: userId,
      receiverId: receiverId,
      senderType: senderType,
      content: message.trim(),
      isRead: false
    });

    // Update conversation's last message
    await conversation.update({
      lastMessage: message.trim(),
      lastMessageTime: new Date(),
      unreadCount: conversation.unreadCount + 1 // Increment for the other party
    });

    res.json({
      success: true,
      data: {
        id: newMessage.id,
        conversationId: conversation.id,
        sender: 'me',
        message: newMessage.content,
        time: newMessage.createdAt.toISOString(),
        senderType: senderType
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
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the conversation
    const conversation = await Conversation.findOne({
      where: { id: conversationId, isActive: true }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    // Check access
    let hasAccess = false;
    if (userRole === 'admin') {
      hasAccess = conversation.agencyId === userId;
    } else {
      const client = await Client.findOne({
        where: { email: req.user.email }
      });
      hasAccess = client && conversation.clientId === client.id;
    }

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' }
      });
    }

    // Mark all unread messages from the other party as read
    const otherSenderType = userRole === 'admin' ? 'client' : 'agency';
    await Message.update(
      { isRead: true, readAt: new Date() },
      {
        where: {
          conversationId,
          senderType: otherSenderType,
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

// Get conversation statistics
exports.getConversationStats = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    let stats = {
      totalConversations: 0,
      activeConversations: 0,
      unreadMessages: 0,
      totalMessages: 0
    };

    if (userRole === 'admin') {
      // Admin stats
      const conversations = await Conversation.findAll({
        where: { agencyId: userId, isActive: true }
      });

      stats.totalConversations = conversations.length;
      stats.activeConversations = conversations.filter(c => c.lastMessageTime).length;
      stats.unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

      const messages = await Message.count({
        where: { receiverId: userId }
      });
      stats.totalMessages = messages;

    } else {
      // Client stats
      const client = await Client.findOne({
        where: { email: req.user.email }
      });

      if (client) {
        const conversations = await Conversation.findAll({
          where: { clientId: client.id, isActive: true }
        });

        stats.totalConversations = conversations.length;
        stats.activeConversations = conversations.filter(c => c.lastMessageTime).length;
        stats.unreadMessages = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

        const messages = await Message.count({
          where: { receiverId: userId }
        });
        stats.totalMessages = messages;
      }
    }

    res.json({ success: true, data: stats });
  } catch (error) {
    next(error);
  }
};

// Search messages in conversations
exports.searchMessages = async (req, res, next) => {
  try {
    const { query, conversationId } = req.query;
    const userId = req.user.id;
    const userRole = req.user.role;

    if (!query || query.trim().length < 2) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Search query must be at least 2 characters' }
      });
    }

    let whereClause = {
      content: {
        [Op.like]: `%${query.trim()}%`
      }
    };

    // If specific conversation, add filter
    if (conversationId) {
      whereClause.conversationId = conversationId;
    } else {
      // Get user's conversations
      let conversationIds = [];
      if (userRole === 'admin') {
        const conversations = await Conversation.findAll({
          where: { agencyId: userId, isActive: true },
          attributes: ['id']
        });
        conversationIds = conversations.map(c => c.id);
      } else {
        const client = await Client.findOne({
          where: { email: req.user.email }
        });
        if (client) {
          const conversations = await Conversation.findAll({
            where: { clientId: client.id, isActive: true },
            attributes: ['id']
          });
          conversationIds = conversations.map(c => c.id);
        }
      }

      whereClause.conversationId = {
        [Op.in]: conversationIds
      };
    }

    const messages = await Message.findAll({
      where: whereClause,
      include: [
        { model: User, as: 'sender', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Conversation, as: 'conversation', attributes: ['id'] }
      ],
      order: [['createdAt', 'DESC']],
      limit: 50
    });

    const results = messages.map(m => ({
      id: m.id,
      conversationId: m.conversationId,
      content: m.content,
      senderType: m.senderType,
      senderName: m.senderType === 'agency' ?
        `${m.sender?.firstName || ''} ${m.sender?.lastName || ''}`.trim() || 'Admin' :
        'Client',
      timestamp: m.createdAt.toISOString()
    }));

    res.json({ success: true, data: results, count: results.length });
  } catch (error) {
    next(error);
  }
};

// Delete conversation (soft delete by marking as inactive)
exports.deleteConversation = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    // Find the conversation
    const conversation = await Conversation.findOne({
      where: { id: conversationId, isActive: true }
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Conversation not found' }
      });
    }

    // Only admin can delete conversations
    if (userRole !== 'admin' || conversation.agencyId !== userId) {
      return res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only admins can delete conversations' }
      });
    }

    // Soft delete
    await conversation.update({ isActive: false });

    res.json({ success: true, message: 'Conversation deleted successfully' });
  } catch (error) {
    next(error);
  }
};