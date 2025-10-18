const jwt = require('jsonwebtoken')
const config = require('../config/index')

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization
  if (!authHeader) return res.status(401).json({ error: 'No token provided' })
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, config.jwtSecret)
    req.user = decoded // Now includes role
    next()
  } catch (err) {
    res.status(401).json({ error: 'Invalid token' })
  }
}

// Admin-only middleware - requires authentication first
function adminMiddleware(req, res, next) {
  // First check if user is authenticated
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required' })
  }
  
  // Then check if user has admin role
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }
  
  next()
}

module.exports = authMiddleware
module.exports.adminMiddleware = adminMiddleware