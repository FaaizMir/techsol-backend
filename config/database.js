const { Sequelize } = require('sequelize');
const config = require('./index');

const sequelize = new Sequelize(
  config.database.name,
  config.database.user,
  config.database.password,
  {
    host: config.database.host,
    port: config.database.port,
    dialect: config.database.dialect,
    dialectModule: require('mysql2'),
    logging: config.database.logging ? console.log : false,
    pool: {
      max: 5,
      min: 0,
      acquire: 60000, // Increased to 60 seconds
      idle: 10000,
    },
    dialectOptions: {
      connectTimeout: 60000, // 60 seconds
    },
  }
);

module.exports = sequelize;