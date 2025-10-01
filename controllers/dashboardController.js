const { Project, Client, Message, User, Conversation, Milestone } = require('../models/associations');
const { Op } = require('sequelize');

// Get dashboard statistics
exports.getStats = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Total projects (all projects for this user)
    const totalProjects = await Project.count({
      where: { userId }
    });

    // Active projects (status: 'active')
    const activeProjects = await Project.count({
      where: { userId, status: 'active' }
    });

    // Completed projects (status: 'completed')
    const completedProjects = await Project.count({
      where: { userId, status: 'completed' }
    });

    // Total clients (unique clients from projects)
    const totalClients = await Project.count({
      where: { userId },
      include: [{
        model: Client,
        as: 'client',
        required: true
      }],
      distinct: true,
      col: 'clientId'
    });

    // Total spent (sum of milestone amounts for all projects)
    const totalSpentResult = await Milestone.sum('amount', {
      include: [{
        model: Project,
        as: 'project',
        where: { userId },
        required: true
      }]
    });
    const totalSpent = totalSpentResult ? `$${totalSpentResult.toFixed(2)}` : '$0.00';

    res.json({
      success: true,
      data: {
        totalProjects,
        activeProjects,
        completedProjects,
        totalSpent
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get recent projects
exports.getRecentProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 3;

    const projects = await Project.findAll({
      where: { userId },
      order: [['updatedAt', 'DESC']],
      limit,
      include: [{
        model: Client,
        as: 'client',
        attributes: ['name']
      }]
    });

    const recentProjects = projects.map(p => ({
      id: p.id,
      name: p.title,
      client: p.client?.name || 'Unknown',
      status: p.status,
      progress: p.progress || 0
    }));

    res.json({ success: true, data: recentProjects });
  } catch (error) {
    next(error);
  }
};

// Get recent messages
exports.getRecentMessages = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 3;

    // Get recent conversations with last message
    const conversations = await Conversation.findAll({
      where: { agencyId: userId },
      order: [['lastMessageTime', 'DESC']],
      limit,
      include: [{
        model: Client,
        as: 'client',
        attributes: ['name', 'company']
      }]
    });

    const recentMessages = conversations.map(c => ({
      id: c.id,
      client: c.client?.name || 'Unknown',
      company: c.client?.company || '',
      lastMessage: c.lastMessage || '',
      time: c.lastMessageTime?.toISOString() || c.updatedAt.toISOString(),
      unread: c.unreadCount || 0
    }));

    res.json({ success: true, data: recentMessages });
  } catch (error) {
    next(error);
  }
};