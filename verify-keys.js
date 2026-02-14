// Quick script to verify your Supabase keys are correct
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log('\n🔍 Checking your Supabase configuration...\n');

// Check URL
if (!url) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL is missing from .env.local');
  process.exit(1);
}

if (!url.startsWith('https://')) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL should start with https://');
  console.log('   Current value:', url);
  process.exit(1);
}

if (!url.includes('.supabase.co')) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_URL should end with .supabase.co');
  console.log('   Current value:', url);
  process.exit(1);
}

console.log('✅ Project URL looks correct:', url);

// Check anon key
if (!key) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY is missing from .env.local');
  process.exit(1);
}

if (key.startsWith('sb_secret_')) {
  console.log('❌ NEXT_PUBLIC_SUPABASE_ANON_KEY appears to be wrong format');
  console.log('   Keys starting with "sb_secret_" are not valid anon keys');
  console.log('   You need the JWT key that starts with "eyJ"');
  console.log('\n📝 How to fix:');
  console.log('   1. Go to https://supabase.com/dashboard');
  console.log('   2. Select your project');
  console.log('   3. Go to Settings → API');
  console.log('   4. Copy the "anon/public" key (starts with eyJ, very long)');
  console.log('   5. Replace in .env.local');
  process.exit(1);
}

if (!key.startsWith('eyJ')) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY has unexpected format');
  console.log('   Anon keys should start with "eyJ" (JWT format)');
  console.log('   Current value starts with:', key.substring(0, 10) + '...');
  console.log('\n   This might still work, but double-check it\'s the anon key, not service_role');
}

if (key.length < 100) {
  console.log('⚠️  NEXT_PUBLIC_SUPABASE_ANON_KEY seems too short');
  console.log('   Anon keys are typically 200+ characters long');
  console.log('   Current length:', key.length);
  console.log('   Make sure you copied the entire key');
}

console.log('✅ Anon key format looks correct (length:', key.length + ')');

console.log('\n🧪 Testing connection to Supabase...\n');

// Test the edge function
const testUrl = `${url}/functions/v1/cleveland-museum`;
const testBody = JSON.stringify({ action: 'search', query: 'test', limit: 1 });

fetch(testUrl, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${key}`
  },
  body: testBody
})
  .then(res => {
    if (res.status === 401) {
      console.log('❌ Authentication failed (401 Unauthorized)');
      console.log('   Your anon key is invalid or incorrect');
      console.log('\n📝 How to fix:');
      console.log('   1. Go to https://supabase.com/dashboard');
      console.log('   2. Select your project');
      console.log('   3. Go to Settings → API');
      console.log('   4. Copy the "anon/public" key (NOT service_role)');
      console.log('   5. Replace NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local');
      console.log('   6. Restart dev server: npm run dev');
      process.exit(1);
    }

    if (res.status === 404) {
      console.log('❌ Edge function not found (404)');
      console.log('   The cleveland-museum function is not deployed');
      console.log('\n📝 How to fix:');
      console.log('   Run: npx supabase functions deploy cleveland-museum');
      process.exit(1);
    }

    if (!res.ok) {
      console.log(`⚠️  Edge function returned status ${res.status}`);
      return res.text().then(text => {
        console.log('   Response:', text);
        process.exit(1);
      });
    }

    return res.json();
  })
  .then(data => {
    if (data && data.success) {
      console.log('✅ Edge function responded successfully!');
      console.log('✅ Your keys are working correctly!');
      console.log('\n🎉 Everything is configured properly.');
      console.log('   You should be able to search at http://localhost:3000');
    } else {
      console.log('⚠️  Edge function responded but with unexpected format');
      console.log('   Response:', JSON.stringify(data, null, 2));
    }
  })
  .catch(err => {
    console.log('❌ Connection failed:', err.message);
    console.log('\n   Possible causes:');
    console.log('   - No internet connection');
    console.log('   - Supabase project is paused');
    console.log('   - Edge function not deployed');
  });
