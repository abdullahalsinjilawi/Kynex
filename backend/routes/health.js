const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

// GET /api/health
// يستخدم للتأكد إنو السيرفر شغال والاتصال بقاعدة البيانات سليم
router.get('/', (req, res) => {
  const dbStates = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };

  res.status(200).json({
    success: true,
    message: 'السيرفر شغال تمام 🚀',
    database: dbStates[mongoose.connection.readyState],
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
