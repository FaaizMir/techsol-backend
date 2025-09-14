const { Project, Requirement, Milestone, Client, OnboardingProgress, User } = require('../models/associations');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

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

    // Create a draft project
    const project = await Project.create({ userId, title: 'Draft Project', description: 'Draft description', category: 'other', deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) });

    // Initialize progress
    await updateProgress(userId, project.id, 0);

    res.json({
      success: true,
      data: {
        projectId: project.id,
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
    const { projectId, title, description, category, deadline } = req.body;
    const userId = req.user.id;

    if (!projectId || !title || !description || !category || !deadline) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'All fields are required' } });
    }

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    await project.update({ title, description, category, deadline: new Date(deadline) });
    await updateProgress(userId, projectId, 1);

    res.json({
      success: true,
      data: {
        project: {
          id: project.id,
          title: project.title,
          description: project.description,
          category: project.category,
          deadline: project.deadline
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
    const { projectId, notes } = req.body;
    const userId = req.user.id;

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    let requirement = await Requirement.findOne({ where: { projectId } });
    const files = [];

    if (req.files && req.files.length > 0) {
      // Process uploaded files
      for (const file of req.files) {
        files.push({
          filename: file.filename,
          originalName: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          url: `/uploads/${file.filename}`, // Assuming static serving
          uploadedAt: new Date()
        });
      }
    }

    if (requirement) {
      await requirement.update({ notes, files: [...requirement.files, ...files] });
    } else {
      requirement = await Requirement.create({ projectId, notes, files });
    }

    await updateProgress(userId, projectId, 2);

    res.json({
      success: true,
      data: {
        requirements: {
          id: requirement.id,
          notes: requirement.notes,
          files: requirement.files
        },
        nextStep: 2
      }
    });
  } catch (error) {
    next(error);
  }
};

// Save milestones (Step 3)
exports.saveMilestones = async (req, res, next) => {
  try {
    const { projectId, milestones } = req.body;
    const userId = req.user.id;

    if (!Array.isArray(milestones) || milestones.length === 0) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Milestones array is required' } });
    }

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    // Delete existing milestones
    await Milestone.destroy({ where: { projectId } });

    // Create new milestones
    const createdMilestones = [];
    for (let i = 0; i < milestones.length; i++) {
      const milestone = await Milestone.create({
        projectId,
        ...milestones[i],
        order: i
      });
      createdMilestones.push({
        id: milestone.id,
        title: milestone.title,
        deliverable: milestone.deliverable,
        deadline: milestone.deadline,
        amount: milestone.amount,
        status: milestone.status,
        order: milestone.order
      });
    }

    await updateProgress(userId, projectId, 3);

    res.json({
      success: true,
      data: {
        milestones: createdMilestones,
        nextStep: 3
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

// Save client information (Step 4)
exports.saveClientInfo = async (req, res, next) => {
  try {
    const { projectId, name, email, company, country, phone } = req.body;
    const userId = req.user.id;

    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Project not found' } });
    }

    let client = await Client.findOne({ where: { projectId } });
    if (client) {
      await client.update({ name, email, company, country, phone });
    } else {
      client = await Client.create({ projectId, name, email, company, country, phone });
    }

    await updateProgress(userId, projectId, 4);

    res.json({
      success: true,
      data: {
        client: {
          id: client.id,
          name: client.name,
          email: client.email,
          company: client.company,
          country: client.country,
          phone: client.phone
        },
        nextStep: 4
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
      progress.currentStep = 5;
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
        lastUpdated: latest.lastUpdated
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

    if (step < 0 || step > 5) {
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