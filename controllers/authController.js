const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const sequelize = require('../config/database');
const config = require('../config/index');
const logger = require('../utils/logger');

// Helper to init DB (for serverless)
const initDb = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();
    logger.info('Database initialized');
  } catch (error) {
    logger.error('DB init failed:', error);
    throw error;
  }
};

exports.signup = async (req, res, next) => {
  try {
    await initDb();
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ username, password: hashedPassword });
    res.status(201).json({ message: 'User created', user: { id: user.id, username } });
  } catch (error) {
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    await initDb();
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    const token = jwt.sign({ id: user.id, username }, config.jwtSecret, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    next(error);
  }
};