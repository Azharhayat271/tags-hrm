// Quick verification script to check if database is set up correctly
// Run with: node verify-setup.js

require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function verifySetup() {
  console.log('🔍 Verifying HRM System Setup...\n');

  // Check connection
  console.log('1. Testing Supabase connection...');
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) throw error;
    console.log('   ✅ Connected to Supabase\n');
  } catch (error) {
    console.log('   ❌ Connection failed:', error.message);
    console.log('   💡 Check your .env credentials\n');
    return;
  }

  // Check tables
  console.log('2. Checking database tables...');
  const tables = [
    'profiles',
    'employees',
    'attendance',
    'breaks',
    'leave_types',
    'leave_requests',
    'public_holidays',
    'salary_slips',
    'lifecycle_events',
    'kpis',
    'performance_reviews'
  ];

  let allTablesExist = true;
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('count', { count: 'exact', head: true });
      if (error) throw error;
      console.log(`   ✅ ${table}`);
    } catch (error) {
      console.log(`   ❌ ${table} - ${error.message}`);
      allTablesExist = false;
    }
  }

  if (!allTablesExist) {
    console.log('\n   💡 Run the database migrations in Supabase SQL Editor\n');
    return;
  }

  console.log('\n3. Checking storage bucket...');
  try {
    const { data, error } = await supabase.storage.getBucket('salary-slips');
    if (error) throw error;
    console.log('   ✅ salary-slips bucket exists\n');
  } catch (error) {
    console.log('   ❌ salary-slips bucket not found');
    console.log('   💡 Run the storage migration in Supabase SQL Editor\n');
  }

  console.log('✨ Setup verification complete!\n');
  console.log('Next steps:');
  console.log('1. Start the dev server: npm run dev');
  console.log('2. Go to http://localhost:3000/login');
  console.log('3. Sign up with your email');
  console.log('4. Set your role to super_admin in Supabase dashboard\n');
}

verifySetup();
