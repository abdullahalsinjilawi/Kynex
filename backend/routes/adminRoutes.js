const express = require('express');
const router = express.Router();
const {
  getAllUsers,
  toggleBanUser,
  toggleVerifiedUser,
  getAllProjectsAdmin,
  getAllPostsAdmin,
  toggleHideProject,
  toggleFeaturedProject,
  getAllReports,
  updateReportStatus,
  getAuditLog,
} = require('../controllers/adminController');
const { protect, adminOnly } = require('../middleware/auth');

// كل مسارات هاد الملف تتطلب تسجيل دخول + صلاحيات أدمن
router.use(protect, adminOnly);

router.get('/users', getAllUsers);
router.put('/users/:id/ban', toggleBanUser);
router.put('/users/:id/verify', toggleVerifiedUser);

router.get('/projects', getAllProjectsAdmin);
router.put('/projects/:id/hide', toggleHideProject);
router.put('/projects/:id/feature', toggleFeaturedProject);

router.get('/posts', getAllPostsAdmin);

router.get('/reports', getAllReports);
router.put('/reports/:id', updateReportStatus);

router.get('/audit-log', getAuditLog);

module.exports = router;
