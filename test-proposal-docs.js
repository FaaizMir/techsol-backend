// Test script for proposal documents
const sequelize = require('./config/database');
const ProposalDocument = require('./models/ProposalDocument');
const User = require('./models/User');

async function testProposalDocuments() {
    try {
        await sequelize.authenticate();
        console.log('🔗 Database connected');

        // Sync the database to create tables
        await sequelize.sync({ alter: true });
        console.log('📋 Database synced');

        // Check if admin user exists
        const admin = await User.findOne({ where: { email: 'admin@example.com' } });
        if (!admin) {
            console.log('❌ Admin user not found');
            return;
        }
        console.log('✅ Admin user found:', admin.email);

        // Check if regular user exists
        const regularUser = await User.findOne({
            where: { role: 'user' },
            order: [['createdAt', 'ASC']]
        });

        if (!regularUser) {
            console.log('❌ No regular user found to test with');
            return;
        }

        console.log('✅ Regular user found:', regularUser.email);

        // Test creating a proposal document
        const testDoc = await ProposalDocument.create({
            userId: regularUser.id,
            title: 'Test Project Proposal',
            content: 'This is a comprehensive project proposal document with all the details...',
            documentType: 'project_proposal',
            status: 'submitted',
            submittedAt: new Date(),
            metadata: {
                projectType: 'web-development',
                estimatedBudget: 5000,
                timeline: '3 months'
            }
        });

        console.log('✅ Proposal document created:', {
            id: testDoc.id,
            title: testDoc.title,
            status: testDoc.status
        });

        // Test fetching all proposal documents
        const allDocs = await ProposalDocument.findAll({
            include: [{
                model: User,
                as: 'user',
                attributes: ['email', 'firstName', 'lastName']
            }]
        });

        console.log('📄 All proposal documents:', allDocs.length);
        allDocs.forEach(doc => {
            console.log(`  - ${doc.title} by ${doc.user.email} (${doc.status})`);
        });

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await sequelize.close();
        console.log('👋 Database connection closed');
    }
}

testProposalDocuments();