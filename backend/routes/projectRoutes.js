const express = require('express');
const router = express.Router();
const {
  createProject,
  getProjects,
  getFeaturedProjects,
  getProjectBySlug,
  updateProject,
  deleteProject,
  downloadProject,
  getFileContent,
  toggleStar,
  getLicenseOptions,
  getSiteStats,
} = require('../controllers/projectController');
const { getComments, addComment } = require('../controllers/commentController');
const { protect, requireActiveAccount, optionalAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { createProjectValidators } = require('../middleware/validators');
const { addCommentValidators } = require('../middleware/validators');

// --- Routes عامة (بدون تسجيل دخول) ---
router.get('/', getProjects);
router.get('/featured', getFeaturedProjects);
router.get('/stats', getSiteStats);
router.get('/meta/licenses', getLicenseOptions);
router.get('/:slug', optionalAuth, getProjectBySlug);
router.get('/:slug/download', downloadProject);
router.get('/:slug/files/:fileId/content', getFileContent);
router.get('/:slug/comments', getComments);

// --- Routes محمية (تتطلب تسجيل دخول وحساب فعّال غير مجدول للحذف) ---
router.post(
  '/',
  protect,
  requireActiveAccount,
  upload.array('files'),
  createProjectValidators,
  createProject
);
router.put('/:slug', protect, requireActiveAccount, upload.array('files'), updateProject);
router.delete('/:slug', protect, deleteProject);
router.post('/:slug/star', protect, requireActiveAccount, toggleStar);
router.post(
  '/:slug/comments',
  protect,
  requireActiveAccount,
  addCommentValidators,
  addComment
);

module.exports = router;
