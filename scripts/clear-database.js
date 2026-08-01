const SUPABASE_URL = process.env.SUPABASE_URL || 'https://suifyfqvqisebkkniiiw.supabase.co';
const SUPABASE_KEY = process.env.SUPABASE_KEY || '';

const HEADERS = {
  'apikey': SUPABASE_KEY,
  'Authorization': `Bearer ${SUPABASE_KEY}`,
  'Content-Type': 'application/json',
  'Prefer': 'return=minimal',
};

async function deleteAll(table) {
  const url = `${SUPABASE_URL}/rest/v1/${table}?id=gt.0`;
  const res = await fetch(url, { method: 'DELETE', headers: HEADERS });
  if (res.ok) {
    console.log(`  ✅ Cleared ${table}`);
  } else {
    const text = await res.text();
    console.log(`  ❌ Failed ${table}: ${text}`);
  }
}

async function countRows(table) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?select=id`, { headers: HEADERS });
  const data = await res.json();
  return Array.isArray(data) ? data.length : 0;
}

async function main() {
  console.log('🗑️  Clearing all data from database...\n');
  console.log('📊 Before:');
  console.log(`  payments: ${await countRows('payments')}`);
  console.log(`  customer_history: ${await countRows('customer_history')}`);
  console.log(`  extinguisher_details: ${await countRows('extinguisher_details')}`);
  console.log(`  customers: ${await countRows('customers')}`);

  await deleteAll('payments');
  await deleteAll('customer_history');
  await deleteAll('extinguisher_details');
  await deleteAll('customers');

  console.log('\n📊 After:');
  console.log(`  payments: ${await countRows('payments')}`);
  console.log(`  customer_history: ${await countRows('customer_history')}`);
  console.log(`  extinguisher_details: ${await countRows('extinguisher_details')}`);
  console.log(`  customers: ${await countRows('customers')}`);

  console.log('\n✅ All data cleared! Tables intact, admin user preserved.');
}

main().catch(console.error);
