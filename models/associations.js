const User = require('./User');
const Project = require('./Project');
const Requirement = require('./Requirement');
const Milestone = require('./Milestone');
const Client = require('./Client');
const OnboardingProgress = require('./OnboardingProgress');
const Conversation = require('./Conversation');
const Message = require('./Message');
const Document = require('./Document');

// User associations
User.hasMany(Project, { foreignKey: 'userId', as: 'projects' });
User.hasMany(OnboardingProgress, { foreignKey: 'userId', as: 'onboardingProgress' });
User.hasMany(Conversation, { foreignKey: 'agencyId', as: 'conversations' });
User.hasMany(Document, { foreignKey: 'uploadedBy', as: 'uploadedDocuments' });
User.hasMany(Document, { foreignKey: 'approvedBy', as: 'approvedDocuments' });

// Project associations
Project.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Project.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Project.hasOne(Requirement, { foreignKey: 'projectId', as: 'requirement' });
Project.hasMany(Milestone, { foreignKey: 'projectId', as: 'milestones' });
Project.hasMany(Document, { foreignKey: 'projectId', as: 'documents' });
Project.hasOne(OnboardingProgress, { foreignKey: 'projectId', as: 'onboardingProgress' });

// Client associations
Client.hasMany(Project, { foreignKey: 'clientId', as: 'projects' });
Client.hasMany(Conversation, { foreignKey: 'clientId', as: 'conversations' });

// Requirement associations
Requirement.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Milestone associations
Milestone.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// OnboardingProgress associations
OnboardingProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });
OnboardingProgress.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Conversation associations
Conversation.belongsTo(Client, { foreignKey: 'clientId', as: 'client' });
Conversation.belongsTo(User, { foreignKey: 'agencyId', as: 'agency' });
Conversation.hasMany(Message, { foreignKey: 'conversationId', as: 'messages' });

// Message associations
Message.belongsTo(Conversation, { foreignKey: 'conversationId', as: 'conversation' });
Message.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Message.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Document associations
Document.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });
Document.belongsTo(User, { foreignKey: 'uploadedBy', as: 'uploader' });
Document.belongsTo(User, { foreignKey: 'approvedBy', as: 'approver' });

module.exports = {
  User,
  Project,
  Requirement,
  Milestone,
  Client,
  OnboardingProgress,
  Conversation,
  Message,
  Document
};