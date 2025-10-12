const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const config = require('../config/index');
const logger = require('../utils/logger');

exports.signup = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({ email, password: hashedPassword, role: 'user' });
    res.status(201).json({ message: 'User created', user: { id: user.id, email, role: user.role } });
  } catch (error) {
    if (error.name === 'SequelizeValidationError') {
      const messages = error.errors.map(e => e.message);
      return res.status(400).json({ error: messages.join(', ') });
    }
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({ error: 'Email already exists' });
    }
    next(error);
  }
};

exports.login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }
    
    // Include role in JWT token
    const token = jwt.sign({ 
      id: user.id, 
      email: user.email,
      role: user.role 
    }, config.jwtSecret, { expiresIn: '1h' });
    
    const userData = user.toJSON();
    delete userData.password;
    
    res.json({ 
      token, 
      user: userData,
      role: user.role // Include role in response
    });
  } catch (error) {
    next(error);
  }
};