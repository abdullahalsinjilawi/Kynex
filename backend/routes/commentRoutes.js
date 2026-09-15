const express = require('express');
const router = express.Router();
const { updateComment } = require('../controllers/commentController');
const { protect } = require('../middleware/auth');

router.put('/:id', protect, updateComment);

module.exports = router;
