const express = require('express');
const router = express.Router();
const {
  updateProfile,
  setHuggingFaceToken,
  deleteHuggingFaceToken,
  getHuggingFaceTokenStatus,
  generateApiKey,
  getApiKeyStatus,
  getPublicProfile,
  requestAccountDeletion,
  restoreAccount,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

// --- Routes خاصة (تتطلب تسجيل دخول) ---
router.put('/profile', protect, updateProfile);

router.put('/huggingface-token', protect, setHuggingFaceToken);
router.delete('/huggingface-token', protect, deleteHuggingFaceToken);
router.get('/huggingface-token/status', protect, getHuggingFaceTokenStatus);

router.post('/api-key', protect, generateApiKey);
router.get('/api-key/status', protect, getApiKeyStatus);

router.delete('/me', protect, requestAccountDeletion);
router.post('/me/restore', protect, restoreAccount);

// --- Route عام (بروفايل أي مستخدم، بدون حماية) ---
// ملاحظة: كان هون مسار /recent بيرجّع آخر الأعضاء اللي انضموا. انشال بقرار من صاحب
// المنصة: انضمام الأعضاء الجدد ما بينعرض علناً، لا بالصفحة الرئيسية ولا عبر الـ API.
router.get('/:id', getPublicProfile);

module.exports = router;
