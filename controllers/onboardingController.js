const { Project, Requirement, Milestone, Client, OnboardingProgress, User } = require('../models/associations');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');
// const Project = require('../models/Project');
// const Requirement = require('../models/Requirement');
// const Milestone = require('../models/Milestone');
// const Client = require('../models/Client');

// Helper function to update progress
const updateProgress = async (userId, projectId, step) => {
  let progress = await OnboardingProgress.findOne({ where: { userId, projectId } });
  if (!progress) {
    progress = await OnboardingProgress.create({ userId, projectId });
  }
  progress.currentStep = step;
  progress.completedSteps = [...new Set([...progress.completedSteps, step])];
  progress.lastUpdated = new Date();
  await progress.save();
  return progress;
};

// Start new onboarding
exports.startOnboarding = async (req, res, next) => {
  try {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'User ID is required' } });
    }

    // Check if user exists
    const user = await User.findByPk(userId);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'User not found' } });
    }

    // Just initialize progress - don't create draft project yet
    // Progress will be created when first step is saved
    res.json({
      success: true,
      data: {
        projectId: null, // Will be set when project details are saved
        currentStep: 0,
        message: 'Onboarding started successfully'
      }
    });
  } catch (error) {
    next(error);
  }
};

// Save project details (Step 1)
exports.saveProjectDetails = async (req, res, next) => {
  try {
    const { title, description, category, deadline } = req.body;
    const userId = req.user.id;

    if (!title || !description || !category || !deadline) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'All fields are required' } });
    }

    // Check if user already has a draft project
    let project = await Project.findOne({ where: { userId, status: 'draft' } });

    if (project) {
      // Update existing draft project
      await project.update({
        title,
        description,
        category,
        deadline: new Date(deadline)
      });
    } else {
      // Create new project
      project = await Project.create({
        title,
        description,
        category,
        deadline: new Date(deadline),
        status: "draft", // Start as draft
        userId,
      });
    }

    // Initialize or update progress tracking
    await updateProgress(userId, project.id, 1);

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          deadline: project.deadline,
          status: project.status
        },
        nextStep: 1
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: messages.join(', ') } });
    }
    next(error);
  }
};


// Save requirements & upload files (Step 2)
exports.saveRequirements = async (req, res, next) => {
  try {
    // 👇 take projectId from route param instead of body
    const { projectId } = req.params
    const { notes } = req.body
    const userId = req.user.id

    // check if project exists for this user
    const project = await Project.findOne({ where: { id: projectId, userId } })
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "Project not found" }
      })
    }

    // find existing requirements or create new
    let requirement = await Requirement.findOne({ where: { projectId } })
    const files = []

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        files.push({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`, // adjust if using cloud storage
          uploadedAt: new Date()
        })
      }
    }

    if (requirement) {
      await requirement.update({
        notes,
        files: [...requirement.files, ...files]
      })
    } else {
      requirement = await Requirement.create({
        projectId,
        notes,
        files
      })
    }

    await updateProgress(userId, projectId, 2)

    return res.json({
      success: true,
      data: {
        requirements: {
          id: requirement.id,
          notes: requirement.notes,
          files: requirement.files
        },
        nextStep: 2
      }
    })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ success: false, error: { code: "SERVER_ERROR", message: error.message } })
  }
}


// Save milestones (Step 3)
// const { Project, Milestone } = require("../models")

exports.saveMilestones = async (req, res, next) => {
  try {
    const { projectId } = req.params
    const userId = req.user.id
    const { milestones } = req.body  // expect array of milestones

    // check project belongs to user
    const project = await Project.findOne({ where: { id: projectId, userId } })
    if (!project) {
      return res.status(404).json({ success: false, error: "Project not found" })
    }

    // create milestones (bulk insert)
    const created = await Milestone.bulkCreate(
      milestones.map((m, idx) => ({
        title: m.title,
        deliverable: m.deliverable,
        deadline: m.deadline,
        amount: m.amount,
        status: m.status || "pending",
        order: idx + 1,
        projectId
      }))
    )

    await updateProgress(userId, projectId, 3);

    res.json({ success: true, data: created, nextStep: 3 })
  } catch (err) {
    console.error(err)
    res.status(500).json({ success: false, error: err.message })
  }
}


// Save client information (Step 4)
exports.saveClientInfo = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { client: clientData } = req.body;
    if (!clientData) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Client data is required' } });
    }
    const { name, email, company, country, phone, contactPerson } = clientData;
    const userId = req.user.id;

    // Check if project exists and belongs to user
    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }

    // Create or update client
    let client;
    if (project.clientId) {
      client = await Client.findByPk(project.clientId);
      if (client) {
        await client.update({ name, email, company, country, phone, contactPerson });
      }
    }

    if (!client) {
      client = await Client.create({ name, email, company, country, phone, contactPerson });
      await project.update({ clientId: client.id });
    }

    // Update project progress to step 4
    await updateProgress(userId, projectId, 4);

    return res.status(200).json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company,
          country: client.country,
          phone: client.phone,
          contactPerson: client.contactPerson
        },
        nextStep: 4
      }
    });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: messages.join(', ') }
      });
    }

    return next(error);
  }
};

// Review & finalize (Step 5)
exports.reviewOnboarding = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const userId = req.user.id;

    const project = await Project.findOne({
      where: { id: projectId, userId },
      include: [
        { model: Requirement, as: 'requirement' },
        { model: Milestone, as: 'milestones', order: [['order', 'ASC']] },
        { model: Client, as: 'client' }
      ]
    });

    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    await updateProgress(userId, projectId, 5);

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          deadline: project.deadline,
          status: project.status
        },
        requirements: project.requirement ? {
          id: project.requirement.id,
          notes: project.requirement.notes,
          files: project.requirement.files
        } : null,
        milestones: project.milestones.map(m => ({
          id: m.id,
          title: m.title,
          deliverable: m.deliverable,
          deadline: m.deadline,
          amount: m.amount,
          status: m.status,
          order: m.order
        })),
        client: project.client ? {
          id: project.client.id,
          name: project.client.name,
          email: project.client.email,
          company: project.client.company,
          country: project.client.country,
          phone: project.client.phone
        } : null,
        nextStep: 5
      }
    });
  } catch (error) {
    next(error);
  }
};

// Complete onboarding (Step 6)
exports.completeOnboarding = async (req, res, next) => {
  try {
    const { projectId } = req.body;
    const userId = req.user.id;

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    // Update project status to active
    await project.update({ status: 'active' });

    // Mark onboarding as completed
    const progress = await OnboardingProgress.findOne({ where: { userId, projectId } });
    if (progress) {
      progress.isCompleted = true;
      await progress.save();
    }

    // Update user onboarding status
    const user = await User.findByPk(userId);
    user.isOnboardingCompleted = true;
    await user.save();

    res.json({
      success: true,
      data: {
        message: 'Onboarding completed successfully',
        project: {
          id: project.id,
          status: project.status
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get onboarding progress
exports.getProgress = async (req, res, next) => {
  try {
    const { userId } = req.params;

    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied' } });
    }

    const progress = await OnboardingProgress.findAll({
      where: { userId },
      include: [{ model: Project, as: 'project' }],
      order: [['lastUpdated', 'DESC']],
      limit: 1
    });

    if (progress.length === 0) {
      return res.json({
        success: true,
        data: {
          currentStep: 0,
          isCompleted: false,
          completedSteps: [],
          lastUpdated: null
        }
      });
    }

    const latest = progress[0];
    res.json({
      success: true,
      data: {
        currentStep: latest.currentStep,
        isCompleted: latest.isCompleted,
        completedSteps: latest.completedSteps,
        lastUpdated: latest.lastUpdated,
        projectId: latest.projectId
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get onboarding data
exports.getOnboardingData = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({
      where: { id: projectId, userId },
      include: [
        { model: Requirement, as: 'requirement' },
        { model: Milestone, as: 'milestones', order: [['order', 'ASC']] },
        { model: Client, as: 'client' },
        { model: OnboardingProgress, as: 'onboardingProgress' }
      ]
    });

    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          deadline: project.deadline,
          status: project.status
        },
        requirements: project.requirement ? {
          id: project.requirement.id,
          notes: project.requirement.notes,
          files: project.requirement.files
        } : null,
        milestones: project.milestones.map(m => ({
          id: m.id,
          title: m.title,
          deliverable: m.deliverable,
          deadline: m.deadline,
          amount: m.amount,
          status: m.status,
          order: m.order
        })),
        client: project.client ? {
          id: project.client.id,
          name: project.client.name,
          email: project.client.email,
          company: project.client.company,
          country: project.client.country,
          phone: project.client.phone
        } : null,
        progress: project.onboardingProgress ? {
          currentStep: project.onboardingProgress.currentStep,
          isCompleted: project.onboardingProgress.isCompleted
        } : null
      }
    });
  } catch (error) {
    next(error);
  }
};

// Update onboarding step
exports.updateStep = async (req, res, next) => {
  try {
    const { userId, projectId, step } = req.body;

    if (req.user.id !== parseInt(userId)) {
      return res.status(403).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Access denied' } });
    }

    if (step < 0 || step > 6) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid step' } });
    }

    await updateProgress(userId, projectId, step);

    res.json({
      success: true,
      data: {
        message: 'Step updated successfully',
        currentStep: step
      }
    });
  } catch (error) {
    next(error);
  }
};




// exports.getProjects = async (req, res, next) => {
//   try {
//     const userId = req.user.id;

//     const projects = await Project.findAll({
//       where: { userId },
//       include: [
//         { model: Client, as: 'client', attributes: ['id', 'name', 'email', 'company', 'country', 'phone'] },
//         { model: Milestone, as: 'milestones', attributes: ['id', 'title', 'deliverable', 'deadline', 'amount', 'status', 'order'] },
//         { model: Requirement, as: 'requirements', attributes: ['id', 'notes'] }
//       ],
//       order: [['createdAt', 'DESC']]
//     });

//     res.json({ success: true, data: projects });
//   } catch (error) {
//     next(error);
//   }
// };

exports.getProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const projects = await Project.findAll({
      where: { userId, status: { [Op.ne]: 'draft' } },  // Filter out incomplete projects
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'company']
        },
        {
          model: Milestone,
          as: 'milestones',
          attributes: ['id', 'title', 'amount', 'status'],
          order: [['order', 'ASC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formattedProjects = projects.map(p => ({
      id: p.id,
      title: p.title,
      description: p.description,
      category: p.category,
      deadline: p.deadline,
      status: p.status,
      progress: p.progress || 0,
      priority: p.priority || 'medium',
      budget: p.budget ? parseFloat(p.budget) : null,
      client: p.client ? {
        id: p.client.id,
        name: p.client.name,
        email: p.client.email,
        company: p.client.company
      } : null,
      milestones: p.milestones?.map(m => ({
        id: m.id,
        title: m.title,
        amount: parseFloat(m.amount) || 0,
        status: m.status
      })) || [],
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    res.json({ success: true, data: formattedProjects });
  } catch (error) {
    next(error);
  }
};


// --- GET Single Project ---
exports.getProjectById = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({
      where: { id: projectId, userId },
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'company', 'country', 'phone', 'contactPerson']
        },
        {
          model: Milestone,
          as: 'milestones',
          attributes: ['id', 'title', 'deliverable', 'deadline', 'amount', 'status', 'order'],
          order: [['order', 'ASC']]
        },
        {
          model: Requirement,
          as: 'requirement',
          attributes: ['id', 'notes', 'files']
        }
      ]
    });

    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    const formattedProject = {
      id: project.id,
      name: project.title,
      status: project.status,
      progress: project.progress || 0,
      dueDate: project.deadline ? project.deadline.toISOString().split('T')[0] : null,
      client: project.client?.name || 'No Client',
      priority: project.priority || 'medium',
      budget: project.budget ? parseFloat(project.budget) : null,
      description: project.description,
      category: project.category,
      tasks: [], // Would need to implement task system
      requirements: project.requirement ? {
        id: project.requirement.id,
        notes: project.requirement.notes,
        files: project.requirement.files || []
      } : null,
      milestones: project.milestones?.map(m => ({
        id: m.id,
        title: m.title,
        deliverable: m.deliverable,
        deadline: m.deadline ? m.deadline.toISOString().split('T')[0] : null,
        amount: parseFloat(m.amount) || 0,
        status: m.status,
        order: m.order
      })) || [],
      clientInfo: project.client ? {
        id: project.client.id,
        name: project.client.name,
        email: project.client.email,
        company: project.client.company,
        country: project.client.country,
        phone: project.client.phone,
        contactPerson: project.client.contactPerson
      } : null,
      createdAt: project.createdAt,
      updatedAt: project.updatedAt
    };

    res.json({ success: true, data: formattedProject });
  } catch (error) {
    next(error);
  }
};

// --- GET Requirements ---
exports.getRequirements = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    const requirements = await Requirement.findOne({ where: { projectId } });
    res.json({ success: true, data: requirements });
  } catch (error) {
    next(error);
  }
};

// --- GET Milestones ---
exports.getMilestones = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    const milestones = await Milestone.findAll({
      where: { projectId },
      order: [['order', 'ASC']]
    });
    res.json({ success: true, data: milestones });
  } catch (error) {
    next(error);
  }
};

// --- GET Client Info ---
exports.getClient = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    const client = await Client.findOne({ where: { id: project.clientId } });
    res.json({ success: true, data: client });
  } catch (error) {
    next(error);
  }
};

// --- GET All Projects with Filtering ---
exports.getAllProjects = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, search, page = 1, limit = 10 } = req.query;

    const whereClause = { userId };

    // Filter out incomplete projects (status: 'draft') by default
    if (!status) {
      whereClause.status = { [Op.ne]: 'draft' };
    } else {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { title: { [Op.iLike]: `%${search}%` } },
        { description: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: projects } = await Project.findAndCountAll({
      where: whereClause,
      include: [
        {
          model: Client,
          as: 'client',
          attributes: ['id', 'name', 'email', 'company', 'country', 'phone', 'contactPerson']
        },
        {
          model: Milestone,
          as: 'milestones',
          attributes: ['id', 'title', 'deliverable', 'deadline', 'amount', 'status', 'order'],
          order: [['order', 'ASC']]
        },
        {
          model: Requirement,
          as: 'requirement',
          attributes: ['id', 'notes', 'files']
        }
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedProjects = projects.map(p => ({
      id: p.id,
      name: p.title,
      status: p.status,
      progress: p.progress || 0,
      dueDate: p.deadline ? p.deadline.toISOString().split('T')[0] : null,
      client: p.client?.name || 'No Client',
      priority: p.priority || 'medium',
      budget: p.budget ? parseFloat(p.budget) : null,
      description: p.description,
      tasks: [], // Would need to implement task system
      requirements: p.requirement ? {
        id: p.requirement.id,
        notes: p.requirement.notes,
        files: p.requirement.files || []
      } : null,
      milestones: p.milestones?.map(m => ({
        id: m.id,
        title: m.title,
        deliverable: m.deliverable,
        deadline: m.deadline ? m.deadline.toISOString().split('T')[0] : null,
        amount: parseFloat(m.amount) || 0,
        status: m.status,
        order: m.order
      })) || [],
      clientInfo: p.client ? {
        id: p.client.id,
        name: p.client.name,
        email: p.client.email,
        company: p.client.company,
        country: p.client.country,
        phone: p.client.phone,
        contactPerson: p.client.contactPerson
      } : null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt
    }));

    res.json({
      success: true,
      data: formattedProjects,
      pagination: {
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- UPDATE Project Status ---
exports.updateProjectStatus = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const { status, progress } = req.body;
    const userId = req.user.id;

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    const updateData = {};
    if (status) updateData.status = status;
    if (progress !== undefined) updateData.progress = progress;

    await project.update(updateData);

    res.json({
      success: true,
      data: {
        id: project.id,
        status: project.status,
        progress: project.progress
      }
    });
  } catch (error) {
    next(error);
  }
};

// --- DELETE Project ---
exports.deleteProject = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    await project.destroy();

    res.json({
      success: true,
      message: 'Project deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
