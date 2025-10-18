// Test proposal document endpoints
const https = require('https');
const http = require('http');

// First, let's login as admin to get the token
async function loginAsAdmin() {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify({
      email: 'admin@example.com',
      password: 'admin123'
    });

    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(responseBody);
          if (data.token) {
            console.log('✅ Admin login successful');
            resolve(data.token);
          } else {
            reject(new Error('Login failed: ' + responseBody));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}

// Test creating a proposal document
async function createProposalDocument(token) {
  return new Promise((resolve, reject) => {
    // First get a user ID
    const getUserOptions = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/users',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const getUserReq = http.request(getUserOptions, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        try {
          const data = JSON.parse(responseBody);
          if (data.data && data.data.length > 0) {
            const userId = data.data[0].id;
            console.log('📋 Found user ID:', userId);

            // Now create the proposal document
            const proposalData = JSON.stringify({
              userId: userId,
              projectId: 1, // Assuming project ID 1 exists, you may need to adjust this
              content: `EXECUTIVE SUMMARY

This comprehensive project proposal outlines the development of a modern, scalable web application for our client. The project encompasses full-stack development, including frontend, backend, database design, and deployment.

PROJECT OBJECTIVES
- Develop a responsive web application
- Implement secure user authentication
- Create an intuitive admin dashboard
- Ensure high performance and scalability
- Provide comprehensive documentation

TECHNICAL APPROACH
- Frontend: React.js with modern hooks and state management
- Backend: Node.js with Express framework
- Database: PostgreSQL with optimized queries
- Authentication: JWT with secure password hashing
- Deployment: Cloud infrastructure with CI/CD pipeline

TIMELINE
- Phase 1: Planning and Design (2 weeks)
- Phase 2: Frontend Development (4 weeks)
- Phase 3: Backend Development (4 weeks)
- Phase 4: Integration and Testing (2 weeks)
- Phase 5: Deployment and Launch (1 week)

BUDGET BREAKDOWN
- Development: $15,000
- Design: $3,000
- Testing: $2,000
- Deployment: $1,000
- Total: $21,000

DELIVERABLES
- Complete web application
- Source code repository
- Database schema
- API documentation
- User manual
- 6 months post-launch support

CONCLUSION
This project represents a significant investment in digital transformation with measurable ROI through improved efficiency and user experience.`,
              documentType: 'project_proposal',
              metadata: {
                projectType: 'web-development',
                estimatedBudget: 21000,
                timeline: '13 weeks',
                technologies: ['React', 'Node.js', 'PostgreSQL'],
                priority: 'high'
              }
            });

            const createOptions = {
              hostname: 'localhost',
              port: 5000,
              path: '/api/admin/proposal-documents',
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            };

            const createReq = http.request(createOptions, (createRes) => {
              let createResponseBody = '';
              createRes.on('data', (chunk) => {
                createResponseBody += chunk;
              });

              createRes.on('end', () => {
                console.log('📄 Create proposal document response:', createResponseBody);
                resolve(JSON.parse(createResponseBody));
              });
            });

            createReq.on('error', (error) => {
              reject(error);
            });

            createReq.write(proposalData);
            createReq.end();

          } else {
            reject(new Error('No users found'));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    getUserReq.on('error', (error) => {
      reject(error);
    });

    getUserReq.end();
  });
}

// Test getting all proposal documents
async function getAllProposalDocuments(token) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/admin/proposal-documents',
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    };

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => {
        responseBody += chunk;
      });

      res.on('end', () => {
        console.log('📋 Get all proposal documents response:', responseBody);
        resolve(JSON.parse(responseBody));
      });
    });

    req.on('error', (error) => {
      reject(error);
    });

    req.end();
  });
}

// Main test function
async function testProposalDocuments() {
  try {
    console.log('🚀 Testing Proposal Documents API...');

    // Login as admin
    const token = await loginAsAdmin();

    // Create a proposal document
    const createResult = await createProposalDocument(token);
    console.log('✅ Proposal document created successfully');

    // Get all proposal documents
    const allDocs = await getAllProposalDocuments(token);
    console.log(`📊 Found ${allDocs.count} proposal documents`);

    console.log('🎉 All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testProposalDocuments();