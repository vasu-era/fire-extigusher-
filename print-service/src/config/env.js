const path = require('path');
require('dotenv').config();

const rootDir = path.resolve(__dirname, '..', '..');

const env = {
  port: Number(process.env.PORT || 10000),
  supabaseUrl: process.env.SUPABASE_URL || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  bartenderPath: process.env.BARTENDER_PATH || '',
  bartenderTemplate: process.env.BARTENDER_TEMPLATE || '',
  csvTemp: process.env.CSV_TEMP || path.join(rootDir, 'temp', 'sticker.csv'),
  bartenderPrinter: process.env.BARTENDER_PRINTER || '',
  printTimeoutMs: Number(process.env.PRINT_TIMEOUT_MS || 60000),
  rootDir
};

module.exports = { env };
