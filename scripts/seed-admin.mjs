// Script to seed the admin user into Supabase with bcrypt password
// Run with: node scripts/seed-admin.mjs

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load .env.local manually
const envPath = resolve(__dirname, '../.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const eqIdx = trimmed.indexOf('=');
  if (eqIdx === -1) continue;
  const key = trimmed.substring(0, eqIdx).trim();
  const val = trimmed.substring(eqIdx + 1).trim();
  envVars[key] = val;
}

const supabaseUrl = envVars['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseServiceKey = envVars['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  console.log('Found keys:', Object.keys(envVars));
  process.exit(1);
}

console.log('🔗 Connecting to Supabase:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function seedAdmin() {
  const username = 'admin';
  const plainPassword = 'admin123';

  console.log('🔐 Hashing password with bcrypt...');
  const password_hash = await bcrypt.hash(plainPassword, 10);

  // First check what columns exist by trying a select
  const { data: existing, error: fetchError } = await supabase
    .from('users')
    .select('*')
    .eq('username', username)
    .maybeSingle();

  if (fetchError) {
    console.error('❌ Error querying users table:', fetchError.message);
    console.error('Full error:', fetchError);
    process.exit(1);
  }

  if (existing) {
    console.log('⚠️  Admin user already exists:', existing);
    console.log('Updating password hash...');
    const { error } = await supabase
      .from('users')
      .update({ password_hash })
      .eq('username', username);

    if (error) {
      console.error('❌ Failed to update admin:', error.message);
      process.exit(1);
    }
    console.log('✅ Admin password updated successfully!');
  } else {
    console.log('➕ Creating admin user...');
    const { data, error } = await supabase
      .from('users')
      .insert({ username, password_hash, role: 'admin' })
      .select();

    if (error) {
      console.error('❌ Failed to create admin:', error.message);
      console.error('Details:', JSON.stringify(error, null, 2));
      process.exit(1);
    }
    console.log('✅ Admin user created:', data);
  }

  console.log('\n🎉 Login credentials:');
  console.log('   Username: admin');
  console.log('   Password: admin123');
}

seedAdmin().catch(console.error);
