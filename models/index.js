const { Sequelize } = require('sequelize')

const dbName = process.env.DB_NAME
const dbUser = process.env.DB_USER
const dbPass = process.env.DB_PASS
const dbHost = process.env.DB_HOST
const dbPort = process.env.DB_PORT || 3306
const dbDialect = 'mysql'

const sequelize = new Sequelize(dbName, dbUser, dbPass, {
  host: dbHost,
  port: dbPort,
  dialect: dbDialect,
    dialectModule: require('mysql2'), // Add this line

  logging: console.log
})

module.exports = sequelize
