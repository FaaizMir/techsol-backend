'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    // Hash the admin password
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    // Check if admin user already exists
    const existingAdmin = await queryInterface.sequelize.query(
      "SELECT id FROM Users WHERE email = 'admin@example.com'",
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    if (existingAdmin.length === 0) {
      // Create new admin user
      await queryInterface.bulkInsert('Users', [{
        email: 'admin@example.com',
        password: hashedPassword,
        role: 'admin',
        isOnboardingCompleted: true,
        firstName: 'Admin',
        lastName: 'User',
        createdAt: new Date(),
        updatedAt: new Date()
      }]);
    } else {
      // Update existing admin user with correct role and password
      await queryInterface.sequelize.query(
        "UPDATE Users SET password = :password, role = 'admin', isOnboardingCompleted = true, firstName = 'Admin', lastName = 'User', updatedAt = :updatedAt WHERE email = 'admin@example.com'",
        {
          replacements: {
            password: hashedPassword,
            updatedAt: new Date()
          }
        }
      );
    }
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.bulkDelete('Users', {
      email: 'admin@example.com'
    });
  }
};
