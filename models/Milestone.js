const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Milestone = sequelize.define('Milestone', {
  title: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      len: [3, 100]
    }
  },
  deliverable: {
    type: DataTypes.TEXT,
    allowNull: false,
    validate: {
      len: [5, 500]
    }
  },
  deadline: {
    type: DataTypes.DATE,
    allowNull: false
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0
    }
  },
  status: {
    type: DataTypes.ENUM('pending', 'in-progress', 'completed', 'overdue'),
    defaultValue: 'pending'
  },
  order: {
    type: DataTypes.INTEGER,
    allowNull: false
  }
}, {
  timestamps: true
});

module.exports = Milestone;