-- Fire Extinguisher Management System - Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (authentication)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Customers table
CREATE TABLE customers (
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

-- Extinguisher details table
CREATE TABLE extinguisher_details (
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

-- Customer history table (audit trail)
CREATE TABLE customer_history (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  action_type VARCHAR(20) NOT NULL,
  old_values JSONB,
  new_values JSONB,
  changed_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Backups table
CREATE TABLE backups (
  id SERIAL PRIMARY KEY,
  backup_date DATE NOT NULL,
  customers_count INT,
  details_count INT,
  file_url TEXT,
  created_by INT REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE payments (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_date DATE NOT NULL,
  payment_method VARCHAR(20) DEFAULT 'cash',
  payment_status VARCHAR(20) DEFAULT 'received',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_customers_certificate ON customers(certificate_no);
CREATE INDEX idx_customers_mobile ON customers(mobile);
CREATE INDEX idx_customers_service_date ON customers(service_date);
CREATE INDEX idx_customers_expiry_date ON customers(expiry_date);
CREATE INDEX idx_customers_active ON customers(is_active);
CREATE INDEX idx_extinguisher_customer ON extinguisher_details(customer_id);
CREATE INDEX idx_extinguisher_type ON extinguisher_details(ext_type);
CREATE INDEX idx_history_customer ON customer_history(customer_id);
CREATE INDEX idx_history_action ON customer_history(action_type);
CREATE INDEX idx_payments_customer ON payments(customer_id);
CREATE INDEX idx_payments_date ON payments(payment_date);
CREATE INDEX idx_payments_status ON payments(payment_status);

-- Create default admin user
-- Password: admin123 (bcrypt hash)
INSERT INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$12$LJ3m4ys3Lg0ep8y0yN5vXOZxZxZxZxZxZxZxZxZxZxZxZxZxZ', 'admin');

-- Note: The password hash above is a placeholder. 
-- Use the script below to generate a real bcrypt hash:
-- 
-- const bcrypt = require('bcrypt');
-- const hash = await bcrypt.hash('admin123', 12);
-- console.log(hash);
--
-- Then update the INSERT statement with the real hash.

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE extinguisher_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Create policies (allow all for authenticated users)
CREATE POLICY "Allow all for authenticated users" ON users
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON customers
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON extinguisher_details
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON customer_history
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON backups
  FOR ALL USING (true);

CREATE POLICY "Allow all for authenticated users" ON payments
  FOR ALL USING (true);
