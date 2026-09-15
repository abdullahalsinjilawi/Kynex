const fs = require('fs');
const path = require('path');
const archiver = require('archiver');
const Project = require('../models/Project');
const Star = require('../models/Star');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { uploadFile, getFileStream, deleteFile } = require('../utils/fileStorage');
const { scanFile } = require('../utils/malwareScan');
const { sanitizeRelativePath } = require('../utils/pathSanitize');
const { isOwnerHidden, getHiddenOwnerIds } = require('../utils/visibility');
const LICENSE_INFO = require('../utils/licenseInfo');
const { t } = require('../utils/i18n');

const MAX_PROJECT_SIZE =
  Number(process.env.MAX_PROJECT_SIZE_BYTES) || 10 * 1024 * 1024 * 1024; // 10GB افتراضي

const PREVIEW_MAX_BYTES = 300 * 1024; // 300KB - حد معقول لمعاينة نص سريعة، مو لملفات ضخمة
const PREVIEWABLE_EXTENSIONS = new Set([
  'txt', 'md', 'markdown', 'py', 'js', 'jsx', 'ts', 'tsx', 'mjs', 'cjs', 'json', 'yaml', 'yml',
  'toml', 'ini', 'cfg', 'sh', 'bash', 'zsh', 'c', 'h', 'cpp', 'hpp', 'cc', 'java', 'go', 'rs',
  'rb', 'php', 'sql', 'css', 'scss', 'html', 'htm', 'xml', 'csv', 'env', 'r', 'ipynb', 'conf',
  'log', 'gitignore', 'gitattributes', 'editorconfig',
]);

// بترجع true لو الملف نوعه نصّي معروف (نسمح بمعاينته)، أو ملف بدون امتداد أصلاً
// (زي Dockerfile أو Makefile - عادة ملفات نصية كمان رغم عدم وجود امتداد)
function isPreviewable(filename) {
  const parts = filename.split('.');
  if (parts.length === 1) return true; // بدون امتداد إطلاقاً
  const ext = parts.pop().toLowerCase();
  return PREVIEWABLE_EXTENSIONS.has(ext);
}

// بيجمّع stream كامل بنص UTF-8 واحد - آمن هون لأننا already تأكدنا إنو حجم الملف
// صغير (PREVIEW_MAX_BYTES) قبل ما نستدعي هاي الدالة، فما رح نحمّل شي ضخم بالذاكرة
async function streamToString(stream) {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf-8');
}

// نطبّع filePaths (جاي من req.body، ومقابل لمصفوفة الملفات بنفس الترتيب) لمصفوفة نصوص دائماً.
// express بيرجعها string لو ملف وحيد بس، أو array لو أكتر من ملف - فلازم نوحّد الشكل
function normalizeFilePaths(rawFilePaths, filesCount) {
  if (!rawFilePaths) return new Array(filesCount).fill('');
  const arr = Array.isArray(rawFilePaths) ? rawFilePaths : [rawFilePaths];
  // لو العدد ما تطابق لأي سبب (مثلاً الفرونت اند ما بعتها)، منرجع مصفوفة فاضية لكل ملف
  // فيرجع processUploadedFiles يعتمد على originalname كـ fallback بدلها
  return arr.length === filesCount ? arr : new Array(filesCount).fill('');
}

// دالة مساعدة: ترفع مجموعة ملفات (من multer) للتخزين الدائم وترجع بياناتها الوصفية
// filePaths: مصفوفة مسارات نسبية مقابلة لكل ملف (من رفع مجلد كامل عبر webkitdirectory)،
// لو فاضية أو ناقصة بنستخدم اسم الملف الأصلي بدلها (رفع ملفات مفردة بدون مجلد)
async function processUploadedFiles(files, ownerId, projectSlug, filePaths = [], lang = 'ar') {
  const uploadedFilesMeta = [];
  const usedKeys = new Set(); // نتفادى تعارض storageKey لو صار نفس المسار مرتين بنفس الرفعة

  for (let i = 0; i < files.length; i++) {
    const file = files[i];

    // فحص الملف قبل رفعه بشكل دائم (أنظر utils/malwareScan.js - ClamAV لو مضبوط، وإلا stub)
    const scanResult = await scanFile(file.path, lang);
    if (!scanResult.clean) {
      // ننظف الملفات المؤقتة قبل ما نرمي الخطأ
      await Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => {})));
      throw new Error(t(lang, 'fileScanFailed', { filename: file.originalname, viruses: scanResult.viruses || '' }));
    }

    const relativePath = sanitizeRelativePath(filePaths[i], file.originalname);
    // نضمن تفرّد المسار داخل نفس عملية الرفع (لو صار تعارض، نضيف رقم تسلسلي)
    let finalPath = relativePath;
    let suffix = 1;
    while (usedKeys.has(finalPath)) {
      const ext = path.extname(relativePath);
      const base = relativePath.slice(0, relativePath.length - ext.length);
      finalPath = `${base}-${suffix}${ext}`;
      suffix++;
    }
    usedKeys.add(finalPath);

    const storageKey = `projects/${ownerId}/${projectSlug}/${finalPath}`;
    await uploadFile(file.path, storageKey);

    uploadedFilesMeta.push({
      filename: finalPath.split('/').pop(),
      relativePath: finalPath,
      storageKey,
      size: file.size,
      mimeType: file.mimetype,
    });

    // نحذف النسخة المؤقتة من القرص المحلي بعد ما ترفع للتخزين الدائم
    await fs.promises.unlink(file.path).catch(() => {});
  }

  return uploadedFilesMeta;
}

// بيجيب مشروع بالـ slug + owner (بالحقول اللازمة نتأكد من حالته)، وبيرجع null لو:
// - المشروع مو موجود / محذوف
// - صاحب المشروع محظور أو حسابه بفترة حذف مؤجل (إلا لو الطالب أدمن أو هو نفسه صاحب المشروع)
// نستخدمها بكل مكان بيعرض مشروع للعموم (تفاصيل، تنزيل، تعليقات) عشان محتوى الحسابات
// المحظورة/المحذوفة يختفي تلقائياً بدون ما الأدمن يضطر يخفي كل مشروع يدوياً لحاله
async function findVisibleProject(slug, requester) {
  const project = await Project.findOne({ slug, isDeleted: false }).populate(
    'owner',
    'name verified avatarUrl bio isBanned deletedAt'
  );

  if (!project) return null;

  const requesterIsOwner = requester && String(requester._id) === String(project.owner?._id);
  const requesterIsAdmin = requester && requester.role === 'admin';

  if (isOwnerHidden(project.owner) && !requesterIsOwner && !requesterIsAdmin) {
    return null;
  }

  return project;
}

// @route  POST /api/projects
// @desc   إنشاء مشروع جديد مع رفع ملفاته
const createProject = async (req, res, next) => {
  try {
    const { name, description, readme, category, language, tags, licenseType, licenseCustomText } =
      req.body;

    if (!name || !description || !category || !language || !licenseType) {
      return res.status(400).json({ success: false, message: t(req.lang, 'requiredFieldsMissing') });
    }

    if (!Project.PRESET_LICENSES.includes(licenseType)) {
      return res.status(400).json({ success: false, message: t(req.lang, 'unknownLicenseType') });
    }

    if (licenseType === 'Custom' && !licenseCustomText) {
      return res.status(400).json({ success: false, message: t(req.lang, 'customLicenseTextRequired') });
    }

    const files = req.files || [];
    const totalSize = files.reduce((sum, f) => sum + f.size, 0);

    if (totalSize > MAX_PROJECT_SIZE) {
      // ننظف الملفات المؤقتة لأنو رح نرفض الطلب
      await Promise.all(files.map((f) => fs.promises.unlink(f.path).catch(() => {})));
      return res.status(400).json({
        success: false,
        message: t(req.lang, 'projectSizeExceeded', { maxGb: MAX_PROJECT_SIZE / (1024 * 1024 * 1024) }),
      });
    }

    // ننشئ المشروع أول شي (بدون ملفات) عشان ناخد الـ slug تبعه لاستخدامه بمسار التخزين
    const project = new Project({
      owner: req.user._id,
      name,
      description,
      readme: readme || '',
      category,
      language,
      tags: tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      license: { type: licenseType, customText: licenseType === 'Custom' ? licenseCustomText : '' },
    });
    await project.validate(); // يولّد الـ slug عن طريق الـ pre-validate hook بدون ما يحفظ لسه

    // filePaths[i] هو المسار النسبي لكل ملف لو انرفع مجلد كامل (webkitdirectory بالفرونت اند)
    const filePaths = normalizeFilePaths(req.body.filePaths, files.length);
    const uploadedFilesMeta = await processUploadedFiles(files, req.user._id, project.slug, filePaths, req.lang);

    project.files = uploadedFilesMeta;
    project.totalSizeBytes = totalSize;
    await project.save();

    res.status(201).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/projects
// @desc   قائمة المشاريع مع بحث/فلترة/ترتيب وصفحات (pagination)
// @route  GET /api/projects/stats
// @desc   إحصائيات عامة عن المنصة (لشريط "المجتمع" بالصفحة الرئيسية)
const getSiteStats = async (req, res, next) => {
  try {
    const hiddenOwnerIds = await getHiddenOwnerIds();
    const visibleQuery = hiddenOwnerIds.length
      ? { isDeleted: false, owner: { $nin: hiddenOwnerIds } }
      : { isDeleted: false };

    const [projectsCount, membersCount, starsAgg] = await Promise.all([
      Project.countDocuments(visibleQuery),
      User.countDocuments({ isBanned: false, deletedAt: null }),
      Project.aggregate([{ $match: visibleQuery }, { $group: { _id: null, total: { $sum: '$starsCount' } } }]),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        projectsCount,
        membersCount,
        starsCount: starsAgg[0]?.total || 0,
      },
    });
  } catch (error) {
    next(error);
  }
};

const getProjects = async (req, res, next) => {
  try {
    const { search, category, language, tags, owner, sort = 'newest', page = 1, limit = 20 } = req.query;

    const query = { isDeleted: false };

    if (search) query.$text = { $search: search };
    if (category) query.category = category;
    if (language) query.language = language;
    if (owner) query.owner = owner;
    if (tags) query.tags = { $in: tags.split(',').map((t) => t.trim()).filter(Boolean) };

    // نستثني مشاريع الحسابات المحظورة أو بفترة الحذف المؤجل من العرض العام (إلا لو
    // فلترنا أصلاً على owner معيّن - هيك صفحة بروفايل صاحب حساب محظور بترجع فاضية
    // بدل ما ترمي خطأ، والـ owner endpoint نفسه already بيرجع 404 لبروفايله بأي حال)
    if (!owner) {
      const hiddenOwnerIds = await getHiddenOwnerIds();
      if (hiddenOwnerIds.length) query.owner = { $nin: hiddenOwnerIds };
    }

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      'most-starred': { starsCount: -1 },
      'most-downloaded': { downloadsCount: -1 },
    };

    const skip = (Number(page) - 1) * Number(limit);

    const [projects, total] = await Promise.all([
      Project.find(query)
        .populate('owner', 'name verified')
        .sort(sortOptions[sort] || sortOptions.newest)
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

// @route  GET /api/projects/featured
// @desc   المشاريع المميزة/الترند للصفحة الرئيسية
const getFeaturedProjects = async (req, res, next) => {
  try {
    const hiddenOwnerIds = await getHiddenOwnerIds();
    const baseQuery = hiddenOwnerIds.length
      ? { isDeleted: false, owner: { $nin: hiddenOwnerIds } }
      : { isDeleted: false };

    const [featured, trending, newest] = await Promise.all([
      Project.find({ ...baseQuery, isFeatured: true }).populate('owner', 'name verified').limit(6),
      Project.find(baseQuery).sort({ starsCount: -1 }).populate('owner', 'name verified').limit(6),
      Project.find(baseQuery).sort({ createdAt: -1 }).populate('owner', 'name verified').limit(6),
    ]);

    res.status(200).json({ success: true, featured, trending, newest });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/projects/:slug
// @desc   تفاصيل مشروع واحد كاملة
const getProjectBySlug = async (req, res, next) => {
  try {
    const project = await findVisibleProject(req.params.slug, req.user);

    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    const licenseDetails = LICENSE_INFO[project.license.type];

    // نزيد عداد المشاهدات إلا لو الزائر هو صاحب المشروع نفسه (حتى ما يضخّم رقمه
    // بمجرد ما يفتح صفحة مشروعه هو بشكل متكرر). تحديث غير حاجب (fire-and-forget)
    // حتى ما نأخر الاستجابة لأجل عملية إحصائية بسيطة
    const isOwnerViewing = req.user && String(req.user._id) === String(project.owner._id);
    if (!isOwnerViewing) {
      project.viewsCount = (project.viewsCount || 0) + 1;
      Project.findByIdAndUpdate(project._id, { $inc: { viewsCount: 1 } }).catch(() => {});
    }

    // لو الزائر مسجل دخول (عن طريق optionalAuth)، نتأكد هل هو already مسجل نجمة على هاد المشروع
    let isStarredByMe = false;
    if (req.user) {
      const existingStar = await Star.findOne({ user: req.user._id, project: project._id });
      isStarredByMe = !!existingStar;
    }

    res.status(200).json({
      success: true,
      project,
      licenseDetails,
      isStarredByMe,
    });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/projects/:slug
// @desc   تحديث مشروع (نصوص فقط، أو مع استبدال الملفات مع الاحتفاظ بنسخة احتياطية)
const updateProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, isDeleted: false });

    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    if (String(project.owner) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: t(req.lang, 'notYourProject') });
    }

    const { name, description, readme, category, language, tags, licenseType, licenseCustomText } =
      req.body;

    if (name) project.name = name;
    if (description) project.description = description;
    if (readme !== undefined) project.readme = readme;
    if (category) project.category = category;
    if (language) project.language = language;
    if (tags) project.tags = tags.split(',').map((t) => t.trim()).filter(Boolean);
    if (licenseType) {
      project.license = {
        type: licenseType,
        customText: licenseType === 'Custom' ? licenseCustomText || '' : '',
      };
    }

    // لو المستخدم رفع ملفات جديدة، نستبدل الملفات القديمة لكن نحتفظ بنسخة احتياطية منها لمدة 7 أيام
    const newFiles = req.files || [];
    if (newFiles.length > 0) {
      const totalSize = newFiles.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > MAX_PROJECT_SIZE) {
        await Promise.all(newFiles.map((f) => fs.promises.unlink(f.path).catch(() => {})));
        return res.status(400).json({ success: false, message: t(req.lang, 'newFilesSizeExceeded') });
      }

      const filePaths = normalizeFilePaths(req.body.filePaths, newFiles.length);
      const uploadedFilesMeta = await processUploadedFiles(newFiles, project.owner, project.slug, filePaths, req.lang);

      // نحتفظ بالملفات القديمة كنسخة احتياطية (بمكانها بالتخزين، بدون حذف فعلي بعد)
      project.previousBackup = { files: project.files, savedAt: new Date() };

      project.files = uploadedFilesMeta;
      project.totalSizeBytes = totalSize;
    }

    await project.save();

    res.status(200).json({ success: true, project });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/projects/:slug
// @desc   حذف مشروع نهائياً (ملفاته من التخزين + السجل من قاعدة البيانات)
const deleteProject = async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug });

    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    const isOwner = String(project.owner) === String(req.user._id);
    const isAdmin = req.user.role === 'admin';

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: t(req.lang, 'cantDeleteProject') });
    }

    // نحذف كل ملفات المشروع من التخزين الدائم
    await Promise.all(project.files.map((f) => deleteFile(f.storageKey)));
    if (project.previousBackup?.files?.length) {
      await Promise.all(project.previousBackup.files.map((f) => deleteFile(f.storageKey)));
    }

    await project.deleteOne();
    await Star.deleteMany({ project: project._id });

    res.status(200).json({ success: true, message: t(req.lang, 'projectDeleted') });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/projects/:slug/download
// @desc   تنزيل كل ملفات المشروع كملف ZIP واحد (من الموقع مباشرة، بدون rate limit)
// @route  GET /api/projects/:slug/files/:fileId/content
// @desc   معاينة سريعة لمحتوى ملف نصي داخل المشروع، بدون الحاجة لتنزيل المشروع كامل
const getFileContent = async (req, res, next) => {
  try {
    const project = await findVisibleProject(req.params.slug, req.user);
    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    const file = project.files.id(req.params.fileId);
    if (!file) {
      return res.status(404).json({ success: false, message: t(req.lang, 'fileNotFound') });
    }

    if (!isPreviewable(file.filename)) {
      return res.status(415).json({ success: false, message: t(req.lang, 'filePreviewUnsupported') });
    }

    if (file.size > PREVIEW_MAX_BYTES) {
      return res.status(413).json({ success: false, message: t(req.lang, 'filePreviewTooLarge') });
    }

    const stream = await getFileStream(file.storageKey);
    const content = await streamToString(stream);

    res.status(200).json({
      success: true,
      content,
      filename: file.filename,
      relativePath: file.relativePath,
    });
  } catch (error) {
    next(error);
  }
};

const downloadProject = async (req, res, next) => {
  try {
    const project = await findVisibleProject(req.params.slug, req.user);

    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    if (project.files.length === 0) {
      return res.status(400).json({ success: false, message: t(req.lang, 'projectNoFiles') });
    }

    res.attachment(`${project.slug}.zip`);
    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    for (const file of project.files) {
      const stream = await getFileStream(file.storageKey);
      // نستخدم relativePath (مو filename بس) حتى تنحفظ بنية المجلدات بالـ ZIP الناتج
      archive.append(stream, { name: file.relativePath || file.filename });
    }

    await archive.finalize();

    // نزيد عداد التنزيلات بعد ما يخلص الأرشيف (بدون ما ننتظره يأخر الاستجابة)
    Project.findByIdAndUpdate(project._id, { $inc: { downloadsCount: 1 } }).catch(() => {});
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/projects/:slug/star
// @desc   إضافة/إزالة star (toggle) بنفس فلسفة GitHub
// ملاحظة: العملية هون *ذرية بالكامل* (atomic) - ما بتعتمد على قراءة القيمة الحالية ثم
// حسابها وحفظها (كان فيها احتمال خطأ لو صار ضغط سريع متكرر أو طلبات متزامنة)، وبتحمي
// من تكرار النجمة حتى لو القيد الفريد (unique index) بقاعدة البيانات لأي سبب ما اشتغل
const toggleStar = async (req, res, next) => {
  try {
    const project = await Project.findOne({ slug: req.params.slug, isDeleted: false });

    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    // نحاول نحذف أولاً بشكل ذري: لو كانت موجودة فعلاً، هاد بيثبت إنو المستخدم already مسجّل نجمة
    const deleted = await Star.findOneAndDelete({ user: req.user._id, project: project._id });

    if (deleted) {
      const updated = await Project.findByIdAndUpdate(
        project._id,
        { $inc: { starsCount: -1 } },
        { new: true }
      );
      return res.status(200).json({
        success: true,
        starred: false,
        starsCount: Math.max(0, updated.starsCount),
      });
    }

    // ما كانت موجودة، نحاول ننشئها. لو صار سباق حقيقي (طلبين بنفس اللحظة بالظبط) وصار
    // duplicate key error، هاد دليل إنو حدا ثاني (أو نفس الطلب مكرر) سبقنا فعلاً بإنشائها
    try {
      await Star.create({ user: req.user._id, project: project._id });
    } catch (err) {
      if (err.code === 11000) {
        const current = await Project.findById(project._id);
        return res.status(200).json({ success: true, starred: true, starsCount: current.starsCount });
      }
      throw err;
    }

    const updated = await Project.findByIdAndUpdate(
      project._id,
      { $inc: { starsCount: 1 } },
      { new: true }
    );

    // نشعر صاحب المشروع بنجمة جديدة (إلا لو حط نجمة على مشروعه هو نفسه)
    if (String(project.owner) !== String(req.user._id)) {
      Notification.create({
        recipient: project.owner,
        type: 'new_star',
        messageKey: 'newStarNotification',
        messageParams: { actor: req.user.name, project: project.name },
        relatedProject: project._id,
      }).catch(() => {});
    }

    res.status(200).json({ success: true, starred: true, starsCount: updated.starsCount });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/projects/meta/licenses
// @desc   قائمة التراخيص المتاحة مع شرح كل واحد (تُستخدم بصفحة رفع مشروع)
const getLicenseOptions = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      types: Project.PRESET_LICENSES,
      details: LICENSE_INFO,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
  findVisibleProject,
};
