const bcrypt = require('bcrypt');

async function generateHash() {
  const password = 'admin123';
  const saltRounds = 12;
  const hash = await bcrypt.hash(password, saltRounds);
  
  console.log('Password:', password);
  console.log('Hash:', hash);
  console.log('\nRun this SQL in Supabase:');
  console.log(`INSERT INTO users (username, password_hash, role) VALUES ('admin', '${hash}', 'admin');`);
}

generateHash();
