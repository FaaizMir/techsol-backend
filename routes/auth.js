

const express = require('express')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')
const User = require('../models/User')




const router = express.Router()

// Signup
router.post('/signup', async (req, res) => {
  const { username, password } = req.body
  const hashedPassword = await bcrypt.hash(password, 10)
  try {
    const user = await User.create({ username, password: hashedPassword })
    res.status(201).json({ message: 'User created', user: { id: user.id, username: user.username } })
  } catch (err) {
    res.status(400).json({ error: 'Username already exists' })
  }
})

// Login
router.post('/login', async (req, res) => {
  const { username, password } = req.body
  const user = await User.findOne({ where: { username } })
  if (!user) return res.status(400).json({ error: 'Invalid credentials' })
  const valid = await bcrypt.compare(password, user.password)
  if (!valid) return res.status(400).json({ error: 'Invalid credentials' })
  const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '1m' })
  res.json({ token })
})

module.exports = router