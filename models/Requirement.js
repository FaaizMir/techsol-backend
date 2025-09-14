const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Requirement = sequelize.define('Requirement', {
  notes: {
    type: DataTypes.TEXT,
    validate: {
      len: [0, 2000]
    }
  },
  files: {
    type: DataTypes.JSON, // Array of file objects
    defaultValue: []
  }
}, {
  timestamps: true
});

module.exports = Requirement;