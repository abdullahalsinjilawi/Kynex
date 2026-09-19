const archiver = require('archiver');
const User = require('../models/User');
const Project = require('../models/Project');
const ApiDownloadLog = require('../models/ApiDownloadLog');
const { getFileStream } = require('../utils/fileStorage');
const { isOwnerHidden } = require('../utils/visibility');
const { t } = require('../utils/i18n');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// @route  GET /api/external/projects/:username/:projectName/download
// @desc   تنزيل أي مشروع عام على المنصة برمجياً عن طريق API key + (اسم صاحب
//         المشروع + اسم المشروع) بدل الـ slug - أسهل للاستخدام من سكربت أو أمر
//         طرفية لما تعرف اسم صاحب المشروع واسمه بس. بحد أقصى مرة كل 24 ساعة
//         لكل جهة طالبة لنفس المشروع (بغض النظر مين صاحبه)
const downloadViaApi = async (req, res, next) => {
  try {
    const owner = await User.findOne({ username: req.params.username.toLowerCase() });

    if (!owner || isOwnerHidden(owner)) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    // مطابقة اسم المشروع بدون حساسية لحالة الأحرف - أسهل بالاستخدام من الطرفية
    const project = await Project.findOne({
      owner: owner._id,
      isDeleted: false,
      name: new RegExp(`^${req.params.projectName.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
    });

    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    const callerIp = req.ip;

    const existingLog = await ApiDownloadLog.findOne({ project: project._id, callerIp });

    if (existingLog && Date.now() - existingLog.lastDownloadAt.getTime() < ONE_DAY_MS) {
      const remainingMs = ONE_DAY_MS - (Date.now() - existingLog.lastDownloadAt.getTime());
      const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
      return res.status(429).json({
        success: false,
        message: t(req.lang, 'downloadRateLimited', { hours: remainingHours }),
      });
    }

    res.attachment(`${project.slug}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const file of project.files) {
      const stream = await getFileStream(file.storageKey);
      // نستخدم relativePath (مو filename بس) حتى تنحفظ بنية المجلدات بالـ ZIP، نفس
      // سلوك التنزيل من الموقع تماماً (projectController.downloadProject)
      archive.append(stream, { name: file.relativePath || file.filename });
    }

    await archive.finalize();

    // نسجّل وقت هاد التنزيل (نحدّث لو موجود، ننشئ لو أول مرة)
    await ApiDownloadLog.findOneAndUpdate(
      { project: project._id, callerIp },
      { lastDownloadAt: new Date() },
      { upsert: true }
    );

    Project.findByIdAndUpdate(project._id, { $inc: { downloadsCount: 1 } }).catch(() => {});
  } catch (error) {
    next(error);
  }
};

module.exports = { downloadViaApi };
