const ProposalDocument = require('../models/ProposalDocument');
const User = require('../models/User');
const Project = require('../models/Project');

// Create a new proposal document (client-facing)
exports.createProposalDocument = async (req, res, next) => {
  try {
    const { projectId, content } = req.body;
    const userId = req.user.id; // Get userId from authenticated user

    // Validate required fields
    if (!projectId || !content) {
      return res.status(400).json({
        success: false,
        error: 'projectId and content are required'
      });
    }

    // Verify project exists and belongs to the authenticated user
    const project = await Project.findOne({
      where: {
        id: projectId,
        userId: userId
      }
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        error: 'Project not found or does not belong to you'
      });
    }

    // Create the proposal document
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

// Get user's proposal documents
exports.getUserProposalDocuments = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { projectId } = req.query;

    const whereClause = { userId };
    if (projectId) whereClause.projectId = projectId;

    const proposalDocuments = await ProposalDocument.findAll({
      where: whereClause,
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status']
        }
      ],
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

// Get specific proposal document
exports.getProposalDocumentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const proposalDocument = await ProposalDocument.findOne({
      where: {
        id,
        userId // Ensure user can only access their own documents
      },
      include: [
        {
          model: Project,
          as: 'project',
          attributes: ['id', 'title', 'status']
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

  } catch (error) {
    console.error('Error fetching proposal document:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
};

module.exports = exports;