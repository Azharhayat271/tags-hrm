/**
 * Debug storage policies and user role
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
const envPath = join(__dirname, '..', '.env');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1].trim()] = match[2].trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function debugPolicies() {
  console.log('🔍 Debugging storage policies...\n');

  try {
    // Check storage policies
    console.log('1. Checking storage policies on storage.objects:');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', { 
        sql: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
          FROM pg_policies 
          WHERE tablename = 'objects' 
          AND schemaname = 'storage'
          ORDER BY policyname;
        `
      });

    if (policiesError) {
      console.log('   Using alternative query...');
      // Try direct query
      const { data: altPolicies, error: altError } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'objects')
        .eq('schemaname', 'storage');
      
      if (altError) {
        console.log('   ⚠️  Cannot query policies directly');
        console.log('   Please check manually in Supabase Dashboard > Database > Policies');
      } else {
        console.log('   Found policies:', altPolicies?.length || 0);
      }
    } else {
      console.log('   Found policies:', policies?.length || 0);
    }

    // Check bucket
    console.log('\n2. Checking salary-slips bucket:');
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('   ❌ Error:', bucketsError.message);
    } else {
      const salaryBucket = buckets.find(b => b.id === 'salary-slips');
      if (salaryBucket) {
        console.log('   ✅ Bucket exists');
        console.log('   - Public:', salaryBucket.public);
        console.log('   - File size limit:', salaryBucket.file_size_limit);
        console.log('   - Allowed MIME types:', salaryBucket.allowed_mime_types);
      } else {
        console.log('   ❌ Bucket not found');
      }
    }

    // Suggest SQL to run
    console.log('\n3. SQL to check policies manually:');
    console.log('─'.repeat(60));
    console.log(`
SELECT 
  policyname, 
  cmd as operation,
  qual as using_expression,
  with_check as with_check_expression
FROM pg_policies 
WHERE tablename = 'objects' 
  AND schemaname = 'storage'
  AND policyname LIKE '%salary%'
ORDER BY policyname;
    `);
    console.log('─'.repeat(60));

    console.log('\n4. Recommended fix:');
    console.log('   If no policies are found, run this SQL in Supabase SQL Editor:\n');
    console.log('   File: supabase/migrations/002c_storage_policies_fixed.sql');

  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

debugPolicies();
