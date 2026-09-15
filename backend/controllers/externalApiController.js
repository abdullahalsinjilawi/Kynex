const archiver = require('archiver');
const Project = require('../models/Project');
const ApiDownloadLog = require('../models/ApiDownloadLog');
const { getFileStream } = require('../utils/fileStorage');
const { t } = require('../utils/i18n');

const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// @route  GET /api/external/projects/:slug/download
// @desc   تنزيل مشروع برمجياً عن طريق API key، بحد أقصى مرة واحدة كل 24 ساعة لكل جهة طالبة
const downloadViaApi = async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, isDeleted: false });

    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    // الـ API key بيسمح فقط بتنزيل مشاريع صاحبه هو، مش أي مشروع على المنصة
    if (String(project.owner) !== String(req.apiOwner._id)) {
      return res
        .status(403)
        .json({ success: false, message: t(req.lang, 'apiKeyNotAuthorizedForProject') });
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
