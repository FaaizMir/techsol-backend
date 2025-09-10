const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const sequelize = require('../models/index'); // Adjusted path

// Environment variables are loaded automatically by Vercel from settings.
// For local 'vercel dev' testing, load the development environment variables.
if (process.env.VERCEL_ENV === 'development') {
  dotenv.config({ path: path.resolve(__dirname, '..', '.env.development') });
}

// Routes
const authRoutes = require('../routes/auth'); // Adjusted path
const protectedRoutes = require('../routes/protected'); // Adjusted path

const app = express();

// CORS config (updated)
const corsOptions = {
  origin: ['http://localhost:3000', 'https://your-frontend.vercel.app'],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'], // Add 'Authorization' here
};
app.use(cors(corsOptions));
app.use(express.json());

// **NOTE:** In a serverless environment, database connection should not be
// performed globally. Remove the `sequelize.authenticate()` and `sequelize.sync()`
// calls from here. These should happen inside your route handlers as needed,
// using connection pooling.

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/protected', protectedRoutes);

// Export the app instance for Vercel
module.exports = app;



// const express = require('express');
// const dotenv = require('dotenv');
// const path = require('path');

// // Determine env file
// const envFile = process.env.NODE_ENV === 'development'
//   ? '.env.development'
//   : '.env.production'; // fallback name, mostly unused on Vercel

// // Load env variables
// dotenv.config({ path: path.resolve(__dirname, envFile) });

// console.log("Loaded env:", {
//   DB_HOST: process.env.DB_HOST,
//   DB_USER: process.env.DB_USER,
//   DB_PASS: process.env.DB_PASS,
//   DB_NAME: process.env.DB_NAME
// });

// // Routes and other imports
// const authRoutes = require('./routes/auth');
// const protectedRoutes = require('./routes/protected');

// const cors = require('cors');
// const sequelize = require('./models/index');

// const app = express();

// // CORS config
// const corsOptions = {
//   origin: ['http://localhost:3000', 'https://your-frontend.vercel.app'],
//   methods: ['GET','POST','PUT','DELETE','OPTIONS'],
//   allowedHeaders: ['Content-Type'],
// };
// app.use(cors(corsOptions));
// // app.options('*', cors(corsOptions));

// app.use(express.json());

// // Health check
// app.get('/', (req, res) => {
//   res.json({ message: 'Server is running', timestamp: new Date().toISOString() });
// });

// app.use('/api/auth', authRoutes);
// app.use('/api/protected', protectedRoutes);

// // Start server
// async function start() {
//     try {
//         await sequelize.authenticate();
//         console.log('Database connection authenticated');
//         await sequelize.sync();
//         console.log('Database synced');

//         const PORT = process.env.PORT || 5000;
//         const server = app.listen(PORT, () => console.log(`Server running on port ${PORT}`));

//         const shutdown = async (signal) => {
//             console.log(`Received ${signal}. Shutting down gracefully...`);
//             try {
//                 server.close(async () => {
//                     try {
//                         await sequelize.close();
//                         console.log('Database connection closed');
//                         process.exit(0);
//                     } catch (err) {
//                         console.error('Error closing DB connection', err);
//                         process.exit(1);
//                     }
//                 });
//                 setTimeout(() => {
//                     console.error('Forcing shutdown');
//                     process.exit(1);
//                 }, 10000).unref();
//             } catch (err) {
//                 console.error('Error during shutdown', err);
//                 process.exit(1);
//             }
//         };

//         process.on('SIGINT', () => shutdown('SIGINT'));
//         process.on('SIGTERM', () => shutdown('SIGTERM'));
//         process.on('uncaughtException', (err) => {
//             console.error('Uncaught exception', err);
//             shutdown('uncaughtException');
//         });
//         process.on('unhandledRejection', (reason) => {
//             console.error('Unhandled rejection', reason);
//         });

//     } catch (err) {
//         console.error('Failed to start application', err);
//         process.exit(1);
//     }
// }

// start();

