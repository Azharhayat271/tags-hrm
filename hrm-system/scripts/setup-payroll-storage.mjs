/**
 * Setup payroll storage bucket and policies
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
const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupStorage() {
  console.log('🚀 Setting up payroll storage bucket...\n');

  try {
    // Check if bucket already exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('❌ Error listing buckets:', listError.message);
      throw listError;
    }

    const bucketExists = buckets.some(b => b.id === 'salary-slips');

    if (bucketExists) {
      console.log('✅ Bucket "salary-slips" already exists');
    } else {
      // Create bucket
      console.log('📦 Creating bucket "salary-slips"...');
      const { data: bucket, error: createError } = await supabase.storage.createBucket('salary-slips', {
        public: false,
        fileSizeLimit: 10485760, // 10MB
        allowedMimeTypes: ['application/pdf']
      });

      if (createError) {
        console.error('❌ Error creating bucket:', createError.message);
        throw createError;
      }

      console.log('✅ Bucket created successfully');
    }

    // Now run the SQL migration for RLS policies
    console.log('\n📝 Setting up RLS policies...');
    
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '002_storage_setup.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements, skip the bucket creation
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
      .filter(s => !s.includes('insert into storage.buckets')); // Skip bucket creation

    console.log(`Found ${statements.length} policy statements\n`);

    // Note: RLS policies need to be created via SQL Editor
    console.log('⚠️  Storage RLS policies need to be created manually in Supabase SQL Editor');
    console.log('📋 Please run the following SQL in your Supabase SQL Editor:');
    console.log('   https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new\n');
    console.log('--- Copy and paste this SQL ---');
    console.log(statements.join(';\n\n') + ';');
    console.log('--- End of SQL ---\n');

    console.log('✅ Storage bucket setup completed!');
    console.log('\n📌 Next steps:');
    console.log('1. Copy the SQL above');
    console.log('2. Go to Supabase SQL Editor');
    console.log('3. Paste and run the SQL');
    console.log('4. Try uploading a salary slip again\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

setupStorage();
