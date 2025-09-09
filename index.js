const express = require('express');
const dotenv = require('dotenv');
const path = require('path');

// Determine env file
const envFile = process.env.NODE_ENV === 'development'
  ? '.env.development'
  : '.env.production'; // fallback name, mostly unused on Vercel

// Load env variables
dotenv.config({ path: path.resolve(__dirname, envFile) });

console.log("Loaded env:", {
  DB_HOST: process.env.DB_HOST,
  DB_USER: process.env.DB_USER,
  DB_PASS: process.env.DB_PASS,
  DB_NAME: process.env.DB_NAME
});

// Routes and other imports
const authRoutes = require('./routes/auth');
const protectedRoutes = require('./routes/protected');

const cors = require('cors');
const sequelize = require('./models/index');

const app = express();

// CORS config
const corsOptions = {
  origin: ['http://localhost:3000', 'https://your-frontend.vercel.app'],
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

// Start server
async function start() {
    try {
        await sequelize.authenticate();
        console.log('Database connection authenticated');
        await sequelize.sync();
        console.log('Database synced');

        const PORT = process.env.PORT || 5000;
        const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

        const shutdown = async (signal) => {
            console.log(`Received ${signal}. Shutting down gracefully...`);
            try {
                server.close(async () => {
                    try {
                        await sequelize.close();
                        console.log('Database connection closed');
                        process.exit(0);
                    } catch (err) {
                        console.error('Error closing DB connection', err);
                        process.exit(1);
                    }
                });
                setTimeout(() => {
                    console.error('Forcing shutdown');
                    process.exit(1);
                }, 10000).unref();
            } catch (err) {
                console.error('Error during shutdown', err);
                process.exit(1);
            }
        };

        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('uncaughtException', (err) => {
            console.error('Uncaught exception', err);
            shutdown('uncaughtException');
        });
        process.on('unhandledRejection', (reason) => {
            console.error('Unhandled rejection', reason);
        });

    } catch (err) {
        console.error('Failed to start application', err);
        process.exit(1);
    }
}

start();
