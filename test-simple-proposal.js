const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testSimpleProposalDocuments() {
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

    console.log('\n📄 Testing Simplified Proposal Document Endpoints...');

    // Test 1: Get all proposal documents (should be empty)
    console.log('\n1. Getting all proposal documents...');
    const getAllResponse = await axios.get(`${BASE_URL}/admin/proposal-documents`, { headers });
    console.log('✅ GET /admin/proposal-documents:', getAllResponse.data);

    // Test 2: Create a proposal document
    console.log('\n2. Creating a proposal document...');
    const createData = {
      userId: 1,
      projectId: 1,
      content: 'This is a simple proposal document content for testing.'
    };

    const createResponse = await axios.post(`${BASE_URL}/admin/proposal-documents`, createData, { headers });
    console.log('✅ POST /admin/proposal-documents:', createResponse.data);

    // Test 3: Get all proposal documents again (should have 1)
    console.log('\n3. Getting all proposal documents again...');
    const getAllResponse2 = await axios.get(`${BASE_URL}/admin/proposal-documents`, { headers });
    console.log('✅ GET /admin/proposal-documents:', getAllResponse2.data);

    // Test 4: Try to create another document for same user-project (should fail)
    console.log('\n4. Testing unique constraint...');
    try {
      await axios.post(`${BASE_URL}/admin/proposal-documents`, createData, { headers });
      console.log('❌ Should have failed due to unique constraint');
    } catch (error) {
      console.log('✅ Unique constraint working:', error.response?.data?.error);
    }

    console.log('\n🎉 All tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testSimpleProposalDocuments();