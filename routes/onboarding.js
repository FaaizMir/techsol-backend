const express = require('express');
const router = express.Router();
const onboardingController = require('../controllers/onboardingController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// All onboarding routes require authentication
router.use(authMiddleware);

// Onboarding endpoints
router.post('/start', onboardingController.startOnboarding);
router.post('/project', onboardingController.saveProjectDetails);
router.post('/requirements/:projectId', upload.array("files"), onboardingController.saveRequirements);
router.post('/milestones/:projectId', onboardingController.saveMilestones);
router.post('/client/:projectId', onboardingController.saveClientInfo);
router.post('/review', onboardingController.reviewOnboarding);
router.post('/complete', onboardingController.completeOnboarding);
router.get('/progress/:userId', onboardingController.getProgress);
router.put('/step', onboardingController.updateStep);

// Dashboard project endpoints - moved up before generic routes
router.get('/all-projects', onboardingController.getAllProjects);

// Project routes - moved up before generic :projectId route
router.get('/projects', onboardingController.getProjects);
router.get('/projects/:projectId', onboardingController.getProjectById);
router.get('/projects/:projectId/requirements', onboardingController.getRequirements);
router.get('/projects/:projectId/milestones', onboardingController.getMilestones);
router.get('/projects/:projectId/client', onboardingController.getClient);
router.put('/projects/:projectId/status', onboardingController.updateProjectStatus);
router.delete('/projects/:projectId', onboardingController.deleteProject);

// Generic project route - must be last
router.get('/:projectId', onboardingController.getOnboardingData);

module.exports = router;