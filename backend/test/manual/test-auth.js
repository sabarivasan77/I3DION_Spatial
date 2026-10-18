import { createClient } from '@supabase/supabase-js';
const supabaseUrl = 'https://ytjqaasskfwtrnyxttso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl0anFhYXNza2Z3dHJueXh0dHNvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODYwNTkyNiwiZXhwIjoyMTA0MTgxOTI2fQ.KYCuDbm_wkKTzqqvHpRr7DwKR4EgLaByDRvN2dXX5PQ';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  console.log('Signing up dummy user...');
  const { data, error } = await supabase.auth.signUp({
    email: 'test_auth_script@example.com',
    password: 'TestPassword123!',
  });
  
  if (error && error.message !== 'User already registered') {
    console.error('Signup error:', error);
  }
  
  console.log('Logging in dummy user...');
  const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
    email: 'test_auth_script@example.com',
    password: 'TestPassword123!',
  });
  
  if (loginError) {
    console.error('Login error:', loginError);
    return;
  }
  
  const token = loginData.session.access_token;
  console.log('Got token:', token.substring(0, 20) + '...');
  
  console.log('Calling /api/me on Vercel...');
  const res = await fetch('https://i3-dion-spatial.vercel.app/api/me', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  
  console.log('Status:', res.status);
  const text = await res.text();
  console.log('Response:', text);
}

test();
