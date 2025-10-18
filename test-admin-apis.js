/**
 * Admin API Test Script
 * 
 * This script tests all the admin API endpoints to ensure they're working correctly.
 * Make sure your server is running before executing this script.
 * 
 * Usage: node test-admin-apis.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'admin123';

let TOKEN = '';
let createdIds = {
  project: null,
  client: null,
  milestone: null,
  requirement: null
};

// Helper function to make authenticated requests
const api = {
  get: (url) => axios.get(`${BASE_URL}${url}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  }),
  post: (url, data) => axios.post(`${BASE_URL}${url}`, data, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  }),
  put: (url, data) => axios.put(`${BASE_URL}${url}`, data, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  }),
  delete: (url) => axios.delete(`${BASE_URL}${url}`, {
    headers: { Authorization: `Bearer ${TOKEN}` }
  })
};

// Test functions
const tests = {
  // 1. Authentication
  async login() {
    console.log('\n🔐 Testing Authentication...');
    try {
      const response = await axios.post(`${BASE_URL}/auth/login`, {
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD
      });
      TOKEN = response.data.token;
      console.log('✅ Login successful');
      console.log(`   Token: ${TOKEN.substring(0, 20)}...`);
      return true;
    } catch (error) {
      console.error('❌ Login failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 2. Dashboard Stats
  async dashboardStats() {
    console.log('\n📊 Testing Dashboard Stats...');
    try {
      const response = await api.get('/admin/dashboard/stats');
      console.log('✅ Dashboard stats fetched');
      console.log('   Users:', response.data.data.users);
      console.log('   Projects:', response.data.data.projects);
      console.log('   Finance:', response.data.data.finance);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 3. Project Analytics
  async projectAnalytics() {
    console.log('\n📈 Testing Project Analytics...');
    try {
      const response = await api.get('/admin/dashboard/analytics/projects');
      console.log('✅ Project analytics fetched');
      console.log('   Completion Rate:', response.data.data.completionRate + '%');
      console.log('   Avg Duration:', response.data.data.averageProjectDuration, 'days');
      console.log('   Overdue Projects:', response.data.data.overdueProjects);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 4. Get Users
  async getUsers() {
    console.log('\n👥 Testing Get Users...');
    try {
      const response = await api.get('/admin/users');
      console.log('✅ Users fetched');
      console.log(`   Found ${response.data.count} users`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 5. Get Projects
  async getProjects() {
    console.log('\n📁 Testing Get Projects...');
    try {
      const response = await api.get('/admin/projects');
      console.log('✅ Projects fetched');
      console.log(`   Found ${response.data.count} projects`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 6. Create Client
  async createClient() {
    console.log('\n🏢 Testing Create Client...');
    try {
      const response = await api.post('/admin/clients', {
        name: 'Test Client ' + Date.now(),
        email: `test${Date.now()}@example.com`,
        company: 'Test Company',
        country: 'USA',
        phone: '+1234567890'
      });
      createdIds.client = response.data.data.id;
      console.log('✅ Client created');
      console.log(`   ID: ${createdIds.client}`);
      console.log(`   Name: ${response.data.data.name}`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 7. Get Clients
  async getClients() {
    console.log('\n🏢 Testing Get Clients...');
    try {
      const response = await api.get('/admin/clients');
      console.log('✅ Clients fetched');
      console.log(`   Found ${response.data.count} clients`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 8. Create Project
  async createProject() {
    console.log('\n📝 Testing Create Project...');
    try {
      // Get first user
      const usersRes = await api.get('/admin/users');
      if (usersRes.data.count === 0) {
        console.log('⚠️  No users found, skipping project creation');
        return true;
      }
      
      const userId = usersRes.data.data[0].id;
      
      const response = await api.post('/admin/projects', {
        userId: userId,
        clientId: createdIds.client,
        title: 'Test Project ' + Date.now(),
        description: 'This is a test project created by the test script',
        category: 'web-development',
        deadline: '2025-12-31',
        budget: 50000,
        priority: 'high'
      });
      createdIds.project = response.data.data.id;
      console.log('✅ Project created');
      console.log(`   ID: ${createdIds.project}`);
      console.log(`   Title: ${response.data.data.title}`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 9. Get Project by ID
  async getProjectById() {
    if (!createdIds.project) {
      console.log('\n⚠️  Skipping Get Project by ID (no project created)');
      return true;
    }
    console.log('\n🔍 Testing Get Project by ID...');
    try {
      const response = await api.get(`/admin/projects/${createdIds.project}`);
      console.log('✅ Project fetched');
      console.log(`   Title: ${response.data.data.title}`);
      console.log(`   Status: ${response.data.data.status}`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 10. Update Project Status
  async updateProjectStatus() {
    if (!createdIds.project) {
      console.log('\n⚠️  Skipping Update Project Status (no project created)');
      return true;
    }
    console.log('\n✏️  Testing Update Project Status...');
    try {
      const response = await api.put(`/admin/projects/${createdIds.project}/status`, {
        status: 'active'
      });
      console.log('✅ Project status updated');
      console.log(`   New status: ${response.data.data.status}`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 11. Create Milestone
  async createMilestone() {
    if (!createdIds.project) {
      console.log('\n⚠️  Skipping Create Milestone (no project created)');
      return true;
    }
    console.log('\n🎯 Testing Create Milestone...');
    try {
      const response = await api.post(`/admin/projects/${createdIds.project}/milestones`, {
        title: 'Test Milestone',
        deliverable: 'Test deliverable',
        deadline: '2025-11-30',
        amount: 10000,
        order: 1
      });
      createdIds.milestone = response.data.data.id;
      console.log('✅ Milestone created');
      console.log(`   ID: ${createdIds.milestone}`);
      console.log(`   Title: ${response.data.data.title}`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 12. Get Milestones
  async getMilestones() {
    console.log('\n🎯 Testing Get Milestones...');
    try {
      const response = await api.get('/admin/milestones');
      console.log('✅ Milestones fetched');
      console.log(`   Found ${response.data.count} milestones`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 13. Create Requirement
  async createRequirement() {
    if (!createdIds.project) {
      console.log('\n⚠️  Skipping Create Requirement (no project created)');
      return true;
    }
    console.log('\n📋 Testing Create Requirement...');
    try {
      const response = await api.post(`/admin/projects/${createdIds.project}/requirements`, {
        notes: 'Test requirement notes',
        files: []
      });
      createdIds.requirement = response.data.data.id;
      console.log('✅ Requirement created');
      console.log(`   ID: ${createdIds.requirement}`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 14. Get Requirements
  async getRequirements() {
    console.log('\n📋 Testing Get Requirements...');
    try {
      const response = await api.get('/admin/requirements');
      console.log('✅ Requirements fetched');
      console.log(`   Found ${response.data.count} requirements`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 15. Get Conversations
  async getConversations() {
    console.log('\n💬 Testing Get Conversations...');
    try {
      const response = await api.get('/admin/conversations');
      console.log('✅ Conversations fetched');
      console.log(`   Found ${response.data.data.length} conversations`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 16. Get Documents
  async getDocuments() {
    console.log('\n📄 Testing Get Documents...');
    try {
      const response = await api.get('/admin/documents');
      console.log('✅ Documents fetched');
      console.log(`   Found ${response.data.data.length} documents`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // 17. Search Projects
  async searchProjects() {
    console.log('\n🔍 Testing Search Projects...');
    try {
      const response = await api.get('/admin/projects/search?query=test&page=1&limit=5');
      console.log('✅ Project search successful');
      console.log(`   Found ${response.data.data.pagination.total} results`);
      return true;
    } catch (error) {
      console.error('❌ Failed:', error.response?.data || error.message);
      return false;
    }
  },

  // Cleanup - Delete created resources
  async cleanup() {
    console.log('\n🧹 Cleaning up test data...');
    let cleanupSuccess = true;

    // Delete milestone
    if (createdIds.milestone) {
      try {
        await api.delete(`/admin/milestones/${createdIds.milestone}`);
        console.log('✅ Test milestone deleted');
      } catch (error) {
        console.log('⚠️  Failed to delete milestone');
        cleanupSuccess = false;
      }
    }

    // Delete requirement
    if (createdIds.requirement) {
      try {
        await api.delete(`/admin/requirements/${createdIds.requirement}`);
        console.log('✅ Test requirement deleted');
      } catch (error) {
        console.log('⚠️  Failed to delete requirement');
        cleanupSuccess = false;
      }
    }

    // Delete project
    if (createdIds.project) {
      try {
        await api.delete(`/admin/projects/${createdIds.project}`);
        console.log('✅ Test project deleted');
      } catch (error) {
        console.log('⚠️  Failed to delete project');
        cleanupSuccess = false;
      }
    }

    // Delete client
    if (createdIds.client) {
      try {
        await api.delete(`/admin/clients/${createdIds.client}`);
        console.log('✅ Test client deleted');
      } catch (error) {
        console.log('⚠️  Failed to delete client');
        cleanupSuccess = false;
      }
    }

    return cleanupSuccess;
  }
};

// Main test runner
async function runTests() {
  console.log('╔════════════════════════════════════════════╗');
  console.log('║     Admin API Test Suite                  ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\nTesting against: ${BASE_URL}`);
  console.log(`Admin email: ${ADMIN_EMAIL}`);

  let passed = 0;
  let failed = 0;

  const testList = [
    tests.login,
    tests.dashboardStats,
    tests.projectAnalytics,
    tests.getUsers,
    tests.getProjects,
    tests.createClient,
    tests.getClients,
    tests.createProject,
    tests.getProjectById,
    tests.updateProjectStatus,
    tests.createMilestone,
    tests.getMilestones,
    tests.createRequirement,
    tests.getRequirements,
    tests.getConversations,
    tests.getDocuments,
    tests.searchProjects
  ];

  for (const test of testList) {
    const result = await test();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }

  // Cleanup
  await tests.cleanup();

  // Results
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║     Test Results                          ║');
  console.log('╚════════════════════════════════════════════╝');
  console.log(`\n✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📊 Total:  ${passed + failed}`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! Admin APIs are working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check the errors above.');
  }
}

// Run the tests
runTests().catch(error => {
  console.error('\n💥 Fatal error:', error.message);
  process.exit(1);
});
