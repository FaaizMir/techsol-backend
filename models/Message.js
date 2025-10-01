const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  content: { type: DataTypes.TEXT, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  receiverId: { type: DataTypes.INTEGER, allowNull: false },
  conversationId: { type: DataTypes.INTEGER, allowNull: false },
  senderType: { type: DataTypes.ENUM('client', 'agency'), allowNull: false },
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  readAt: { type: DataTypes.DATE, allowNull: true }
}, { timestamps: true });

module.exports = Message;
