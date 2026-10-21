// Full auth flow test
import https from 'https';

function apiRequest(hostname, path, method, body, cookies) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const options = {
      hostname,
      path,
      method: method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'TestScript/1.0',
        ...(postData ? { 'Content-Length': Buffer.byteLength(postData) } : {}),
        ...(cookies ? { 'Cookie': cookies } : {})
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
  const testEmail = `full_test_${Date.now()}@testdomain.com`;
  const testPassword = 'SecureTest!@#456xyz';
  
  console.log('=== Full Auth Flow Test ===\n');
  
  // Test signup
  console.log('1. SIGNUP with:', testEmail);
  const signup = await apiRequest(HOST, '/api/auth/signup', 'POST', {
    name: 'Full Test User',
    email: testEmail,
    password: testPassword,
    organizationName: 'Full Test Corp'
  });
  console.log('   Status:', signup.status);
  if (signup.status === 201) {
    console.log('   ✅ SIGNUP SUCCESS');
    console.log('   Token present:', !!signup.body?.token);
    console.log('   User:', JSON.stringify(signup.body?.user));
    
    // Get refresh cookie
    const setCookie = signup.headers['set-cookie'];
    const refreshCookie = setCookie?.find(c => c.includes('refreshToken'));
    console.log('   Refresh cookie set:', !!refreshCookie);
    
    const token = signup.body?.token;
    
    // Test /me endpoint
    console.log('\n2. GET /api/auth/me (with JWT)');
    const me = await apiRequest(HOST, '/api/auth/me', 'GET', null);
    // Need to send auth header
    const meWithAuth = await new Promise((resolve, reject) => {
      const options = {
        hostname: HOST,
        path: '/api/auth/me',
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: JSON.parse(data) }));
      });
      req.on('error', reject);
      req.end();
    });
    console.log('   Status:', meWithAuth.status);
    if (meWithAuth.status === 200) {
      console.log('   ✅ /me SUCCESS:', JSON.stringify(meWithAuth.body));
    } else {
      console.log('   Body:', JSON.stringify(meWithAuth.body));
    }
    
    // Test logout
    console.log('\n3. POST /api/auth/logout');
    const logout = await new Promise((resolve, reject) => {
      const options = {
        hostname: HOST,
        path: '/api/auth/logout',
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...(refreshCookie ? { 'Cookie': refreshCookie.split(';')[0] } : {})
        }
      };
      const req = https.request(options, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ status: res.statusCode, body: data }));
      });
      req.on('error', reject);
      req.end();
    });
    console.log('   Status:', logout.status, logout.body.substring(0, 100));
    
    // Test login with same credentials
    console.log('\n4. LOGIN with same credentials');
    const login = await apiRequest(HOST, '/api/auth/login', 'POST', {
      email: testEmail,
      password: testPassword
    });
    console.log('   Status:', login.status);
    if (login.status === 200) {
      console.log('   ✅ LOGIN SUCCESS');
      console.log('   Token present:', !!login.body?.token);
      console.log('   User:', JSON.stringify(login.body?.user));
    } else {
      console.log('   Body:', JSON.stringify(login.body));
    }
    
  } else {
    console.log('   ❌ SIGNUP FAILED:', JSON.stringify(signup.body));
  }
  
  console.log('\n=== Test Complete ===');
}

main().catch(console.error);
