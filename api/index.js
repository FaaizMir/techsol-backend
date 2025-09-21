const express = require('express');
const cors = require('cors');
const path = require('path');
const config = require('../config/index');
const errorHandler = require('../middleware/errorHandler');
const logger = require('../utils/logger');

// Routes
const authRoutes = require('../routes/auth');
const protectedRoutes = require('../routes/protected');
const onboardingRoutes = require('../routes/onboarding');
const dashboardRoutes = require('../routes/dashboard');
const chatRoutes = require('../routes/chat');
const documentsRoutes = require('../routes/documents');
const clientsRoutes = require('../routes/clients');
const profileRoutes = require('../routes/profile');

const app = express();

// CORS
app.use(cors({ origin: config.corsOrigins, methods: ['GET', 'POST', 'PUT', 'DELETE'], allowedHeaders: ['Content-Type', 'Authorization'] }));
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Health check
app.get('/', (req, res) => res.json({ message: 'Server is running', timestamp: new Date().toISOString() }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/clients', clientsRoutes);
app.use('/api/profile', profileRoutes);

// Error handling
app.use(errorHandler);

logger.info('App initialized');
module.exports = app;


