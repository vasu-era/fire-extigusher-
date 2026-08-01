const { env } = require('../config/env');
const { getCertificateWithExtinguishers } = require('./supabase.service');
const { generateStickerCsv } = require('../utils/csvGenerator');
const { printWithBartender } = require('./bartender.service');
const { logPrint } = require('../utils/printLogger');
const { PrintError } = require('../errors/PrintError');

async function printCertificateSticker(certificateId, options = {}) {
  let rowCount = 0;

  try {
    const { customer, extinguishers } = await getCertificateWithExtinguishers(certificateId);

    if (extinguishers.length === 0) {
      throw new PrintError('No extinguisher details found', 404, 'EXTINGUISHERS_NOT_FOUND');
    }

    const csv = await generateStickerCsv({
      customer,
      extinguishers,
      requestedStickers: Array.isArray(options.stickers) ? options.stickers : [],
      csvPath: env.csvTemp
    });

    rowCount = csv.rowCount;
    await printWithBartender();

    await logPrint({
      certificateId,
      status: 'success',
      rowCount
    });

    return {
      success: true,
      message: `Sticker Printed Successfully (${rowCount} label${rowCount === 1 ? '' : 's'})`,
      rowCount
    };
  } catch (err) {
    await logPrint({
      certificateId,
      status: 'failed',
      rowCount,
      errorMessage: err.message
    }).catch(() => {});

    throw err;
  }
}

module.exports = { printCertificateSticker };
