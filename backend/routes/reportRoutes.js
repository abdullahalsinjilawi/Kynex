const express = require('express');
const router = express.Router();
const { createReport, getReportCategories } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/categories', getReportCategories);
router.post('/', protect, createReport);

module.exports = router;
