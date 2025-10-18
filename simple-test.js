// Simple test without changing files that would trigger nodemon
const https = require('https');
const http = require('http');

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
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('🚀 Testing login endpoint...');
console.log('URL: http://localhost:5000/api/auth/login');
console.log('Body:', postData);

const req = http.request(options, (res) => {
  console.log(`📋 Status Code: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  
  let responseBody = '';
  res.on('data', (chunk) => {
    responseBody += chunk;
  });
  
  res.on('end', () => {
    console.log('📋 Response Body:', responseBody);
    
    if (res.statusCode === 200) {
      const data = JSON.parse(responseBody);
      console.log('✅ Login successful!');
      console.log('🔑 Token:', data.token ? 'Present' : 'Missing');
      console.log('👤 User role:', data.role);
      console.log('📧 User email:', data.user?.email);
    } else {
      console.log('❌ Login failed!');
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Request error:', error.message);
});

req.write(postData);
req.end();