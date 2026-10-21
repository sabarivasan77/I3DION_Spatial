// Test the live API endpoint
import https from 'https';

function apiRequest(hostname, path, method, body) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname,
      path,
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {})
      }
    };
    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, body: JSON.parse(data), headers: res.headers });
        } catch(e) {
          resolve({ status: res.statusCode, body: data, headers: res.headers });
        }
      });
    });
    req.on('error', reject);
    if (postData) req.write(postData);
    req.end();
  });
}

async function main() {
  const HOST = 'i3-dion-spatial.vercel.app';
  
  console.log('=== Testing Live API ===\n');
  
  // Test 1: Health check (if exists)
  console.log('1. GET /api/health');
  try {
    const r = await apiRequest(HOST, '/api/health', 'GET');
    console.log('   Status:', r.status, 'Body:', JSON.stringify(r.body));
  } catch(e) {
    console.log('   Error:', e.message);
  }
  
  // Test 2: Try login with known credentials
  console.log('\n2. POST /api/auth/login');
  try {
    const r = await apiRequest(HOST, '/api/auth/login', 'POST', {
      email: 'sabarnievasansv07@outlsook.com',
      password: 'test123'
    });
    console.log('   Status:', r.status);
    if (r.status === 200) {
      console.log('   ✅ LOGIN SUCCESS:', JSON.stringify(r.body, null, 2));
    } else {
      console.log('   Body:', JSON.stringify(r.body));
    }
  } catch(e) {
    console.log('   Error:', e.message);
  }
  
  // Test 3: Test signup
  console.log('\n3. POST /api/auth/signup (test)');
  try {
    const r = await apiRequest(HOST, '/api/auth/signup', 'POST', {
      name: 'Test User',
      email: `test_${Date.now()}@example.com`,
      password: 'TestPass123!@#',
      organizationName: 'Test Org'
    });
    console.log('   Status:', r.status);
    if (r.status === 201) {
      console.log('   ✅ SIGNUP SUCCESS! Token:', r.body.token ? 'present' : 'missing');
    } else {
      console.log('   Body:', JSON.stringify(r.body));
    }
  } catch(e) {
    console.log('   Error:', e.message);
  }
}

main().catch(console.error);
