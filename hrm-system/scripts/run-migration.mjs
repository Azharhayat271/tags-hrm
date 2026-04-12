/**
 * Run Slack integration migration
 * Usage: node scripts/run-migration.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env file manually
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
  console.error('❌ Missing environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running Slack integration migration...\n');

  try {
    // Test if column exists
    console.log('Checking if slack_user_id column exists...');
    const { data, error } = await supabase
      .from('profiles')
      .select('slack_user_id')
      .limit(1);

    if (error && error.message.includes('column "slack_user_id" does not exist')) {
      console.log('❌ Column does not exist.');
      console.log('\n📋 Please run this SQL in Supabase SQL Editor:\n');
      console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slack_user_id TEXT UNIQUE;');
      console.log('CREATE INDEX IF NOT EXISTS idx_profiles_slack_user_id ON profiles(slack_user_id);\n');
      console.log('🔗 Go to: https://supabase.com/dashboard/project/lcoyaqyrwrmokkezuagb/sql/new\n');
      process.exit(1);
    } else {
      console.log('✅ Column already exists!\n');
      console.log('✅ Migration completed successfully!\n');
      console.log('Next steps:');
      console.log('1. Configure Slack slash commands');
      console.log('2. Link employee accounts in admin panel');
      console.log('3. Test with /checkin command\n');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n📋 Please run this SQL manually in Supabase SQL Editor:\n');
    console.log('ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slack_user_id TEXT UNIQUE;');
    console.log('CREATE INDEX IF NOT EXISTS idx_profiles_slack_user_id ON profiles(slack_user_id);\n');
    console.log('🔗 Go to: https://supabase.com/dashboard/project/lcoyaqyrwrmokkezuagb/sql/new\n');
    process.exit(1);
  }
}

runMigration();
