const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OnboardingProgress = sequelize.define('OnboardingProgress', {
  currentStep: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
      max: 5
    }
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  completedSteps: {
    type: DataTypes.JSON, // Array of numbers
    defaultValue: []
  },
  lastUpdated: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: true
});

module.exports = OnboardingProgress;