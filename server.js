const app = require('./api/index');
const sequelize = require('./config/database');
const config = require('./config/index');
const logger = require('./utils/logger');

const startServer = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: false, alter: true });
    logger.info('Database connected and synced');

    const server = app.listen(config.port, () => logger.info(`Server running on port ${config.port}`));

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