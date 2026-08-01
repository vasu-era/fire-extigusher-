const fs = require('fs/promises');
const path = require('path');
const { env } = require('../config/env');

async function logPrint(entry) {
  const logDir = path.join(env.rootDir, 'logs');
  const logPath = path.join(logDir, 'print.log');
  const payload = {
    certificateId: entry.certificateId,
    printTime: new Date().toISOString(),
    status: entry.status,
    rowCount: entry.rowCount || 0,
    errorMessage: entry.errorMessage || null
  };

  await fs.mkdir(logDir, { recursive: true });
  await fs.appendFile(logPath, `${JSON.stringify(payload)}\n`, 'utf8');
}

module.exports = { logPrint };
