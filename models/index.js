const { Sequelize } = require('sequelize')

// Database configuration from environment with safe defaults
const dbName = process.env.DB_NAME || 'techsolutions'
const dbUser = process.env.USERNAME || 'root'
const dbPass = process.env.PASSWORD || ''
const dbHost = process.env.HOST || 'localhost'
const dbPort = process.env.PORT ? parseInt(process.env.PORT, 10) : 3306
const dbDialect =  'mysql'

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect
})

module.exports = sequelize