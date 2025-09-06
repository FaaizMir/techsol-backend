const { Sequelize } = require('sequelize')

// Database configuration from environment with safe defaults
const dbName = process.env.DB_NAME || 'techsolutions'
const dbUser = process.env.DB_USER || 'root'
const dbPass = process.env.DB_PASS || ''
const dbHost = process.env.DB_HOST || 'localhost'
const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306
const dbDialect = process.env.DB_DIALECT || 'mysql'

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect
})

module.exports = sequelize