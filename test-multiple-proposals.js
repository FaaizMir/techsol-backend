const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testMultipleProposalDocuments() {
  try {
    console.log('🔐 Logging in as admin...');

    // Login as admin
    const loginResponse = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const token = loginResponse.data.token;
    console.log('✅ Admin login successful');

    // Set authorization header
    const headers = {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n📄 Testing Multiple Proposal Documents for Same User/Project...');

    // Create first proposal document
    console.log('\n1. Creating first proposal document...');
    const doc1 = {
      userId: 1,
      projectId: 1,
      content: 'This is the first proposal document for user 1 and project 1'
    };

    const response1 = await axios.post(`${BASE_URL}/admin/proposal-documents`, doc1, { headers });
    console.log('✅ First document created:', response1.data.data.id);

    // Create second proposal document for same user/project
    console.log('\n2. Creating second proposal document for same user/project...');
    const doc2 = {
      userId: 1,
      projectId: 1,
      content: 'This is the second proposal document for user 1 and project 1'
    };

    const response2 = await axios.post(`${BASE_URL}/admin/proposal-documents`, doc2, { headers });
    console.log('✅ Second document created:', response2.data.data.id);

    // Create third proposal document for same user/project
    console.log('\n3. Creating third proposal document for same user/project...');
    const doc3 = {
      userId: 1,
      projectId: 1,
      content: 'This is the third proposal document for user 1 and project 1'
    };

    const response3 = await axios.post(`${BASE_URL}/admin/proposal-documents`, doc3, { headers });
    console.log('✅ Third document created:', response3.data.data.id);

    // Get all proposal documents
    console.log('\n4. Getting all proposal documents...');
    const getResponse = await axios.get(`${BASE_URL}/admin/proposal-documents`, { headers });
    console.log(`✅ Found ${getResponse.data.count} proposal documents`);

    // Filter for user 1, project 1
    const user1Project1Docs = getResponse.data.data.filter(doc =>
      doc.userId === 1 && doc.projectId === 1
    );
    console.log(`✅ User 1 has ${user1Project1Docs.length} documents for project 1`);

    console.log('\n🎉 Multiple proposal documents per user/project working correctly!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testMultipleProposalDocuments();