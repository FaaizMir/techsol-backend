const express = require('express');
const router = express.Router();
const proposalController = require('../controllers/proposalController');
const authMiddleware = require('../middleware/authMiddleware');

// All proposal routes require authentication
router.use(authMiddleware);

// Create a new proposal document
router.post('/', proposalController.createProposalDocument);

// Get user's proposal documents
router.get('/', proposalController.getUserProposalDocuments);

// Get specific proposal document by ID
router.get('/:id', proposalController.getProposalDocumentById);

module.exports = router;