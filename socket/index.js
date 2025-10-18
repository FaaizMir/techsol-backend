// const { Server } = require("socket.io");
// const jwt = require("jsonwebtoken");
// const Message = require("../models");
// const User = require("../models");

// function setupSockets(server) {
//   const io = new Server(server, { cors: { origin: "*" } });

//   // Auth middleware for socket
//   io.use((socket, next) => {
//     const token = socket.handshake.auth?.token;
//     if (!token) return next(new Error("No token"));

//     try {
//       const decoded = jwt.verify(token, process.env.JWT_SECRET);
//       socket.user = decoded; // { id, email }
//       next();
//     } catch (err) {
//       next(new Error("Invalid token"));
//     }
//   });

//   io.on("connection", (socket) => {
//     console.log("User connected:", socket.user.email);

//     // Join personal room (for private messages)
//     socket.join(`user_${socket.user.id}`);

//     // Send message
//     socket.on("chatMessage", async ({ to, content }) => {
//       if (!to || !content) return;

//       const msg = await Message.create({
//         senderId: socket.user.id,
//         receiverId: to,
//         content
//       });

//       // Emit to receiver room
//       io.to(`user_${to}`).emit("chatMessage", msg);

//       // Also emit back to sender
//       socket.emit("chatMessage", msg);
//     });

//     socket.on("disconnect", () => {
//       console.log("User disconnected:", socket.user.email);
//     });
//   });

//   return io;
// }

// module.exports = setupSockets;


const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const { Conversation, Message, Client, User } = require('../models/associations');

// Store online users: { userId: { socketId, role, email, lastSeen } }
const onlineUsers = new Map();

// Store typing status: { conversationId: { userId: timestamp } }
const typingUsers = new Map();

function setupSockets(server) {
  const io = new Server(server, { 
    cors: { 
      origin: "*",
      methods: ["GET", "POST"]
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authenticate socket connection
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication error: No token provided"));

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = decoded; // { id, email, role }
      next();
    } catch (err) {
      next(new Error("Authentication error: Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    const userId = socket.user.id;
    const userRole = socket.user.role;
    
    console.log("✅ User connected:", socket.user.email, `(Role: ${userRole}, ID: ${userId})`);

    // Store user as online
    onlineUsers.set(userId, {
      socketId: socket.id,
      role: userRole,
      email: socket.user.email,
      lastSeen: new Date()
    });

    // Join user-specific room for private messages
    socket.join(`user_${userId}`);

    // Join role-based room (admin or client)
    socket.join(userRole);

    // Emit user online status to all admin users
    io.to('admin').emit('userOnline', {
      userId: userId,
      email: socket.user.email,
      role: userRole,
      timestamp: new Date().toISOString()
    });

    // Send current online users list to the connected user
    const onlineUsersList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
      userId: id,
      email: data.email,
      role: data.role,
      lastSeen: data.lastSeen
    }));
    socket.emit('onlineUsers', onlineUsersList);

    // Handle chat message
    socket.on("chatMessage", async ({ conversationId, message, to }) => {
      try {
        if (!message || !message.trim()) {
          socket.emit("error", { code: "VALIDATION_ERROR", message: "Message cannot be empty" });
          return;
        }

        const userId = socket.user.id;
        const userRole = socket.user.role;
        let conversation;
        let client = null;

        if (conversationId) {
          // Existing conversation
          conversation = await Conversation.findOne({
            where: { id: conversationId, isActive: true },
            include: [
              { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
              { model: User, as: 'agency', attributes: ['id', 'email', 'firstName', 'lastName'] }
            ]
          });

          if (!conversation) {
            socket.emit("error", { code: "NOT_FOUND", message: "Conversation not found" });
            return;
          }

          // Check access
          let hasAccess = false;
          if (userRole === 'admin') {
            hasAccess = conversation.agencyId === userId;
          } else {
            client = await Client.findOne({
              where: { email: socket.user.email }
            });
            hasAccess = client && conversation.clientId === client.id;
          }

          if (!hasAccess) {
            socket.emit("error", { code: "FORBIDDEN", message: "Access denied" });
            return;
          }
        } else {
          // New conversation - only clients can start new conversations
          if (userRole === 'admin') {
            socket.emit("error", { code: "VALIDATION_ERROR", message: "Admins must specify conversationId" });
            return;
          }

          // Find client record, or create one if it doesn't exist
          client = await Client.findOne({
            where: { email: socket.user.email }
          });

          if (!client) {
            // Create a basic client record using user information
            const userRecord = await User.findByPk(socket.user.id);
            if (!userRecord) {
              socket.emit("error", { code: "NOT_FOUND", message: "User not found" });
              return;
            }

            client = await Client.create({
              name: `${userRecord.firstName || ''} ${userRecord.lastName || ''}`.trim() || socket.user.email.split('@')[0],
              email: socket.user.email,
              company: userRecord.company || '',
              country: userRecord.country || 'Unknown',
              phone: userRecord.phone || '',
              contactPerson: userRecord.firstName || '',
              status: 'active'
            });
          }

          // Find admin user
          const adminUser = await User.findOne({
            where: { role: 'admin' }
          });

          if (!adminUser) {
            socket.emit("error", { code: "NOT_FOUND", message: "Admin not found" });
            return;
          }

          // Check if conversation already exists
          conversation = await Conversation.findOne({
            where: {
              clientId: client.id,
              agencyId: adminUser.id,
              isActive: true
            },
            include: [
              { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
              { model: User, as: 'agency', attributes: ['id', 'email', 'firstName', 'lastName'] }
            ]
          });

          if (!conversation) {
            // Create new conversation
            conversation = await Conversation.create({
              clientId: client.id,
              agencyId: adminUser.id,
              lastMessage: message.trim(),
              lastMessageTime: new Date(),
              unreadCount: 1,
              isActive: true
            });
            
            // Load associations
            await conversation.reload({
              include: [
                { model: Client, as: 'client', attributes: ['id', 'name', 'email'] },
                { model: User, as: 'agency', attributes: ['id', 'email', 'firstName', 'lastName'] }
              ]
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
          unreadCount: conversation.unreadCount + 1
        });

        // Get sender info
        const senderName = userRole === 'admin' 
          ? `${conversation.agency.firstName || ''} ${conversation.agency.lastName || ''}`.trim() || 'Admin'
          : conversation.client?.name || 'Client';

        // Prepare base message data
        const baseMessageData = {
          id: newMessage.id,
          conversationId: conversation.id,
          senderId: userId,
          senderName: senderName,
          senderType: senderType,
          content: newMessage.content,
          timestamp: newMessage.createdAt.toISOString(),
          isRead: false
        };

        // Emit to sender (confirmation) - sender is 'me'
        const senderMessageData = { ...baseMessageData, sender: 'me' };
        socket.emit("messageReceived", senderMessageData);

        // Emit to receiver room - sender is 'other'
        const receiverMessageData = { ...baseMessageData, sender: 'other' };
        const receiverUserId = userRole === 'admin' ? conversation.clientId : conversation.agencyId;
        io.to(`user_${receiverUserId}`).emit("chatMessage", receiverMessageData);

        // Also emit to all admin sockets if client sent message (for notification)
        if (userRole !== 'admin') {
          io.to('admin').emit("newMessage", {
            conversationId: conversation.id,
            clientId: conversation.clientId,
            clientName: conversation.client?.name,
            message: receiverMessageData
          });
        }

        // Clear typing indicator
        if (typingUsers.has(conversation.id)) {
          const typing = typingUsers.get(conversation.id);
          if (typing[userId]) {
            delete typing[userId];
            io.to(`conversation_${conversation.id}`).emit('typingStatus', {
              conversationId: conversation.id,
              userId: userId,
              isTyping: false
            });
          }
        }

      } catch (error) {
        console.error("❌ Error handling chat message:", error);
        socket.emit("error", { 
          code: "SERVER_ERROR", 
          message: "Failed to send message",
          details: error.message 
        });
      }
    });

    // Handle marking messages as read
    socket.on("markAsRead", async ({ conversationId }) => {
      try {
        const userId = socket.user.id;
        const userRole = socket.user.role;

        const conversation = await Conversation.findOne({
          where: { id: conversationId, isActive: true }
        });

        if (!conversation) {
          socket.emit("error", { code: "NOT_FOUND", message: "Conversation not found" });
          return;
        }

        // Check access
        let hasAccess = false;
        if (userRole === 'admin') {
          hasAccess = conversation.agencyId === userId;
        } else {
          const client = await Client.findOne({
            where: { email: socket.user.email }
          });
          hasAccess = client && conversation.clientId === client.id;
        }

        if (!hasAccess) {
          socket.emit("error", { code: "FORBIDDEN", message: "Access denied" });
          return;
        }

        // Mark messages as read
        const otherSenderType = userRole === 'admin' ? 'client' : 'agency';
        const updatedCount = await Message.update(
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

        // Notify the sender that their messages were read
        const otherUserId = userRole === 'admin' ? conversation.agencyId : conversation.clientId;
        io.to(`user_${otherUserId}`).emit("messagesRead", { 
          conversationId,
          readBy: userId,
          readAt: new Date().toISOString(),
          count: updatedCount[0]
        });

        // Confirm to requester
        socket.emit("messagesMarkedRead", {
          conversationId,
          count: updatedCount[0]
        });

      } catch (error) {
        console.error("❌ Error marking messages as read:", error);
        socket.emit("error", { 
          code: "SERVER_ERROR",
          message: "Failed to mark messages as read" 
        });
      }
    });

    // Handle typing indicator
    socket.on("typing", async ({ conversationId, isTyping }) => {
      try {
        const userId = socket.user.id;
        const userRole = socket.user.role;

        // Verify conversation access
        const conversation = await Conversation.findOne({
          where: { id: conversationId, isActive: true }
        });

        if (!conversation) return;

        // Check access
        let hasAccess = false;
        if (userRole === 'admin') {
          hasAccess = conversation.agencyId === userId;
        } else {
          const client = await Client.findOne({
            where: { email: socket.user.email }
          });
          hasAccess = client && conversation.clientId === client.id;
        }

        if (!hasAccess) return;

        // Update typing status
        if (!typingUsers.has(conversationId)) {
          typingUsers.set(conversationId, {});
        }

        const typing = typingUsers.get(conversationId);
        
        if (isTyping) {
          typing[userId] = Date.now();
        } else {
          delete typing[userId];
        }

        // Notify the other user
        const otherUserId = userRole === 'admin' ? conversation.clientId : conversation.agencyId;
        io.to(`user_${otherUserId}`).emit('typingStatus', {
          conversationId,
          userId,
          userName: socket.user.email,
          isTyping
        });

      } catch (error) {
        console.error("❌ Error handling typing indicator:", error);
      }
    });

    // Handle join conversation room (for real-time updates)
    socket.on("joinConversation", async ({ conversationId }) => {
      try {
        const userId = socket.user.id;
        const userRole = socket.user.role;

        const conversation = await Conversation.findOne({
          where: { id: conversationId, isActive: true }
        });

        if (!conversation) {
          socket.emit("error", { code: "NOT_FOUND", message: "Conversation not found" });
          return;
        }

        // Check access
        let hasAccess = false;
        if (userRole === 'admin') {
          hasAccess = conversation.agencyId === userId;
        } else {
          const client = await Client.findOne({
            where: { email: socket.user.email }
          });
          hasAccess = client && conversation.clientId === client.id;
        }

        if (!hasAccess) {
          socket.emit("error", { code: "FORBIDDEN", message: "Access denied" });
          return;
        }

        socket.join(`conversation_${conversationId}`);
        socket.emit("joinedConversation", { conversationId });

      } catch (error) {
        console.error("❌ Error joining conversation:", error);
      }
    });

    // Handle leave conversation room
    socket.on("leaveConversation", ({ conversationId }) => {
      socket.leave(`conversation_${conversationId}`);
      socket.emit("leftConversation", { conversationId });
    });

    // Handle request for online users
    socket.on("getOnlineUsers", () => {
      const onlineUsersList = Array.from(onlineUsers.entries()).map(([id, data]) => ({
        userId: id,
        email: data.email,
        role: data.role,
        lastSeen: data.lastSeen
      }));
      socket.emit('onlineUsers', onlineUsersList);
    });

    // Handle disconnect
    socket.on("disconnect", () => {
      console.log("❌ User disconnected:", socket.user.email, `(ID: ${userId})`);
      
      // Remove from online users
      onlineUsers.delete(userId);

      // Clean up typing indicators
      for (const [conversationId, typing] of typingUsers.entries()) {
        if (typing[userId]) {
          delete typing[userId];
          io.to(`conversation_${conversationId}`).emit('typingStatus', {
            conversationId,
            userId,
            isTyping: false
          });
        }
      }

      // Emit user offline status to all admin users
      io.to('admin').emit('userOffline', {
        userId: userId,
        email: socket.user.email,
        role: userRole,
        timestamp: new Date().toISOString()
      });
    });
  });

  // Clean up old typing indicators every 10 seconds
  setInterval(() => {
    const now = Date.now();
    for (const [conversationId, typing] of typingUsers.entries()) {
      for (const [userId, timestamp] of Object.entries(typing)) {
        if (now - timestamp > 10000) { // 10 seconds
          delete typing[userId];
          io.to(`conversation_${conversationId}`).emit('typingStatus', {
            conversationId,
            userId: parseInt(userId),
            isTyping: false
          });
        }
      }
    }
  }, 10000);

  return io;
}

module.exports = setupSockets;


