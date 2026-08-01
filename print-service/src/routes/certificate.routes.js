const express = require('express');
const certificateController = require('../controllers/certificate.controller');

const router = express.Router();

router.post('/:id/print', certificateController.printSticker);

module.exports = router;
