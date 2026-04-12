/**
 * Run Slack integration migration
 * Usage: npx tsx scripts/run-slack-migration.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables');
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('🚀 Running Slack integration migration...\n');

  try {
    // Add slack_user_id column
    console.log('1. Adding slack_user_id column to profiles table...');
    const { error: alterError } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE profiles ADD COLUMN IF NOT EXISTS slack_user_id TEXT UNIQUE;'
    });

    if (alterError) {
      // Try direct approach
      const { error } = await supabase
        .from('profiles')
        .select('slack_user_id')
        .limit(1);
      
      if (error && error.message.includes('column "slack_user_id" does not exist')) {
        console.log('❌ Column does not exist. Please run this SQL in Supabase SQL Editor:');
        console.log('\nALTER TABLE profiles ADD COLUMN IF NOT EXISTS slack_user_id TEXT UNIQUE;');
        console.log('CREATE INDEX IF NOT EXISTS idx_profiles_slack_user_id ON profiles(slack_user_id);');
        console.log('\nGo to: https://supabase.com/dashboard/project/lcoyaqyrwrmokkezuagb/sql/new\n');
        process.exit(1);
      } else {
        console.log('✅ Column already exists or was added successfully');
      }
    } else {
      console.log('✅ Column added successfully');
    }

    console.log('\n✅ Migration completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Configure Slack slash commands');
    console.log('2. Link employee accounts in admin panel');
    console.log('3. Test with /checkin command\n');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.log('\nPlease run this SQL manually in Supabase SQL Editor:');
    console.log('\nALTER TABLE profiles ADD COLUMN IF NOT EXISTS slack_user_id TEXT UNIQUE;');
    console.log('CREATE INDEX IF NOT EXISTS idx_profiles_slack_user_id ON profiles(slack_user_id);');
    console.log('\nGo to: https://supabase.com/dashboard/project/lcoyaqyrwrmokkezuagb/sql/new\n');
    process.exit(1);
  }
}

runMigration();
