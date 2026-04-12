/**
 * Run migration directly using Supabase client
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

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function runMigration() {
  console.log('🚀 Running attendance sessions migration...\n');

  try {
    // Read migration file
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '004_attendance_sessions.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    // Split into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 Found ${statements.length} SQL statements\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      
      const { error } = await supabase.rpc('exec_sql', { sql: statement });
      
      if (error) {
        console.error(`❌ Error in statement ${i + 1}:`, error.message);
        
        // Try direct query for some statements
        if (statement.includes('CREATE TABLE') || statement.includes('CREATE INDEX')) {
          console.log('⚠️  This statement needs to be run in SQL Editor');
        }
      } else {
        console.log(`✅ Statement ${i + 1} executed`);
      }
    }

    console.log('\n✅ Migration completed!');
    console.log('\nNote: If you see errors, please run the SQL manually in Supabase SQL Editor:');
    console.log('https://supabase.com/dashboard/project/lcoyaqyrwrmokkezuagb/sql/new\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please run the migration manually in Supabase SQL Editor');
    console.log('File: supabase/migrations/004_attendance_sessions.sql');
    process.exit(1);
  }
}

runMigration();
