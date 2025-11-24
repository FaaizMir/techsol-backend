const { Client, Project, Milestone } = require('../models/associations');
const { Op } = require('sequelize');

// Get all clients
exports.getAllClients = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { status, search, page = 1, limit = 10 } = req.query;

    const whereClause = {};

    if (status) {
      whereClause.status = status;
    }

    if (search) {
      whereClause[Op.or] = [
        { name: { [Op.iLike]: `%${search}%` } },
        { email: { [Op.iLike]: `%${search}%` } },
        { company: { [Op.iLike]: `%${search}%` } }
      ];
    }

    const offset = (page - 1) * limit;

    const { count, rows: clients } = await Client.findAndCountAll({
      where: whereClause,
      attributes: [
        'id', 'name', 'contactPerson', 'email', 'phone', 'company', 'status', 'createdAt', 'updatedAt',
        // Include project count and total value
        [
          Client.sequelize.literal(`(
            SELECT COUNT(*)
            FROM Projects
            WHERE Projects.clientId = Client.id
            AND Projects.userId = ${userId}
          )`),
          'projects'
        ],
        [
          Client.sequelize.literal(`(
            SELECT COALESCE(SUM(Milestones.amount), 0)
            FROM Projects
            LEFT JOIN Milestones ON Projects.id = Milestones.projectId
            WHERE Projects.clientId = Client.id
            AND Projects.userId = ${userId}
            AND Projects.status = 'completed'
          )`),
          'totalValue'
        ],
        [
          Client.sequelize.literal(`(
            SELECT MAX(Projects.updatedAt)
            FROM Projects
            WHERE Projects.clientId = Client.id
            AND Projects.userId = ${userId}
          )`),
          'lastContact'
        ]
      ],
      order: [['updatedAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    const formattedClients = clients.map(c => ({
      id: c.id,
      name: c.name,
      contact: c.contactPerson || c.name,
      email: c.email,
      phone: c.phone,
      projects: parseInt(c.dataValues.projects) || 0,
      totalValue: `$${parseFloat(c.dataValues.totalValue || 0).toFixed(2)}`,
      lastContact: c.dataValues.lastContact ? new Date(c.dataValues.lastContact).toISOString().split('T')[0] : null,
      status: c.status
    }));

    res.json({
      success: true,
      data: formattedClients,
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

// Get client details with projects
exports.getClientDetails = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const userId = req.user.id;

    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' }
      });
    }

    const projects = await Project.findAll({
      where: { clientId, userId },
      include: [{
        model: Milestone,
        as: 'milestones',
        attributes: ['amount', 'status']
      }],
      order: [['createdAt', 'DESC']]
    });

    const clientWithProjects = {
      id: client.id,
      name: client.name,
      contact: client.contactPerson || client.name,
      email: client.email,
      phone: client.phone,
      company: client.company,
      country: client.country,
      status: client.status,
      projects: projects.map(p => ({
        id: p.id,
        name: p.title,
        status: p.status,
        progress: p.progress,
        budget: p.budget,
        totalValue: p.milestones.reduce((sum, m) => sum + parseFloat(m.amount || 0), 0)
      }))
    };

    res.json({ success: true, data: clientWithProjects });
  } catch (error) {
    next(error);
  }
};

// Update client
exports.updateClient = async (req, res, next) => {
  try {
    const { clientId } = req.params;
    const { name, contactPerson, email, phone, company, country, status } = req.body;

    const client = await Client.findByPk(clientId);
    if (!client) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Client not found' }
      });
    }

    await client.update({
      name,
      contactPerson,
      email,
      phone,
      company,
      country,
      status
    });

    res.json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        contact: client.contactPerson || client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        country: client.country,
        status: client.status
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
    next(error);
  }
};

// Create new client
exports.createClient = async (req, res, next) => {
  try {
    const { name, contactPerson, email, phone, company, country, status } = req.body;

    const client = await Client.create({
      name,
      contactPerson,
      email,
      phone,
      company,
      country,
      status: status || 'active'
    });

    // Also create a user account for the client for chat authentication
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('client123', 10); // Default password

    const { User } = require('../models/associations');
    await User.create({
      email: email,
      password: hashedPassword,
      role: 'user', // Clients are users
      firstName: contactPerson || name,
      lastName: '',
      company: company,
      isOnboardingCompleted: true // Clients don't need onboarding
    });

    res.status(201).json({
      success: true,
      data: {
        id: client.id,
        name: client.name,
        contact: client.contactPerson || client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        country: client.country,
        status: client.status
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
    next(error);
  }
};