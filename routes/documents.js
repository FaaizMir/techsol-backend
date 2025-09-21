const express = require('express');
const router = express.Router();
const documentsController = require('../controllers/documentsController');
const authMiddleware = require('../middleware/authMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');

// All document routes require authentication
router.use(authMiddleware);

// Document endpoints
router.get('/projects/:projectId/documents', documentsController.getProjectDocuments);
router.post('/projects/:projectId/documents', uploadMiddleware.single('file'), documentsController.uploadDocument);
router.get('/:documentId/download', documentsController.downloadDocument);
router.put('/:documentId/status', documentsController.updateDocumentStatus);
router.delete('/:documentId', documentsController.deleteDocument);

module.exports = router;