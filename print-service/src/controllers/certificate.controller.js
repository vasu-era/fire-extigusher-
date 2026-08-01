const printService = require('../services/print.service');
const { PrintError } = require('../errors/PrintError');

async function printSticker(req, res, next) {
  try {
    const certificateId = Number(req.params.id);

    if (!Number.isInteger(certificateId) || certificateId <= 0) {
      throw new PrintError('Invalid certificate ID', 400, 'INVALID_CERTIFICATE_ID');
    }

    const result = await printService.printCertificateSticker(certificateId, req.body || {});
    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = { printSticker };
