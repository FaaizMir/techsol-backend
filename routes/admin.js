const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/authMiddleware');

// All admin routes require authentication and admin role
router.use(authMiddleware); // First authenticate
router.use(adminMiddleware); // Then check admin role

// Get all users (excluding admin users)
router.get('/users', adminController.getAllUsers);

// Get dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Get all projects with associated data
router.get('/projects', adminController.getAllProjects);

// Get all clients with associated projects
router.get('/clients', adminController.getAllClients);

// Get all milestones with associated project data
router.get('/milestones', adminController.getAllMilestones);

// Get all requirements with associated project data
router.get('/requirements', adminController.getAllRequirements);

// Proposal Document endpoints
router.post('/proposal-documents', adminController.createProposalDocument);
router.get('/proposal-documents', adminController.getAllProposalDocuments);

// Get specific user by ID (excluding admin users)
router.get('/users/:id', adminController.getUserById);

// Update user information (excluding admin users)
router.put('/users/:id', adminController.updateUser);

// Delete user (excluding admin users)
router.delete('/users/:id', adminController.deleteUser);

// Edit endpoints for projects, clients, milestones, and requirements
router.put('/projects/:id', adminController.editProject);
router.put('/clients/:id', adminController.editClient);
router.put('/milestones/:id', adminController.editMilestone);
router.put('/requirements/:id', adminController.editRequirement);

module.exports = router;