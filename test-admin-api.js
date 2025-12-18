/**
 * DIAGNOSTIC SCRIPT: Test Admin Properties API
 * Run: node test-admin-api.js
 */

const http = require('http');

const testUrl = 'http://localhost:3000/api/admin/properties?userEmail=admin@ngventures.com&limit=1000';

console.log('🔍 Testing Admin Properties API...');
console.log('URL:', testUrl);
console.log('');

const req = http.get(testUrl, (res) => {
  let data = '';
  
  console.log('📡 Response Status:', res.statusCode, res.statusMessage);
  console.log('📋 Headers:', JSON.stringify(res.headers, null, 2));
  console.log('');
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('📦 Response Body Length:', data.length, 'bytes');
    console.log('');
    
    if (data.length === 0) {
      console.log('❌ ERROR: Empty response body!');
      return;
    }
    
    try {
      const json = JSON.parse(data);
      console.log('✅ Valid JSON Response:');
      console.log(JSON.stringify(json, null, 2));
      console.log('');
      
      if (json.properties) {
        console.log(`✅ Found ${json.properties.length} properties`);
        if (json.properties.length > 0) {
          console.log('📋 First property:', JSON.stringify(json.properties[0], null, 2));
        }
      } else {
        console.log('❌ No "properties" field in response');
      }
      
      if (json.success === false) {
        console.log('⚠️  API returned success: false');
        console.log('Error:', json.error);
      }
    } catch (e) {
      console.log('❌ Invalid JSON Response:');
      console.log('First 500 chars:', data.substring(0, 500));
      console.log('Parse Error:', e.message);
    }
  });
});

req.on('error', (error) => {
  console.log('❌ Request Error:', error.message);
  console.log('');
  console.log('💡 Make sure the Next.js dev server is running on port 3000');
});

req.setTimeout(10000, () => {
  console.log('❌ Request Timeout (10s)');
  req.destroy();
});

