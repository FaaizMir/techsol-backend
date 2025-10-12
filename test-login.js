const bcrypt = require('bcryptjs');
const User = require('./models/User');
const sequelize = require('./config/database');

async function testLogin() {
  try {
    await sequelize.authenticate();
    console.log('Database connected successfully.');
    
    // Find the admin user
    const admin = await User.findOne({ where: { email: 'admin@example.com' } });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('✅ Admin user found:');
    console.log('- Email:', admin.email);
    console.log('- Role:', admin.role);
    console.log('- ID:', admin.id);
    console.log('- Onboarding completed:', admin.isOnboardingCompleted);
    
    // Test password
    const testPassword = 'admin123';
    const isPasswordCorrect = await bcrypt.compare(testPassword, admin.password);
    
    console.log('🔐 Password test for "admin123":', isPasswordCorrect ? '✅ CORRECT' : '❌ INCORRECT');
    
    if (!isPasswordCorrect) {
      console.log('Stored password hash:', admin.password);
      console.log('Testing hash generation...');
      const newHash = await bcrypt.hash('admin123', 10);
      console.log('New hash would be:', newHash);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await sequelize.close();
  }
}

testLogin();