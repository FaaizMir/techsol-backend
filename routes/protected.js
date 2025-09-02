const express = require('express')
const authMiddleware = require('../middleware/authMiddleware')
const router = express.Router()

router.get('/profile', authMiddleware, (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user })
})

// GET /api/check-auth
router.get("/check-auth", authMiddleware, (req, res) => {
 res.json({
    valid: true,
    user: req.user, // comes from middleware
  });
});

module.exports = router