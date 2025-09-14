const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  isOnboardingCompleted: { type: DataTypes.BOOLEAN, defaultValue: false }
})

module.exports = User