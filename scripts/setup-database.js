const { Client } = require('pg');
const bcrypt = require('bcrypt');

const DB_PASSWORD = 'S6S44MUkBoKnIFGx';
const PROJECT_REF = 'suifyfqvqisebkkniiiw';

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  certificate_no VARCHAR(50) UNIQUE NOT NULL,
  customer_name VARCHAR(100) NOT NULL,
  mobile VARCHAR(20) NOT NULL,
  address TEXT,
  service_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  total_qty INT NOT NULL DEFAULT 1,
  refilling_price DECIMAL(10,2) DEFAULT 0.00,
  new_bottle_price DECIMAL(10,2) DEFAULT 0.00,
  payment_status VARCHAR(20) DEFAULT 'pending',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS extinguisher_details (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  ext_type VARCHAR(100) NOT NULL,
  ext_capacity VARCHAR(50) NOT NULL,
  ext_qty INT NOT NULL DEFAULT 1,
  ext_refilling_price DECIMAL(10,2) DEFAULT 0.00,
  ext_new_price DECIMAL(10,2) DEFAULT 0.00,
  service_action_type VARCHAR(20) DEFAULT 'refilling',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_history (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS backups (
  id SERIAL PRIMARY KEY,
  backup_date DATE NOT NULL,
  customers_count INT,
  details_count INT,
  file_url TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_certificate ON customers(certificate_no);
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
CREATE INDEX IF NOT EXISTS idx_customers_service_date ON customers(service_date);
CREATE INDEX IF NOT EXISTS idx_customers_expiry_date ON customers(expiry_date);
CREATE INDEX IF NOT EXISTS idx_customers_active ON customers(is_active);
CREATE INDEX IF NOT EXISTS idx_extinguisher_customer ON extinguisher_details(customer_id);
CREATE INDEX IF NOT EXISTS idx_extinguisher_type ON extinguisher_details(ext_type);
CREATE INDEX IF NOT EXISTS idx_history_customer ON customer_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_history_action ON customer_history(action_type);
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
      console.log('Trying connection...');
      await client.connect();
      console.log('Connected to Supabase database!');

      console.log('Creating tables...');
      await client.query(SCHEMA_SQL);
      console.log('All tables created successfully!');

      const hash = await bcrypt.hash('admin123', 12);
      console.log('Generated password hash for admin123');

      const existingUser = await client.query("SELECT id FROM users WHERE username = 'admin'");
      if (existingUser.rows.length === 0) {
        await client.query(
          "INSERT INTO users (username, password_hash, role) VALUES ($1, $2, 'admin')",
          ['admin', hash]
        );
        console.log('Admin user created! (username: admin, password: admin123)');
      } else {
        await client.query(
          "UPDATE users SET password_hash = $1 WHERE username = 'admin'",
          [hash]
        );
        console.log('Admin user password updated!');
      }

      const tables = await client.query(`
        SELECT table_name FROM information_schema.tables 
        WHERE table_schema = 'public' 
        ORDER BY table_name
      `);
      console.log('\nTables in database:');
      tables.rows.forEach(row => console.log(`  - ${row.table_name}`));

      await client.end();
      console.log('\nDone! Database setup complete.');
      return;
    } catch (error) {
      console.log('Connection failed:', error.message);
      try { await client.end(); } catch(e) {}
    }
  }

  console.log('\nCould not connect to any Supabase endpoint.');
  console.log('Please check your database password and project settings.');
}

main().catch(console.error);
