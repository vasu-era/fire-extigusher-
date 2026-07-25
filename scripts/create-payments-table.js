const { Client } = require('pg');

const DB_PASSWORD = 'S6S44MUkBoKnIFGx';
const PROJECT_REF = 'suifyfqvqisebkkniiiw';

const SQL = `
CREATE TABLE IF NOT EXISTS payments (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  payment_status VARCHAR(20) DEFAULT 'received',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_customer ON payments(customer_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(payment_status);
`;

async function main() {
  const connectionStrings = [
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-south-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-us-east-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres.${PROJECT_REF}:${DB_PASSWORD}@aws-0-eu-west-1.pooler.supabase.com:6543/postgres`,
    `postgresql://postgres:${DB_PASSWORD}@db.${PROJECT_REF}.supabase.co:5432/postgres`,
  ];

  for (const connStr of connectionStrings) {
    const client = new Client({ connectionString: connStr, ssl: { rejectUnauthorized: false } });
    try {
      console.log('Trying:', connStr.split('@')[1]);
      await client.connect();
      console.log('Connected!');

      await client.query(SQL);
      console.log('✅ payments table created successfully!');

      const tables = await client.query(`
        SELECT table_name FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'payments'
      `);
      if (tables.rows.length > 0) {
        console.log('✅ Verified: payments table exists in database');
      }

      await client.end();
      return;
    } catch (error) {
      console.log('Failed:', error.message);
      try { await client.end(); } catch(e) {}
    }
  }
  console.log('Could not connect. Run the SQL manually in Supabase SQL Editor.');
}

main();
