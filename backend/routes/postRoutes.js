const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const {
  getPosts,
  getHighlights,
  getPopularTags,
  getPost,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
  togglePin,
  toggleHide,
} = require('../controllers/postController');

const {
  getPostComments,
  addPostComment,
  updatePostComment,
  deletePostComment,
  reactToPostComment,
} = require('../controllers/postCommentController');

const { protect, optionalAuth, adminOnly, requireActiveAccount } = require('../middleware/auth');
const { createPostValidators, postCommentValidators } = require('../middleware/validators');

// المنتدى مفتوح للنشر الحر، فالحماية الوحيدة المعقولة ضد السبام هي حد معدّل معقول
// (مش تقييد محتوى). الأرقام مختارة حتى ما تزعج مستخدم طبيعي أبداً: 10 منشورات بالساعة
// و40 تعليق بالربع ساعة أكتر بكتير من أي استخدام حقيقي
const createPostLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'نشرت كتير بوقت قصير، استنى شوي وجرّب كمان مرة' },
  // نحسب الحد لكل مستخدم مسجّل، مش لكل IP (شبكات كاملة ممكن تطلع من نفس الـ IP)
  keyGenerator: (req) => String(req.user?._id || req.ip),
});

const commentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { success: false, message: 'تعليقات كتيرة بوقت قصير، استنى شوي' },
  keyGenerator: (req) => String(req.user?._id || req.ip),
});

// --- قراءة عامة (optionalAuth حتى نعرف تفاعل الزائر لو كان مسجّل دخول) ---
router.get('/', optionalAuth, getPosts);
router.get('/highlights', optionalAuth, getHighlights);
router.get('/tags', getPopularTags);

// --- التعليقات: لازم تكون قبل '/:slug' ما تتعارض، وعلى مسار مستقل واضح ---
router.put('/comments/:id', protect, requireActiveAccount, postCommentValidators, updatePostComment);
router.delete('/comments/:id', protect, deletePostComment);
router.post('/comments/:id/react', protect, requireActiveAccount, reactToPostComment);

// --- إنشاء / تعديل / حذف منشور ---
router.post('/', protect, requireActiveAccount, createPostLimiter, createPostValidators, createPost);
router.put('/:id', protect, requireActiveAccount, updatePost);
router.delete('/:id', protect, deletePost);
router.post('/:id/react', protect, requireActiveAccount, reactToPost);

// --- إجراءات إدارية ---
router.patch('/:id/pin', protect, adminOnly, togglePin);
router.patch('/:id/hide', protect, adminOnly, toggleHide);

// --- تعليقات منشور معيّن (بالـ slug) ---
router.get('/:slug/comments', optionalAuth, getPostComments);
router.post(
  '/:slug/comments',
  protect,
  requireActiveAccount,
  commentLimiter,
  postCommentValidators,
  addPostComment
);

// --- تفاصيل منشور (آخر شي حتى ما يبلع المسارات الثابتة فوق) ---
router.get('/:slug', optionalAuth, getPost);

module.exports = router;
