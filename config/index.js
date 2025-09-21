require('dotenv').config({
  path: process.env.NODE_ENV === 'development' ? '.env.development' : '.env',
});

module.exports = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'default_secret',
  corsOrigins: ['http://localhost:3000', 'https://techsol-five.vercel.app'],
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
    name: process.env.DB_NAME || 'techsolutions',
    dialect: 'mysql',
    logging: false, // Disable query logging
  },
};