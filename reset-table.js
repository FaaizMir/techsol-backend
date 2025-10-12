const { Sequelize } = require('sequelize');
const config = require('./config/database.config.js');

const sequelize = new Sequelize(config.development);

async function resetTable() {
  try {
    await sequelize.authenticate();
    console.log('Connected to database');

    // Drop the table if it exists
    await sequelize.query('DROP TABLE IF EXISTS `ProposalDocuments`');
    console.log('Dropped ProposalDocuments table');

    // Run the migration to recreate it
    const { execSync } = require('child_process');
    execSync('npx sequelize-cli db:migrate --name 20251008073927-create-proposal-documents.js', { stdio: 'inherit' });
    console.log('Recreated ProposalDocuments table');

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

resetTable();