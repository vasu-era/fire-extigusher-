const express = require('express');
const cors = require('cors');
const certificateRoutes = require('./routes/certificate.routes');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'fire-sticker-print-service' });
});

app.use('/api/certificates', certificateRoutes);

app.use((err, req, res, next) => {
  const status = err.statusCode || 500;
  res.status(status).json({
    success: false,
    message: err.message || 'Unexpected print service error',
    code: err.code || 'PRINT_SERVICE_ERROR'
  });
});

module.exports = app;
