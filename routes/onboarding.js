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
router.post('/requirements', upload.array('files', 20), onboardingController.saveRequirements);
router.post('/milestones', onboardingController.saveMilestones);
router.post('/client', onboardingController.saveClientInfo);
router.post('/review', onboardingController.reviewOnboarding);
router.post('/complete', onboardingController.completeOnboarding);
router.get('/progress/:userId', onboardingController.getProgress);
router.get('/:projectId', onboardingController.getOnboardingData);
router.put('/step', onboardingController.updateStep);

module.exports = router;