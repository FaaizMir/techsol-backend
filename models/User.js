const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING, unique: true, allowNull: false },
  password: { type: DataTypes.STRING, allowNull: false },
  isOnboardingCompleted: { type: DataTypes.BOOLEAN, defaultValue: false },
  firstName: { type: DataTypes.STRING, allowNull: true },
  lastName: { type: DataTypes.STRING, allowNull: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  company: { type: DataTypes.STRING, allowNull: true },
  profilePicture: { type: DataTypes.STRING, allowNull: true },
  bio: { type: DataTypes.TEXT, allowNull: true },
  address: { type: DataTypes.TEXT, allowNull: true },
  city: { type: DataTypes.STRING, allowNull: true },
  country: { type: DataTypes.STRING, allowNull: true },
  timezone: { type: DataTypes.STRING, defaultValue: 'UTC' },
  emailNotifications: { type: DataTypes.BOOLEAN, defaultValue: true },
  pushNotifications: { type: DataTypes.BOOLEAN, defaultValue: true }
})

module.exports = User