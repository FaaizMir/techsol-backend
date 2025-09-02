const { Sequelize } = require('sequelize')
const sequelize = new Sequelize("techsolutions", "root", "", {
  host: "localhost",
  dialect: "mysql"
});

module.exports = sequelize