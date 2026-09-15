const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const {
  register,
  login,
  logoutUser,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');
const { registerValidators, loginValidators } = require('../middleware/validators');

// حماية إضافية من محاولات تسجيل الدخول المتكررة (brute force)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 محاولة كحد أقصى كل 15 دقيقة لنفس الـ IP
  message: { success: false, message: 'محاولات كتيرة، حاول بعد شوي' },
});

router.post('/register', authLimiter, registerValidators, register);
router.post('/login', authLimiter, loginValidators, login);
router.post('/logout', logoutUser);
router.get('/me', protect, getMe);

module.exports = router;
