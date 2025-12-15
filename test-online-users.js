#!/usr/bin/env node

/**
 * Test Script for Sign2Talk Online Users API
 * 
 * This script demonstrates how to query the Sign2Talk online users API
 * Run with: node test-online-users.js
 */

const http = require('http');

const SERVER_URL = 'http://localhost:5000';

// Function to make GET request
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${SERVER_URL}${endpoint}`;
    
    http.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (error) {
          reject(new Error('Failed to parse response'));
        }
      });
    }).on('error', (error) => {
      reject(error);
    });
  });
}

// Test the API endpoints
async function testOnlineUsersAPI() {
  console.log('🚀 Testing Sign2Talk Online Users API\n');
  console.log('=' .repeat(60));
  
  try {
    // Test 1: Get online users count
    console.log('\n📊 Test 1: Get Online Users Count');
    console.log('-' .repeat(60));
    const countData = await makeRequest('/api/sign2talk/online-count');
    console.log('✅ Response:', JSON.stringify(countData, null, 2));
    console.log(`👥 Users online: ${countData.count}`);
    
    // Test 2: Get detailed online users list
    console.log('\n📋 Test 2: Get Detailed Online Users List');
    console.log('-' .repeat(60));
    const usersData = await makeRequest('/api/sign2talk/online-users');
    console.log('✅ Response:', JSON.stringify(usersData, null, 2));
    
    if (usersData.users && usersData.users.length > 0) {
      console.log('\n👥 Online Users Details:');
      usersData.users.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.userName} (ID: ${user.userId})`);
        console.log(`      Avatar: ${user.userAvatar}`);
      });
    } else {
      console.log('   ℹ️  No users currently online');
    }
    
    // Test 3: Health check
    console.log('\n💚 Test 3: Server Health Check');
    console.log('-' .repeat(60));
    const healthData = await makeRequest('/api/health');
    console.log('✅ Response:', JSON.stringify(healthData, null, 2));
    
    console.log('\n' + '=' .repeat(60));
    console.log('✨ All tests completed successfully!\n');
    
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('\n💡 Make sure the server is running on port 5000');
    console.error('   Run: npm start (in the server directory)\n');
    process.exit(1);
  }
}

// Usage examples for other languages
function showUsageExamples() {
  console.log('\n📚 API Usage Examples:\n');
  
  console.log('1️⃣  cURL (Terminal):');
  console.log('   curl http://localhost:5000/api/sign2talk/online-count');
  console.log('   curl http://localhost:5000/api/sign2talk/online-users\n');
  
  console.log('2️⃣  JavaScript (Fetch):');
  console.log('   fetch("http://localhost:5000/api/sign2talk/online-count")');
  console.log('     .then(res => res.json())');
  console.log('     .then(data => console.log("Online users:", data.count));\n');
  
  console.log('3️⃣  Python (requests):');
  console.log('   import requests');
  console.log('   response = requests.get("http://localhost:5000/api/sign2talk/online-count")');
  console.log('   print(f"Online users: {response.json()[\'count\']}")\n');
  
  console.log('4️⃣  React Component:');
  console.log('   useEffect(() => {');
  console.log('     const fetchOnlineCount = async () => {');
  console.log('       const res = await fetch("http://localhost:5000/api/sign2talk/online-count");');
  console.log('       const data = await res.json();');
  console.log('       setOnlineCount(data.count);');
  console.log('     };');
  console.log('     fetchOnlineCount();');
  console.log('   }, []);\n');
}

// Run the tests
console.log('\n');
testOnlineUsersAPI().then(() => {
  showUsageExamples();
});
