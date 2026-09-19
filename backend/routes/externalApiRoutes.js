const express = require('express');
const router = express.Router();
const { downloadViaApi } = require('../controllers/externalApiController');
const apiKeyAuth = require('../middleware/apiKeyAuth');

router.get('/projects/:username/:projectName/download', apiKeyAuth, downloadViaApi);

module.exports = router;
