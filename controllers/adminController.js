const User = require('../models/User');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Milestone = require('../models/Milestone');
const Requirement = require('../models/Requirement');
const Document = require('../models/Document');
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const logger = require('../utils/logger');
const path = require('path');
const fs = require('fs');

// Get all users except admin users
exports.getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: {
        role: 'user' // Only fetch users with role 'user', excluding admin
      },
      attributes: {
        exclude: ['password'] // Don't return password field
      },
      order: [['createdAt', 'DESC']] // Order by newest first
    });

    res.json({
      success: true,
      count: users.length,
      data: users
    });

    logger.info(`Admin fetched ${users.length} users`);
  } catch (error) {
    logger.error('Error fetching users:', error);
    next(error);
  }
};

// Get user by ID (excluding admin users)
exports.getUserById = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findOne({
      where: {
        id: id,
        role: 'user' // Only allow fetching non-admin users
      },
      attributes: {
        exclude: ['password']
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user
    });

    logger.info(`Admin fetched user ID: ${id}`);
  } catch (error) {
    logger.error('Error fetching user by ID:', error);
    next(error);
  }
};

// Update user status or information (excluding admin users)
exports.updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    // Remove sensitive fields that shouldn't be updated via admin
    delete updateData.password;
    delete updateData.role;
    delete updateData.id;

    const user = await User.findOne({
      where: {
        id: id,
        role: 'user' // Only allow updating non-admin users
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.update(updateData);

    // Return updated user without password
    const updatedUser = await User.findByPk(id, {
      attributes: {
        exclude: ['password']
      }
    });

    res.json({
      success: true,
      message: 'User updated successfully',
      data: updatedUser
    });

    logger.info(`Admin updated user ID: ${id}`);
  } catch (error) {
    logger.error('Error updating user:', error);
    next(error);
  }
};

// Delete user (excluding admin users)
exports.deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    
    const user = await User.findOne({
      where: {
        id: id,
        role: 'user' // Only allow deleting non-admin users
      }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    await user.destroy();

    res.json({
      success: true,
      message: 'User deleted successfully'
    });

    logger.info(`Admin deleted user ID: ${id}`);
  } catch (error) {
    logger.error('Error deleting user:', error);
    next(error);
  }
};

// Get admin dashboard statistics
exports.getDashboardStats = async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    const sequelize = require('../config/database');

    // User Statistics
    const totalUsers = await User.count({
      where: { role: 'user' }
    });

    const onboardedUsers = await User.count({
      where: { 
        role: 'user',
        isOnboardingCompleted: true 
      }
    });

    const pendingUsers = await User.count({
      where: { 
        role: 'user',
        isOnboardingCompleted: false 
      }
    });

    // Get recent users (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentUsers = await User.count({
      where: {
        role: 'user',
        createdAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    // Project Statistics
    const totalProjects = await Project.count();
    const activeProjects = await Project.count({ where: { status: 'active' } });
    const completedProjects = await Project.count({ where: { status: 'completed' } });
    const pendingProjects = await Project.count({ where: { status: 'pending' } });
    const cancelledProjects = await Project.count({ where: { status: 'cancelled' } });

    // Client Statistics
    const totalClients = await Client.count();
    const activeClients = await Client.count({ where: { status: 'active' } });

    // Revenue Statistics (from milestones)
    const totalRevenue = await Milestone.sum('amount') || 0;
    const completedMilestones = await Milestone.count({ where: { status: 'completed' } });
    const pendingMilestones = await Milestone.count({ where: { status: 'pending' } });
    const overdueMilestones = await Milestone.count({ where: { status: 'overdue' } });

    // Recent Activity - Get projects by status change date
    const recentProjects = await Project.count({
      where: {
        updatedAt: {
          [Op.gte]: sevenDaysAgo
        }
      }
    });

    // Documents Statistics
    const totalDocuments = await Document.count();
    const approvedDocuments = await Document.count({ where: { status: 'approved' } });
    const pendingDocuments = await Document.count({ where: { status: 'draft' } });

    // Chat Statistics
    const totalConversations = await Conversation.count({ where: { isActive: true } });
    const unreadMessages = await Conversation.sum('unreadCount') || 0;

    // Monthly Growth Data (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyProjects = await Project.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        createdAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
      raw: true
    });

    const monthlyUsers = await User.findAll({
      attributes: [
        [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m'), 'month'],
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      where: {
        role: 'user',
        createdAt: {
          [Op.gte]: sixMonthsAgo
        }
      },
      group: [sequelize.fn('DATE_FORMAT', sequelize.col('createdAt'), '%Y-%m')],
      raw: true
    });

    // Project Status Distribution
    const projectsByStatus = await Project.findAll({
      attributes: [
        'status',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['status'],
      raw: true
    });

    // Top Clients by Project Count
    const topClients = await Client.findAll({
      attributes: [
        'id',
        'name',
        'company',
        [sequelize.literal('(SELECT COUNT(*) FROM Projects WHERE Projects.clientId = Client.id)'), 'projectCount']
      ],
      order: [[sequelize.literal('projectCount'), 'DESC']],
      limit: 5,
      raw: true
    });

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          onboarded: onboardedUsers,
          pending: pendingUsers,
          recent: recentUsers
        },
        projects: {
          total: totalProjects,
          active: activeProjects,
          completed: completedProjects,
          pending: pendingProjects,
          cancelled: cancelledProjects,
          recent: recentProjects
        },
        clients: {
          total: totalClients,
          active: activeClients,
          topClients: topClients
        },
        finance: {
          totalRevenue: parseFloat(totalRevenue).toFixed(2),
          completedMilestones: completedMilestones,
          pendingMilestones: pendingMilestones,
          overdueMilestones: overdueMilestones
        },
        documents: {
          total: totalDocuments,
          approved: approvedDocuments,
          pending: pendingDocuments
        },
        chat: {
          totalConversations: totalConversations,
          unreadMessages: unreadMessages
        },
        trends: {
          monthlyProjects: monthlyProjects,
          monthlyUsers: monthlyUsers,
          projectsByStatus: projectsByStatus
        }
      }
    });

    logger.info('Admin fetched dashboard statistics');
  } catch (error) {
    logger.error('Error fetching dashboard stats:', error);
    next(error);
  }
};

// Get all projects with associated user and client information
exports.getAllProjects = async (req, res, next) => {
  try {
    const projects = await Project.findAll({
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          where: { role: 'user' }, // Only include projects from regular users
          required: true
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'company']
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: projects.length,
      data: projects
    });

    logger.info(`Admin fetched ${projects.length} projects`);
  } catch (error) {
    logger.error('Error fetching projects:', error);
    next(error);
  }
};

// Get all clients
exports.getAllClients = async (req, res, next) => {
  try {
    const clients = await Client.findAll({
      include: [
        {
          model: Project,
          as: 'projects',
          attributes: ['id', 'title', 'status'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: clients.length,
      data: clients
    });

    logger.info(`Admin fetched ${clients.length} clients`);
  } catch (error) {
    logger.error('Error fetching clients:', error);
    next(error);
  }
};

// Get all milestones with associated project information
exports.getAllMilestones = async (req, res, next) => {
  try {
    
    const milestones = await Milestone.findAll({
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'firstName', 'lastName'],
              where: { role: 'user' },
              required: true
            }
          ],
          required: true
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: milestones.length,
      data: milestones
    });

    logger.info(`Admin fetched ${milestones.length} milestones`);
  } catch (error) {
    logger.error('Error fetching milestones:', error);
    next(error);
  }
};

// Get all requirements with associated project information
exports.getAllRequirements = async (req, res, next) => {
  try {
    const requirements = await Requirement.findAll({
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status', 'category'],
          include: [
            {
              model: User,
              as: 'user',
              attributes: ['id', 'email', 'firstName', 'lastName'],
              where: { role: 'user' },
              required: true
            }
          ],
          required: true
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: requirements.length,
      data: requirements
    });

    logger.info(`Admin fetched ${requirements.length} requirements`);
  } catch (error) {
    logger.error('Error fetching requirements:', error);
    next(error);
  }
};

// Edit Project
exports.editProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via API
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const project = await Project.findOne({
      where: { id, userId: { [require('sequelize').Op.ne]: null } }, // Ensure it's not admin's project
      include: [{ model: User, attributes: ['id', 'email', 'firstName', 'lastName'] }]
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found or belongs to admin' });
    }

    await project.update(updateData);

    // Fetch updated project with associations
    const updatedProject = await Project.findByPk(id, {
      include: [
        { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Client, attributes: ['id', 'name', 'email', 'company'] }
      ]
    });

    res.json({
      success: true,
      message: 'Project updated successfully',
      data: updatedProject
    });
  } catch (error) {
    logger.error('Error updating project:', error);
    res.status(500).json({ success: false, error: 'Failed to update project' });
  }
};

// Edit Client
exports.editClient = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({ success: false, error: 'Client not found' });
    }

    await client.update(updateData);

    // Fetch updated client with projects
    const updatedClient = await Client.findByPk(id, {
      include: [{
        model: Project,
        include: [{ model: User, attributes: ['id', 'email', 'firstName', 'lastName'] }]
      }]
    });

    res.json({
      success: true,
      message: 'Client updated successfully',
      data: updatedClient
    });
  } catch (error) {
    logger.error('Error updating client:', error);
    res.status(500).json({ success: false, error: 'Failed to update client' });
  }
};

// Edit Milestone
exports.editMilestone = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const milestone = await Milestone.findOne({
      where: { id },
      include: [
        {
          model: Project,
          where: { userId: { [require('sequelize').Op.ne]: null } }, // Ensure project belongs to regular user
          include: [{ model: User, attributes: ['id', 'email', 'firstName', 'lastName'] }]
        }
      ]
    });

    if (!milestone) {
      return res.status(404).json({ success: false, error: 'Milestone not found or belongs to admin project' });
    }

    await milestone.update(updateData);

    // Fetch updated milestone with associations
    const updatedMilestone = await Milestone.findByPk(id, {
      include: [{
        model: Project,
        include: [
          { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
          { model: Client, attributes: ['id', 'name', 'email', 'company'] }
        ]
      }]
    });

    res.json({
      success: true,
      message: 'Milestone updated successfully',
      data: updatedMilestone
    });
  } catch (error) {
    logger.error('Error updating milestone:', error);
    res.status(500).json({ success: false, error: 'Failed to update milestone' });
  }
};

// Edit Requirement
exports.editRequirement = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Remove sensitive fields
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    const requirement = await Requirement.findOne({
      where: { id },
      include: [
        {
          model: Project,
          where: { userId: { [require('sequelize').Op.ne]: null } }, // Ensure project belongs to regular user
          include: [{ model: User, attributes: ['id', 'email', 'firstName', 'lastName'] }]
        }
      ]
    });

    if (!requirement) {
      return res.status(404).json({ success: false, error: 'Requirement not found or belongs to admin project' });
    }

    await requirement.update(updateData);

    // Fetch updated requirement with associations
    const updatedRequirement = await Requirement.findByPk(id, {
      include: [{
        model: Project,
        include: [
          { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
          { model: Client, attributes: ['id', 'name', 'email', 'company'] }
        ]
      }]
    });

    res.json({
      success: true,
      message: 'Requirement updated successfully',
      data: updatedRequirement
    });
  } catch (error) {
    logger.error('Error updating requirement:', error);
    res.status(500).json({ success: false, error: 'Failed to update requirement' });
  }
};

// Create a new project (admin can create for any user)
exports.createProject = async (req, res) => {
  try {
    const { userId, clientId, title, description, category, deadline, budget, priority } = req.body;

    // Validate required fields
    if (!userId || !title || !description || !category || !deadline) {
      return res.status(400).json({ success: false, error: 'userId, title, description, category, and deadline are required' });
    }

    // Verify user exists and is not admin
    const user = await User.findOne({ where: { id: userId, role: 'user' } });
    if (!user) {
      return res.status(404).json({ success: false, error: 'User not found or is admin' });
    }

    // If clientId provided, verify client exists
    if (clientId) {
      const client = await Client.findByPk(clientId);
      if (!client) {
        return res.status(404).json({ success: false, error: 'Client not found' });
      }
    }

    const project = await Project.create({
      userId,
      clientId,
      title,
      description,
      category,
      deadline,
      budget,
      priority: priority || 'medium',
      status: 'pending',
      progress: 0
    });

    // Fetch created project with associations
    const createdProject = await Project.findByPk(project.id, {
      include: [
        { model: User, attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: Client, attributes: ['id', 'name', 'email', 'company'] }
      ]
    });

    res.status(201).json({
      success: true,
      message: 'Project created successfully',
      data: createdProject
    });
  } catch (error) {
    logger.error('Error creating project:', error);
    res.status(500).json({ success: false, error: 'Failed to create project' });
  }
};

// Delete a project
exports.deleteProject = async (req, res) => {
  try {
    const { id } = req.params;

    const project = await Project.findOne({
      where: { id, userId: { [require('sequelize').Op.ne]: null } }, // Ensure not admin's project
      include: [{ model: User, attributes: ['id', 'email'] }]
    });

    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found or belongs to admin' });
    }

    await project.destroy();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting project:', error);
    res.status(500).json({ success: false, error: 'Failed to delete project' });
  }
};

// Get all conversations (admin sees all)
exports.getAllConversations = async (req, res) => {
  try {
    const conversations = await Conversation.findAll({
      where: { isActive: true },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'company']
        },
        {
          model: User,
          as: 'agency',
          attributes: ['id', 'email', 'firstName', 'lastName']
        }
      ],
      order: [['lastMessageTime', 'DESC']]
    });

    const formattedConversations = conversations.map(c => ({
      id: c.id,
      client: c.client?.name || 'Unknown',
      company: c.client?.company || '',
      agency: `${c.agency?.firstName || ''} ${c.agency?.lastName || ''}`.trim() || c.agency?.email || 'Unknown',
      lastMessage: c.lastMessage || '',
      time: c.lastMessageTime?.toISOString() || c.updatedAt.toISOString(),
      unread: c.unreadCount || 0
    }));

    res.json({ success: true, data: formattedConversations });
  } catch (error) {
    logger.error('Error fetching conversations:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch conversations' });
  }
};

// Get messages for a specific conversation (admin access)
exports.getConversationMessages = async (req, res) => {
  try {
    const { conversationId } = req.params;

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
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
      sender: m.senderType === 'agency' ? (m.sender?.firstName ? `${m.sender.firstName} ${m.sender.lastName}` : m.sender?.email) : 'Client',
      senderType: m.senderType,
      message: m.content,
      time: m.createdAt.toISOString(),
      isRead: m.isRead
    }));

    res.json({ success: true, data: formattedMessages });
  } catch (error) {
    logger.error('Error fetching messages:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
};

// Send a message as admin in a conversation
exports.sendMessageAsAdmin = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { message } = req.body;
    const adminId = req.user.id;

    if (!message || !message.trim()) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const conversation = await Conversation.findByPk(conversationId);
    if (!conversation) {
      return res.status(404).json({ success: false, error: 'Conversation not found' });
    }

    // Determine receiver based on sender type (admin sending as agency)
    const receiverId = conversation.clientId;
    const senderType = 'agency';

    const newMessage = await Message.create({
      conversationId,
      senderId: adminId,
      receiverId,
      senderType,
      content: message.trim(),
      isRead: false
    });

    // Update conversation's last message
    await conversation.update({
      lastMessage: message.trim(),
      lastMessageTime: new Date(),
      unreadCount: conversation.unreadCount + 1
    });

    res.json({
      success: true,
      data: {
        id: newMessage.id,
        sender: 'Admin',
        senderType,
        message: newMessage.content,
        time: newMessage.createdAt.toISOString()
      }
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    res.status(500).json({ success: false, error: 'Failed to send message' });
  }
};

// Get all documents (admin view)
exports.getAllDocuments = async (req, res) => {
  try {
    const documents = await Document.findAll({
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title'],
          include: [
            { model: User, as: 'user', attributes: ['id', 'email', 'firstName', 'lastName'] },
            { model: Client, as: 'client', attributes: ['id', 'name'] }
          ]
        },
        { model: User, as: 'uploader', attributes: ['id', 'email', 'firstName', 'lastName'] },
        { model: User, as: 'approver', attributes: ['id', 'email', 'firstName', 'lastName'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedDocuments = documents.map(d => ({
      id: d.id,
      name: d.name,
      originalName: d.originalName,
      type: path.extname(d.originalName).slice(1).toUpperCase(),
      size: formatFileSize(d.fileSize),
      project: d.project?.title || 'Unknown',
      user: d.project?.user ? `${d.project.user.firstName || ''} ${d.project.user.lastName || ''}`.trim() || d.project.user.email : 'Unknown',
      client: d.project?.client?.name || 'Unknown',
      uploader: d.uploader ? `${d.uploader.firstName || ''} ${d.uploader.lastName || ''}`.trim() || d.uploader.email : 'Unknown',
      uploadDate: d.createdAt.toISOString().split('T')[0],
      status: d.status,
      approvedBy: d.approver ? `${d.approver.firstName || ''} ${d.approver.lastName || ''}`.trim() || d.approver.email : null,
      approvedAt: d.approvedAt?.toISOString()
    }));

    res.json({ success: true, data: formattedDocuments });
  } catch (error) {
    logger.error('Error fetching documents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch documents' });
  }
};

// Upload document as admin (can upload to any project)
exports.uploadDocument = async (req, res) => {
  try {
    const { projectId } = req.params;
    const adminId = req.user.id;

    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }

    const { filename, originalname, mimetype, size } = req.file;

    const document = await Document.create({
      projectId,
      name: originalname,
      originalName: originalname,
      filePath: `/uploads/${filename}`,
      fileSize: size,
      mimeType: mimetype,
      status: 'draft',
      uploadedBy: adminId
    });

    res.status(201).json({
      success: true,
      data: {
        id: document.id,
        name: document.name,
        type: path.extname(document.originalName).slice(1).toUpperCase(),
        size: formatFileSize(document.fileSize),
        uploadDate: document.createdAt.toISOString().split('T')[0],
        status: document.status
      }
    });
  } catch (error) {
    logger.error('Error uploading document:', error);
    res.status(500).json({ success: false, error: 'Failed to upload document' });
  }
};

// Update document status as admin
exports.updateDocumentStatus = async (req, res) => {
  try {
    const { documentId } = req.params;
    const { status } = req.body;
    const adminId = req.user.id;

    const validStatuses = ['draft', 'under-review', 'approved', 'signed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    const updateData = { status };
    if (status === 'approved') {
      updateData.approvedBy = adminId;
      updateData.approvedAt = new Date();
    }

    await document.update(updateData);

    res.json({
      success: true,
      data: {
        id: document.id,
        status: document.status,
        approvedAt: document.approvedAt
      }
    });
  } catch (error) {
    logger.error('Error updating document status:', error);
    res.status(500).json({ success: false, error: 'Failed to update document status' });
  }
};

// Delete document as admin
exports.deleteDocument = async (req, res) => {
  try {
    const { documentId } = req.params;

    const document = await Document.findByPk(documentId);
    if (!document) {
      return res.status(404).json({ success: false, error: 'Document not found' });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await document.destroy();

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    logger.error('Error deleting document:', error);
    res.status(500).json({ success: false, error: 'Failed to delete document' });
  }
};

// Helper function to format file size
function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// Get detailed project analytics
exports.getProjectAnalytics = async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    const sequelize = require('../config/database');

    // Project completion rate
    const totalProjects = await Project.count();
    const completedCount = await Project.count({ where: { status: 'completed' } });
    const completionRate = totalProjects > 0 ? ((completedCount / totalProjects) * 100).toFixed(2) : 0;

    // Average project duration (for completed projects)
    const completedProjects = await Project.findAll({
      where: { status: 'completed' },
      attributes: ['createdAt', 'updatedAt']
    });

    let avgDuration = 0;
    if (completedProjects.length > 0) {
      const totalDays = completedProjects.reduce((sum, p) => {
        const days = Math.floor((new Date(p.updatedAt) - new Date(p.createdAt)) / (1000 * 60 * 60 * 24));
        return sum + days;
      }, 0);
      avgDuration = Math.round(totalDays / completedProjects.length);
    }

    // Projects by category
    const projectsByCategory = await Project.findAll({
      attributes: [
        'category',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['category'],
      raw: true
    });

    // Projects by priority
    const projectsByPriority = await Project.findAll({
      attributes: [
        'priority',
        [sequelize.fn('COUNT', sequelize.col('id')), 'count']
      ],
      group: ['priority'],
      raw: true
    });

    // Overdue projects (deadline passed but not completed)
    const overdueProjects = await Project.count({
      where: {
        deadline: {
          [Op.lt]: new Date()
        },
        status: {
          [Op.notIn]: ['completed', 'cancelled']
        }
      }
    });

    // Projects with low progress (<30%) that are active
    const atRiskProjects = await Project.count({
      where: {
        progress: {
          [Op.lt]: 30
        },
        status: 'active'
      }
    });

    // Budget utilization
    const totalBudget = await Project.sum('budget') || 0;
    const totalSpent = await Milestone.sum('amount') || 0;
    const budgetUtilization = totalBudget > 0 ? ((totalSpent / totalBudget) * 100).toFixed(2) : 0;

    res.json({
      success: true,
      data: {
        completionRate: parseFloat(completionRate),
        averageProjectDuration: avgDuration,
        projectsByCategory: projectsByCategory,
        projectsByPriority: projectsByPriority,
        overdueProjects: overdueProjects,
        atRiskProjects: atRiskProjects,
        budget: {
          total: parseFloat(totalBudget).toFixed(2),
          spent: parseFloat(totalSpent).toFixed(2),
          utilization: parseFloat(budgetUtilization)
        }
      }
    });

    logger.info('Admin fetched project analytics');
  } catch (error) {
    logger.error('Error fetching project analytics:', error);
    next(error);
  }
};

// Get project by ID with full details
exports.getProjectById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const project = await Project.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName', 'company']
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'company', 'phone', 'country']
        },
        {
          model: Milestone,
          as: 'milestones',
          order: [['order', 'ASC']]
        },
        {
          model: Requirement,
          as: 'requirement'
        },
        {
          model: Document,
          as: 'documents',
          include: [
            { model: User, as: 'uploader', attributes: ['id', 'firstName', 'lastName', 'email'] }
          ]
        }
      ]
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    res.json({
      success: true,
      data: project
    });

    logger.info(`Admin fetched project ID: ${id}`);
  } catch (error) {
    logger.error('Error fetching project by ID:', error);
    next(error);
  }
};

// Create milestone for a project
exports.createMilestone = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { title, deliverable, deadline, amount, order } = req.body;

    // Validate required fields
    if (!title || !deliverable || !deadline || !amount || order === undefined) {
      return res.status(400).json({
        success: false,
        error: 'All fields are required: title, deliverable, deadline, amount, order'
      });
    }

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const milestone = await Milestone.create({
      projectId,
      title,
      deliverable,
      deadline,
      amount,
      order,
      status: 'pending'
    });

    res.status(201).json({
      success: true,
      message: 'Milestone created successfully',
      data: milestone
    });

    logger.info(`Admin created milestone for project ID: ${projectId}`);
  } catch (error) {
    logger.error('Error creating milestone:', error);
    next(error);
  }
};

// Delete milestone
exports.deleteMilestone = async (req, res, next) => {
  try {
    const { id } = req.params;

    const milestone = await Milestone.findByPk(id);
    if (!milestone) {
      return res.status(404).json({
        success: false,
        error: 'Milestone not found'
      });
    }

    await milestone.destroy();

    res.json({
      success: true,
      message: 'Milestone deleted successfully'
    });

    logger.info(`Admin deleted milestone ID: ${id}`);
  } catch (error) {
    logger.error('Error deleting milestone:', error);
    next(error);
  }
};

// Create requirement for a project
exports.createRequirement = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { notes, files } = req.body;

    // Verify project exists
    const project = await Project.findByPk(projectId);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    const requirement = await Requirement.create({
      projectId,
      notes: notes || '',
      files: files || []
    });

    res.status(201).json({
      success: true,
      message: 'Requirement created successfully',
      data: requirement
    });

    logger.info(`Admin created requirement for project ID: ${projectId}`);
  } catch (error) {
    logger.error('Error creating requirement:', error);
    next(error);
  }
};

// Delete requirement
exports.deleteRequirement = async (req, res, next) => {
  try {
    const { id } = req.params;

    const requirement = await Requirement.findByPk(id);
    if (!requirement) {
      return res.status(404).json({
        success: false,
        error: 'Requirement not found'
      });
    }

    await requirement.destroy();

    res.json({
      success: true,
      message: 'Requirement deleted successfully'
    });

    logger.info(`Admin deleted requirement ID: ${id}`);
  } catch (error) {
    logger.error('Error deleting requirement:', error);
    next(error);
  }
};

// Create a new client
exports.createClient = async (req, res, next) => {
  try {
    const { name, email, company, country, phone, contactPerson } = req.body;

    // Validate required fields
    if (!name || !email || !country) {
      return res.status(400).json({
        success: false,
        error: 'Name, email, and country are required'
      });
    }

    const client = await Client.create({
      name,
      email,
      company,
      country,
      phone,
      contactPerson,
      status: 'active'
    });

    res.status(201).json({
      success: true,
      message: 'Client created successfully',
      data: client
    });

    logger.info(`Admin created client: ${name}`);
  } catch (error) {
    logger.error('Error creating client:', error);
    next(error);
  }
};

// Delete client
exports.deleteClient = async (req, res, next) => {
  try {
    const { id } = req.params;

    const client = await Client.findByPk(id);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: 'Client not found'
      });
    }

    // Check if client has associated projects
    const projectCount = await Project.count({ where: { clientId: id } });
    if (projectCount > 0) {
      return res.status(400).json({
        success: false,
        error: `Cannot delete client with ${projectCount} associated projects. Please reassign or delete projects first.`
      });
    }

    await client.destroy();

    res.json({
      success: true,
      message: 'Client deleted successfully'
    });

    logger.info(`Admin deleted client ID: ${id}`);
  } catch (error) {
    logger.error('Error deleting client:', error);
    next(error);
  }
};

// Update project status
exports.updateProjectStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const project = await Project.findByPk(id);
    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found'
      });
    }

    await project.update({ status });

    res.json({
      success: true,
      message: 'Project status updated successfully',
      data: { id: project.id, status: project.status }
    });

    logger.info(`Admin updated project ${id} status to: ${status}`);
  } catch (error) {
    logger.error('Error updating project status:', error);
    next(error);
  }
};

// Bulk update project statuses
exports.bulkUpdateProjects = async (req, res, next) => {
  try {
    const { projectIds, status } = req.body;

    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'projectIds must be a non-empty array'
      });
    }

    const validStatuses = ['pending', 'active', 'completed', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}`
      });
    }

    const { Op } = require('sequelize');
    const updateData = {};
    if (status) updateData.status = status;

    const [updatedCount] = await Project.update(updateData, {
      where: {
        id: {
          [Op.in]: projectIds
        }
      }
    });

    res.json({
      success: true,
      message: `Successfully updated ${updatedCount} projects`,
      data: { updatedCount }
    });

    logger.info(`Admin bulk updated ${updatedCount} projects`);
  } catch (error) {
    logger.error('Error bulk updating projects:', error);
    next(error);
  }
};

// Search and filter functionality
exports.searchProjects = async (req, res, next) => {
  try {
    const { Op } = require('sequelize');
    const { 
      query, 
      status, 
      category, 
      priority, 
      clientId,
      minBudget,
      maxBudget,
      startDate,
      endDate,
      page = 1,
      limit = 10
    } = req.query;

    const whereClause = {};
    
    if (query) {
      whereClause[Op.or] = [
        { title: { [Op.like]: `%${query}%` } },
        { description: { [Op.like]: `%${query}%` } }
      ];
    }
    
    if (status) whereClause.status = status;
    if (category) whereClause.category = category;
    if (priority) whereClause.priority = priority;
    if (clientId) whereClause.clientId = clientId;
    
    if (minBudget || maxBudget) {
      whereClause.budget = {};
      if (minBudget) whereClause.budget[Op.gte] = minBudget;
      if (maxBudget) whereClause.budget[Op.lte] = maxBudget;
    }
    
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt[Op.gte] = new Date(startDate);
      if (endDate) whereClause.createdAt[Op.lte] = new Date(endDate);
    }

    const offset = (parseInt(page) - 1) * parseInt(limit);

    const { count, rows } = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        },
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'company']
        }
      ],
      limit: parseInt(limit),
      offset: offset,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: {
        projects: rows,
        pagination: {
          total: count,
          page: parseInt(page),
          limit: parseInt(limit),
          totalPages: Math.ceil(count / parseInt(limit))
        }
      }
    });

    logger.info(`Admin searched projects with filters`);
  } catch (error) {
    logger.error('Error searching projects:', error);
    next(error);
  }
};