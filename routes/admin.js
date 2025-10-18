const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const { adminMiddleware } = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// All admin routes require authentication and admin role
router.use(authMiddleware); // First authenticate
router.use(adminMiddleware); // Then check admin role

// ==================== DASHBOARD ROUTES ====================
// Get dashboard statistics
router.get('/dashboard/stats', adminController.getDashboardStats);

// Get project analytics
router.get('/dashboard/analytics/projects', adminController.getProjectAnalytics);

// ==================== USER MANAGEMENT ROUTES ====================
// Get all users (excluding admin users)
router.get('/users', adminController.getAllUsers);

// Get specific user by ID (excluding admin users)
router.get('/users/:id', adminController.getUserById);

// Update user information (excluding admin users)
router.put('/users/:id', adminController.updateUser);

// Delete user (excluding admin users)
router.delete('/users/:id', adminController.deleteUser);

// ==================== PROJECT MANAGEMENT ROUTES ====================
// Search and filter projects
router.get('/projects/search', adminController.searchProjects);

// Get all projects with associated data
router.get('/projects', adminController.getAllProjects);

// Get project by ID with full details
router.get('/projects/:id', adminController.getProjectById);

// Create a new project
router.post('/projects', adminController.createProject);

// Update/Edit a project
router.put('/projects/:id', adminController.editProject);

// Update project status
router.put('/projects/:id/status', adminController.updateProjectStatus);

// Bulk update projects
router.put('/projects/bulk-update', adminController.bulkUpdateProjects);

// Delete a project
router.delete('/projects/:id', adminController.deleteProject);

// ==================== MILESTONE ROUTES ====================
// Get all milestones with associated project data
router.get('/milestones', adminController.getAllMilestones);

// Create milestone for a project
router.post('/projects/:projectId/milestones', adminController.createMilestone);

// Edit milestone
router.put('/milestones/:id', adminController.editMilestone);

// Delete milestone
router.delete('/milestones/:id', adminController.deleteMilestone);

// ==================== REQUIREMENT ROUTES ====================
// Get all requirements with associated project data
router.get('/requirements', adminController.getAllRequirements);

// Create requirement for a project
router.post('/projects/:projectId/requirements', adminController.createRequirement);

// Edit requirement
router.put('/requirements/:id', adminController.editRequirement);

// Delete requirement
router.delete('/requirements/:id', adminController.deleteRequirement);

// ==================== CLIENT MANAGEMENT ROUTES ====================
// Get all clients with associated projects
router.get('/clients', adminController.getAllClients);

// Create a new client
router.post('/clients', adminController.createClient);

// Edit client
router.put('/clients/:id', adminController.editClient);

// Delete client
router.delete('/clients/:id', adminController.deleteClient);

// ==================== CHAT/CONVERSATION ROUTES ====================
// Get all conversations (chat)
router.get('/conversations', adminController.getAllConversations);

// Get messages for a conversation
router.get('/conversations/:conversationId/messages', adminController.getConversationMessages);

// Send message in a conversation
router.post('/conversations/:conversationId/messages', adminController.sendMessageAsAdmin);

// ==================== DOCUMENT MANAGEMENT ROUTES ====================
// Get all documents
router.get('/documents', adminController.getAllDocuments);

// Upload document to a project
router.post('/projects/:projectId/documents', uploadMiddleware.single('file'), adminController.uploadDocument);

// Update document status
router.put('/documents/:documentId/status', adminController.updateDocumentStatus);

// Delete document
router.delete('/documents/:documentId', adminController.deleteDocument);

module.exports = router;