const { Document, Project, Client } = require('../models/associations');
const path = require('path');
const fs = require('fs');

// Get documents for a project
exports.getProjectDocuments = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Verify project belongs to user and include client
    const project = await Project.findOne({ 
      where: { id: projectId, userId },
      include: [{
        model: Client,
        as: 'client',
        attributes: ['name']
      }]
    });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }

    const documents = await Document.findAll({
      where: { projectId },
      order: [['createdAt', 'DESC']]
    });

    const formattedDocuments = documents.map(d => ({
      id: d.id,
      name: d.name,
      type: path.extname(d.originalName).slice(1).toUpperCase(),
      size: formatFileSize(d.fileSize),
      client: project.client?.name || 'Unknown',
      uploadDate: d.createdAt.toISOString().split('T')[0],
      status: d.status
    }));

    res.json({ success: true, data: formattedDocuments });
  } catch (error) {
    next(error);
  }
};

// Upload document
exports.uploadDocument = async (req, res, next) => {
  try {
    const { projectId } = req.params;
    const userId = req.user.id;

    // Verify project belongs to user
    const project = await Project.findOne({ where: { id: projectId, userId } });
    if (!project) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Project not found' }
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'No file uploaded' }
      });
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
      uploadedBy: userId
    });

    res.json({
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
    next(error);
  }
};

// Download document
exports.downloadDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const document = await Document.findOne({
      where: { id: documentId },
      include: [{
        model: Project,
        as: 'project',
        where: { userId },
        required: true
      }]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' }
      });
    }

    const filePath = path.join(__dirname, '..', document.filePath);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'File not found on server' }
      });
    }

    res.download(filePath, document.originalName);
  } catch (error) {
    next(error);
  }
};

// Update document status
exports.updateDocumentStatus = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const { status } = req.body;
    const userId = req.user.id;

    const validStatuses = ['draft', 'under-review', 'approved', 'signed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: 'Invalid status' }
      });
    }

    const document = await Document.findOne({
      where: { id: documentId },
      include: [{
        model: Project,
        as: 'project',
        where: { userId },
        required: true
      }]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' }
      });
    }

    const updateData = { status };
    if (status === 'approved') {
      updateData.approvedBy = userId;
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
    next(error);
  }
};

// Delete document
exports.deleteDocument = async (req, res, next) => {
  try {
    const { documentId } = req.params;
    const userId = req.user.id;

    const document = await Document.findOne({
      where: { id: documentId },
      include: [{
        model: Project,
        as: 'project',
        where: { userId },
        required: true
      }]
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Document not found' }
      });
    }

    // Delete file from filesystem
    const filePath = path.join(__dirname, '..', document.filePath);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await document.destroy();

    res.json({ success: true, message: 'Document deleted successfully' });
  } catch (error) {
    next(error);
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