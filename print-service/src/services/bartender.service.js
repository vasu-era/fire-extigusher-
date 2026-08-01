const fs = require('fs/promises');
const { spawn } = require('child_process');
const { env } = require('../config/env');
const { PrintError } = require('../errors/PrintError');

async function assertFileExists(filePath, code, message) {
  if (!filePath) {
    throw new PrintError(message, 500, code);
  }

  try {
    await fs.access(filePath);
  } catch (err) {
    throw new PrintError(message, 500, code);
  }
}

async function assertBartenderReady() {
  await assertFileExists(
    env.bartenderPath,
    'BARTENDER_EXECUTABLE_MISSING',
    'BarTender executable missing'
  );
  await assertFileExists(
    env.bartenderTemplate,
    'BARTENDER_TEMPLATE_MISSING',
    'BarTender template missing'
  );
}

function buildBartenderArgs() {
  const args = [
    `/F=${env.bartenderTemplate}`,
    '/P',
    '/X'
  ];

  if (env.bartenderPrinter) {
    args.push(`/PRN=${env.bartenderPrinter}`);
  }

  return args;
}

async function printWithBartender() {
  await assertBartenderReady();

  const args = buildBartenderArgs();

  return new Promise((resolve, reject) => {
    let stdout = '';
    let stderr = '';
    let settled = false;

    const child = spawn(env.bartenderPath, args, {
      windowsHide: true
    });

    const timeout = setTimeout(() => {
      if (settled) return;
      settled = true;
      child.kill();
      reject(new PrintError('BarTender print timed out', 504, 'BARTENDER_TIMEOUT'));
    }, env.printTimeoutMs);

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('error', (err) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      reject(
        new PrintError(
          `Failed to launch BarTender: ${err.message}`,
          500,
          err.code === 'ENOENT' ? 'BARTENDER_EXECUTABLE_MISSING' : 'BARTENDER_LAUNCH_FAILED'
        )
      );
    });

    child.on('close', (code) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);

      if (code !== 0) {
        reject(
          new PrintError(
            stderr || stdout || `BarTender exited with code ${code}`,
            500,
            'BARTENDER_PRINT_FAILED'
          )
        );
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

module.exports = { printWithBartender };
