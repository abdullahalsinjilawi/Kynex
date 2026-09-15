const express = require('express');
const router = express.Router();
const {
  startConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  getUnreadCount,
} = require('../controllers/messageController');
const { protect, requireActiveAccount } = require('../middleware/auth');

router.use(protect); // كل مسارات الرسائل تتطلب تسجيل دخول

router.post('/start', requireActiveAccount, startConversation);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationMessages);
router.post('/conversations/:id', requireActiveAccount, sendMessage);
router.get('/unread-count', getUnreadCount);

module.exports = router;
