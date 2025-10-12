const axios = require('axios');

async function testLoginEndpoint() {
  try {
    const response = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    console.log('✅ Login successful!');
    console.log('Response data:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.log('❌ Login failed!');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error data:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }
}

testLoginEndpoint();