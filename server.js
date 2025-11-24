const express = require('express');
const cors = require('cors');
const path = require('path');
const sequelize = require('./config/database');
const config = require('./config/index');
const logger = require('./utils/logger');
const setupSockets = require("./socket");
const http = require("http");
const errorHandler = require('./middleware/errorHandler');

// Routes
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');
const onboardingRoutes = require('./routes/onboarding');
const dashboardRoutes = require('./routes/dashboard');
const chatRoutes = require('./routes/chat');
const documentsRoutes = require('./routes/documents');
const clientsRoutes = require('./routes/clients');
const profileRoutes = require('./routes/profile');
const adminRoutes = require('./routes/admin');

const app = express();

// CORS
app.use(
  cors({
    origin: config.corsOrigin,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  })
);
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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
app.use('/api/admin', adminRoutes);

// Error handling
app.use(errorHandler);

const startServer = async () => {
  try {
    await sequelize.authenticate();
    // Load associations after authenticate
    require('./models/associations');
    await sequelize.sync({ force: false });
    logger.info('Database connected and synced');

    // Create HTTP server from express app
    const server = http.createServer(app);

    // Setup sockets on same server
    setupSockets(server);

    // Start listening
    server.listen(config.port, () => {
      logger.info(`Server running on port ${config.port}`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}. Shutting down...`);
      server.close(async () => {
        await sequelize.close();
        process.exit(0);
      });
    };

    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
