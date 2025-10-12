const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function debugAdmin() {
    try {
        await sequelize.authenticate();
        console.log('🔗 Database connected');
        
        // Check if admin user exists
        const adminUser = await User.findOne({
            where: { email: 'admin@example.com' }
        });
        
        if (!adminUser) {
            console.log('❌ Admin user NOT found in database');
            
            // Let's see what users exist
            const allUsers = await User.findAll({
                attributes: ['id', 'email', 'role']
            });
            console.log('📋 All users in database:', allUsers.map(u => ({
                id: u.id,
                email: u.email,
                role: u.role
            })));
            
            // Create admin user if not exists
            console.log('🔨 Creating admin user...');
            const hashedPassword = await bcrypt.hash('admin123', 10);
            const newAdmin = await User.create({
                email: 'admin@example.com',
                password: hashedPassword,
                role: 'admin',
                isOnboardingCompleted: true,
                firstName: 'Admin',
                lastName: 'User'
            });
            console.log('✅ Admin user created:', {
                id: newAdmin.id,
                email: newAdmin.email,
                role: newAdmin.role
            });
            
        } else {
            console.log('✅ Admin user found:', {
                id: adminUser.id,
                email: adminUser.email,
                role: adminUser.role,
                isOnboardingCompleted: adminUser.isOnboardingCompleted
            });
            
            // Test password
            const passwordTest = await bcrypt.compare('admin123', adminUser.password);
            console.log('🔐 Password test for "admin123":', passwordTest ? '✅ CORRECT' : '❌ WRONG');
            
            if (!passwordTest) {
                console.log('🔧 Fixing password...');
                const hashedPassword = await bcrypt.hash('admin123', 10);
                await adminUser.update({ password: hashedPassword });
                console.log('✅ Password updated');
            }
        }
        
    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
        console.log('👋 Database connection closed');
    }
}

debugAdmin();