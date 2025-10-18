const User = require('../models/User');
const Project = require('../models/Project');
const Client = require('../models/Client');
const Milestone = require('../models/Milestone');
const Requirement = require('../models/Requirement');
const ProposalDocument = require('../models/ProposalDocument');
const logger = require('../utils/logger');

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
          [require('sequelize').Op.gte]: sevenDaysAgo
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        onboardedUsers,
        pendingUsers,
        recentUsers
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

// Create a new proposal document
exports.createProposalDocument = async (req, res, next) => {
  try {
    const { userId, projectId, content } = req.body;

    // Validate required fields
    if (!userId || !projectId || !content) {
      return res.status(400).json({
        success: false,
        error: 'userId, projectId, and content are required'
      });
    }

    // Create the proposal document (allow multiple per user per project)
    const proposalDocument = await ProposalDocument.create({
      userId,
      projectId,
      content: content.trim()
    });

    res.status(201).json({
      success: true,
      message: 'Proposal document created successfully',
      data: proposalDocument
    });

  } catch (error) {
    console.error('Error creating proposal document:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get all proposal documents
exports.getAllProposalDocuments = async (req, res, next) => {
  try {
    const { userId, projectId } = req.query;

    const whereClause = {};
    if (userId) whereClause.userId = userId;
    if (projectId) whereClause.projectId = projectId;

    const proposalDocuments = await ProposalDocument.findAll({
      where: whereClause,
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      count: proposalDocuments.length,
      data: proposalDocuments
    });

  } catch (error) {
    console.error('Error fetching proposal documents:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

// Get proposal document by ID
exports.getProposalDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const proposalDocument = await ProposalDocument.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          where: { role: 'user' },
          required: true
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status', 'category', 'deadline', 'progress', 'budget'],
          required: true
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          required: false
        }
      ]
    });

    if (!proposalDocument) {
      return res.status(404).json({
        success: false,
        error: 'Proposal document not found'
      });
    }

    res.json({
      success: true,
      data: proposalDocument
    });

    logger.info(`Admin fetched proposal document ID: ${id}`);
  } catch (error) {
    logger.error('Error fetching proposal document by ID:', error);
    next(error);
  }
};

// Update proposal document status and review information
exports.updateProposalDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reviewNotes, reviewedBy } = req.body;

    const proposalDocument = await ProposalDocument.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status', 'category']
        }
      ]
    });

    if (!proposalDocument) {
      return res.status(404).json({
        success: false,
        error: 'Proposal document not found'
      });
    }

    const updateData = {};
    if (status) {
      updateData.status = status;
      if (status !== 'draft' && !proposalDocument.submittedAt) {
        updateData.submittedAt = new Date();
      }
    }

    if (reviewNotes !== undefined) updateData.reviewNotes = reviewNotes;
    if (reviewedBy) {
      updateData.reviewedBy = reviewedBy;
      updateData.reviewedAt = new Date();
    }

    await proposalDocument.update(updateData);

    // Fetch updated document
    const updatedDocument = await ProposalDocument.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'email', 'firstName', 'lastName']
        },
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status', 'category', 'deadline', 'progress']
        },
        {
          model: User,
          as: 'reviewer',
          attributes: ['id', 'email', 'firstName', 'lastName'],
          required: false
        }
      ]
    });

    res.json({
      success: true,
      message: 'Proposal document updated successfully',
      data: updatedDocument
    });

    logger.info(`Admin updated proposal document ID: ${id} with status: ${status}`);
  } catch (error) {
    logger.error('Error updating proposal document:', error);
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