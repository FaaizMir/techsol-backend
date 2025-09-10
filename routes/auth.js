// const express = require('express');
// const router = express.Router();
// const User = require('../models/User');
// const bcrypt = require('bcryptjs');
// const jwt = require('jsonwebtoken');

// const allowedOrigins = [
//   'http://localhost:3000',
//   'https://techsol-backend.vercel.app'
// ];

// // CORS middleware for this router
// router.use((req, res, next) => {
//   const origin = req.headers.origin;
//   if (allowedOrigins.includes(origin)) {
//     res.setHeader('Access-Control-Allow-Origin', origin);
//   }
//   res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
//   res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');

//   if (req.method === 'OPTIONS') {
//     return res.sendStatus(200); // Respond to preflight immediately
//   }

//   next();
// });

// // Signup route
// router.post('/signup', async (req, res) => {
//   const { username, password } = req.body;
//   const hashedPassword = await bcrypt.hash(password, 10);
//   try {
//     const user = await User.create({ username, password: hashedPassword });
//     res.status(201).json({ message: 'User created', user: { id: user.id, username: user.username } });
//   } catch (err) {
//     res.status(400).json({ error: 'Username already exists' });
//   }
// });

// // Login route
// router.post('/login', async (req, res) => {
//   const { username, password } = req.body;
//   const user = await User.findOne({ where: { username } });
//   if (!user) return res.status(400).json({ error: 'Invalid credentials' });
//   const valid = await bcrypt.compare(password, user.password);
//   if (!valid) return res.status(400).json({ error: 'Invalid credentials' });
//   const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1m' });
//   res.json({ token });
// });

// module.exports = router;

const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Model is fine
const sequelize = require('../models/index'); // Import sequelize instance

const router = express.Router();

// Helper function to initialize database connection and sync models
// Caching the promise to avoid duplicate initialization in the same cold start
let sequelizeInitPromise = null;
const initDb = async () => {
  if (sequelizeInitPromise) {
    return sequelizeInitPromise;
  }
  sequelizeInitPromise = (async () => {
    try {
      await sequelize.authenticate();
      await sequelize.sync(); // You might want to use migrations for production
    } catch (error) {
      console.error('Database connection or sync failed:', error);
      throw error; // Re-throw to prevent route from proceeding
    }
  })();
  return sequelizeInitPromise;
};

// Signup
router.post('/signup', async (req, res) => {
  try {
    await initDb(); // Connect and sync on demand
    
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User created', user: { id: user.id, username: user.username } });
  } catch (err) {
    res.status(400).json({ error: err.message || 'Username already exists' });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    await initDb(); // Connect and sync on demand
    
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
