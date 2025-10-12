const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testClientProposalDocuments() {
  try {
    console.log('🔐 Logging in as regular user...');

    // First, let's login as admin to create a test user if needed
    const adminLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'admin@example.com',
      password: 'admin123'
    });

    const adminToken = adminLogin.data.token;
    console.log('✅ Admin login successful');

    // Get a regular user
    const usersResponse = await axios.get(`${BASE_URL}/admin/users`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    if (usersResponse.data.data.length === 0) {
      console.log('❌ No regular users found');
      return;
    }

    const testUser = usersResponse.data.data[0];
    console.log('✅ Found test user:', testUser.email);

    // Login as the regular user
    const userLogin = await axios.post(`${BASE_URL}/auth/login`, {
      email: testUser.email,
      password: 'password123' // Assuming default password
    });

    const userToken = userLogin.data.token;
    console.log('✅ User login successful');

    const userHeaders = {
      Authorization: `Bearer ${userToken}`,
      'Content-Type': 'application/json'
    };

    console.log('\n📄 Testing Client Proposal Document Endpoints...');

    // Test 1: Get user's proposal documents (should be empty initially)
    console.log('\n1. Getting user proposal documents...');
    const getAllResponse = await axios.get(`${BASE_URL}/proposals`, { headers: userHeaders });
    console.log('✅ GET /proposals:', getAllResponse.data);

    // Get user's projects to use for testing
    const projectsResponse = await axios.get(`${BASE_URL}/dashboard/projects`, { headers: userHeaders });
    if (projectsResponse.data.data.length === 0) {
      console.log('❌ User has no projects');
      return;
    }

    const testProject = projectsResponse.data.data[0];
    console.log('✅ Found test project:', testProject.title);

    // Test 2: Create a proposal document
    console.log('\n2. Creating a proposal document...');
    const createData = {
      projectId: testProject.id,
      content: 'This is a client-submitted proposal document. It contains the project proposal details and requirements.'
    };

    const createResponse = await axios.post(`${BASE_URL}/proposals`, createData, { headers: userHeaders });
    console.log('✅ POST /proposals:', createResponse.data);

    const documentId = createResponse.data.data.id;

    // Test 3: Get user's proposal documents again (should have 1)
    console.log('\n3. Getting user proposal documents again...');
    const getAllResponse2 = await axios.get(`${BASE_URL}/proposals`, { headers: userHeaders });
    console.log('✅ GET /proposals:', getAllResponse2.data);

    // Test 4: Get specific proposal document
    console.log('\n4. Getting specific proposal document...');
    const getByIdResponse = await axios.get(`${BASE_URL}/proposals/${documentId}`, { headers: userHeaders });
    console.log('✅ GET /proposals/:id:', getByIdResponse.data);

    // Test 5: Create another proposal document for the same project (should be allowed)
    console.log('\n5. Creating another proposal document for same project...');
    const createData2 = {
      projectId: testProject.id,
      content: 'This is a second proposal document for the same project. Multiple documents are allowed.'
    };

    const createResponse2 = await axios.post(`${BASE_URL}/proposals`, createData2, { headers: userHeaders });
    console.log('✅ POST /proposals (second):', createResponse2.data);

    // Test 6: Get all proposal documents (should have 2)
    console.log('\n6. Getting all user proposal documents...');
    const getAllResponse3 = await axios.get(`${BASE_URL}/proposals`, { headers: userHeaders });
    console.log('✅ GET /proposals (final):', getAllResponse3.data);

    console.log('\n🎉 All client proposal document tests completed successfully!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testClientProposalDocuments();