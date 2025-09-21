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
router.get('/:projectId', onboardingController.getOnboardingData);
router.put('/step', onboardingController.updateStep);

//new routes for fetching individual sections
router.get('/projects', onboardingController.getProjects); 
router.get('/projects/:projectId', onboardingController.getProjectById);
router.get('/projects/:projectId/requirements', onboardingController.getRequirements);
router.get('/projects/:projectId/milestones', onboardingController.getMilestones);
router.get('/projects/:projectId/client', onboardingController.getClient);

module.exports = router;