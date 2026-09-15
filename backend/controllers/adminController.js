const User = require('../models/User');
const Project = require('../models/Project');
const Comment = require('../models/Comment');
const Report = require('../models/Report');
const AdminAuditLog = require('../models/AdminAuditLog');
const Notification = require('../models/Notification');
const { t } = require('../utils/i18n');

// دالة مساعدة: تسجّل أي إجراء أدمن بسجل التدقيق، بدون ما توقف تنفيذ الطلب لو فشلت لأي سبب
const logAdminAction = (adminId, action, targetType, targetId, details = {}) => {
  AdminAuditLog.create({ admin: adminId, action, targetType, targetId, details }).catch(() => {});
};

// ==================== المستخدمين ====================

const getAllUsers = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
      User.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      users,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const toggleBanUser = async (req, res, next) => {
  try {
    const { ban, reason } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({ success: false, message: t(req.lang, 'userNotFound') });
    }
    if (user.role === 'admin') {
      return res.status(400).json({ success: false, message: t(req.lang, 'cantBanAdmin') });
    }

    user.isBanned = !!ban;
    user.banReason = ban ? reason || '' : '';
    await user.save();

    logAdminAction(req.user._id, ban ? 'ban_user' : 'unban_user', 'user', user._id, { reason });

    res.status(200).json({ success: true, message: t(req.lang, ban ? 'userBanned' : 'userUnbanned') });
  } catch (error) {
    next(error);
  }
};

const toggleVerifiedUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: t(req.lang, 'userNotFound') });
    }

    user.verified = !user.verified;
    await user.save();

    // نشعر المستخدم لو منحناه الشارة (مو لو سحبناها منه)
    if (user.verified) {
      Notification.create({
        recipient: user._id,
        type: 'verified_badge',
        messageKey: 'verifiedBadgeNotification',
      }).catch(() => {});
    }

    logAdminAction(req.user._id, 'toggle_verified_user', 'user', user._id, { verified: user.verified });

    res.status(200).json({ success: true, verified: user.verified });
  } catch (error) {
    next(error);
  }
};

// ==================== المشاريع ====================

const getAllProjectsAdmin = async (req, res, next) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};
    if (search) query.name = { $regex: search, $options: 'i' };

    const skip = (Number(page) - 1) * Number(limit);
    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      Project.countDocuments(query),
    ]);

    res.status(200).json({
      success: true,
      projects,
      pagination: { page: Number(page), limit: Number(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

const toggleHideProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    project.isDeleted = !project.isDeleted;
    await project.save();

    logAdminAction(req.user._id, 'toggle_hide_project', 'project', project._id, {
      isDeleted: project.isDeleted,
    });

    res.status(200).json({
      success: true,
      message: t(req.lang, project.isDeleted ? 'projectHidden' : 'projectShown'),
    });
  } catch (error) {
    next(error);
  }
};

const toggleFeaturedProject = async (req, res, next) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    project.isFeatured = !project.isFeatured;
    await project.save();

    logAdminAction(req.user._id, 'toggle_featured_project', 'project', project._id, {
      isFeatured: project.isFeatured,
    });

    res.status(200).json({ success: true, isFeatured: project.isFeatured });
  } catch (error) {
    next(error);
  }
};

// ==================== البلاغات ====================

const getAllReports = async (req, res, next) => {
  try {
    const { status } = req.query;
    const query = status ? { status } : {};

    const reports = await Report.find(query)
      .populate('reporter', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    next(error);
  }
};

const updateReportStatus = async (req, res, next) => {
  try {
    const { status, adminNote, banReportedUser, banReason } = req.body;
    const report = await Report.findById(req.params.id);

    if (!report) {
      return res.status(404).json({ success: false, message: t(req.lang, 'reportNotFound') });
    }

    if (status) report.status = status;
    if (adminNote !== undefined) report.adminNote = adminNote;
    await report.save();

    let bannedUserId = null;

    if (banReportedUser) {
      let userIdToBan = null;

      if (report.targetType === 'user') {
        userIdToBan = report.targetId;
      } else if (report.targetType === 'comment') {
        const comment = await Comment.findById(report.targetId);
        userIdToBan = comment?.user;
      } else if (report.targetType === 'project') {
        const project = await Project.findById(report.targetId);
        userIdToBan = project?.owner;
      }

      if (userIdToBan) {
        await User.findByIdAndUpdate(userIdToBan, {
          isBanned: true,
          banReason: banReason || t(req.lang, 'bannedDueToReport', { reason: report.reason }),
        });
        bannedUserId = userIdToBan;
      }
    }

    logAdminAction(req.user._id, 'update_report', 'report', report._id, {
      status,
      bannedUserId,
    });

    res.status(200).json({ success: true, report });
  } catch (error) {
    next(error);
  }
};

// ==================== سجل التدقيق ====================

const getAuditLog = async (req, res, next) => {
  try {
    const logs = await AdminAuditLog.find()
      .populate('admin', 'name email')
      .sort({ createdAt: -1 })
      .limit(200);

    res.status(200).json({ success: true, logs });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  toggleBanUser,
  toggleVerifiedUser,
  getAllProjectsAdmin,
  toggleHideProject,
  toggleFeaturedProject,
  getAllReports,
  updateReportStatus,
  getAuditLog,
};
