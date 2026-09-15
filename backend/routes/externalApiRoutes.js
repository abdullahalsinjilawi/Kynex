const express = require('express');
const router = express.Router();
const { downloadViaApi } = require('../controllers/externalApiController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

router.get('/projects/:slug/download', apiKeyAuth, downloadViaApi);

module.exports = router;
