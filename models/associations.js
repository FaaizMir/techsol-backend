const User = require('./User');
const Project = require('./Project');
const Requirement = require('./Requirement');
const Milestone = require('./Milestone');
const Client = require('./Client');
const OnboardingProgress = require('./OnboardingProgress');

// User associations
User.hasMany(Project, { foreignKey: 'userId', as: 'projects' });
User.hasMany(OnboardingProgress, { foreignKey: 'userId', as: 'onboardingProgress' });

// Project associations
Project.belongsTo(User, { foreignKey: 'userId', as: 'user' });
Project.hasOne(Requirement, { foreignKey: 'projectId', as: 'requirement' });
Project.hasMany(Milestone, { foreignKey: 'projectId', as: 'milestones' });
Project.hasOne(Client, { foreignKey: 'projectId', as: 'client' });
Project.hasOne(OnboardingProgress, { foreignKey: 'projectId', as: 'onboardingProgress' });

// Requirement associations
Requirement.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Milestone associations
Milestone.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// Client associations
Client.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

// OnboardingProgress associations
OnboardingProgress.belongsTo(User, { foreignKey: 'userId', as: 'user' });
OnboardingProgress.belongsTo(Project, { foreignKey: 'projectId', as: 'project' });

module.exports = {
  User,
  Project,
  Requirement,
  Milestone,
  Client,
  OnboardingProgress
};