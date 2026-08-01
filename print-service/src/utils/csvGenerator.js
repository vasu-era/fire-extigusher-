const fs = require('fs/promises');
const path = require('path');
const { PrintError } = require('../errors/PrintError');

function formatDate(value) {
  if (!value) return '';

  const raw = String(value).slice(0, 10);
  const match = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);

  if (match) {
    return `${match[3]}/${match[2]}/${match[1]}`;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';

  return [
    String(date.getDate()).padStart(2, '0'),
    String(date.getMonth() + 1).padStart(2, '0'),
    date.getFullYear()
  ].join('/');
}

function escapeCsv(value) {
  const text = value == null ? '' : String(value);
  if (/[",\r\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function buildStickerRows(customer, extinguishers, requestedStickers = []) {
  const requestedById = new Map(
    requestedStickers
      .filter((sticker) => sticker && sticker.id != null)
      .map((sticker) => [String(sticker.id), sticker])
  );

  const rows = [];

  for (const extinguisher of extinguishers) {
    const requested = requestedById.get(String(extinguisher.id));
    const quantity = Math.max(
      0,
      Math.floor(Number(requested?.quantity ?? extinguisher.ext_qty ?? 1) || 0)
    );

    for (let copy = 0; copy < quantity; copy += 1) {
      rows.push({
        Type: extinguisher.ext_type,
        Capacity: extinguisher.ext_capacity,
        RefillDate: formatDate(customer.service_date),
        ExpiryDate: formatDate(customer.expiry_date)
      });
    }
  }

  return rows;
}

async function generateStickerCsv({ customer, extinguishers, requestedStickers, csvPath }) {
  try {
    const rows = buildStickerRows(customer, extinguishers, requestedStickers);

    if (rows.length === 0) {
      throw new PrintError('No sticker rows to print', 400, 'NO_STICKERS_TO_PRINT');
    }

    const header = ['Type', 'Capacity', 'RefillDate', 'ExpiryDate'];
    const lines = [
      header.join(','),
      ...rows.map((row) => header.map((field) => escapeCsv(row[field])).join(','))
    ];

    await fs.mkdir(path.dirname(csvPath), { recursive: true });
    await fs.writeFile(csvPath, `${lines.join('\r\n')}\r\n`, 'utf8');

    return { csvPath, rowCount: rows.length };
  } catch (err) {
    if (err instanceof PrintError) throw err;
    throw new PrintError(
      `CSV generation failed: ${err.message}`,
      500,
      'CSV_GENERATION_FAILED'
    );
  }
}

module.exports = {
  formatDate,
  buildStickerRows,
  generateStickerCsv
};
