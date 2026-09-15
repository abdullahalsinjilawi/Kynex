const Report = require('../models/Report');
const { t } = require('../utils/i18n');

// @route  GET /api/reports/categories
// @desc   قائمة فئات سبب البلاغ (يستخدمها الفرونت اند لبناء استبيان "ليش بدك تبلغ؟")
const getReportCategories = (req, res) => {
  res.status(200).json({ success: true, categories: Report.REPORT_CATEGORIES });
};

// @route  POST /api/reports
// @desc   إنشاء بلاغ جديد عن تعليق أو مشروع أو مستخدم
const createReport = async (req, res, next) => {
  try {
    const { targetType, targetId, category, reason } = req.body;

    if (!['comment', 'project', 'user'].includes(targetType)) {
      return res.status(400).json({ success: false, message: t(req.lang, 'invalidReportType') });
    }

    if (!targetId) {
      return res.status(400).json({ success: false, message: t(req.lang, 'targetRequired') });
    }

    if (!Report.REPORT_CATEGORIES.includes(category)) {
      return res.status(400).json({ success: false, message: t(req.lang, 'reportReasonRequired') });
    }

    if (category === 'other' && !reason?.trim()) {
      return res.status(400).json({ success: false, message: t(req.lang, 'otherReasonRequires') });
    }

    const report = await Report.create({
      reporter: req.user._id,
      targetType,
      targetId,
      category,
      reason: reason || '',
    });

    res.status(201).json({ success: true, message: t(req.lang, 'reportReceived'), report });
  } catch (error) {
    next(error);
  }
};

module.exports = { createReport, getReportCategories };
