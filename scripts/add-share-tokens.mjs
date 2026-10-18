/**
 * Run this SQL in Supabase Dashboard → SQL Editor:
 *
 * ALTER TABLE customers ADD COLUMN IF NOT EXISTS share_token UUID;
 * CREATE UNIQUE INDEX IF NOT EXISTS customers_share_token_idx ON customers(share_token) WHERE share_token IS NOT NULL;
 */

import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load .env.local manually
try {
  const envPath = resolve(process.cwd(), '.env.local');
  const envContent = readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = value;
  }
} catch { /* ignore */ }

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function main() {
  console.log('🔑 Fetching customers without share_token...');

  const { data: customers, error } = await supabase
    .from('customers')
    .select('id, share_token')
    .is('share_token', null);

  if (error) {
    console.error('❌ Error fetching customers:', error.message);
    console.log('\n⚠️  If you see a column error, first run this SQL in Supabase Dashboard SQL Editor:');
    console.log('ALTER TABLE customers ADD COLUMN IF NOT EXISTS share_token UUID;');
    console.log('CREATE UNIQUE INDEX IF NOT EXISTS customers_share_token_idx ON customers(share_token) WHERE share_token IS NOT NULL;');
    process.exit(1);
  }

  if (!customers || customers.length === 0) {
    console.log('✅ All customers already have share tokens!');
    return;
  }

  console.log(`📋 Found ${customers.length} customers without tokens. Generating...`);

  let success = 0;
  for (const customer of customers) {
    const token = randomUUID();
    const { error: updateError } = await supabase
      .from('customers')
      .update({ share_token: token })
      .eq('id', customer.id);

    if (updateError) {
      console.error(`❌ Failed for customer ${customer.id}:`, updateError.message);
    } else {
      console.log(`✅ Customer ${customer.id} → ${token}`);
      success++;
    }
  }

  console.log(`\n🎉 Done! ${success}/${customers.length} customers now have share tokens.`);
}

main();
