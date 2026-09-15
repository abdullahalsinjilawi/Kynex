const User = require('../models/User');
const { encrypt } = require('../utils/encryption');
const { sanitizeUser } = require('./authController');
const { t } = require('../utils/i18n');

// @route  PUT /api/users/profile
// @desc   تعديل الاسم والنبذة وروابط التواصل
const updateProfile = async (req, res, next) => {
  try {
    const { name, bio, socialLinks } = req.body;

    if (name) req.user.name = name;
    if (bio !== undefined) req.user.bio = bio;
    if (socialLinks) req.user.socialLinks = { ...req.user.socialLinks, ...socialLinks };

    await req.user.save();

    res.status(200).json({ success: true, user: sanitizeUser(req.user) });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/users/huggingface-token
// @desc   إضافة أو تحديث توكن HuggingFace (يُشفّر قبل التخزين مباشرة)
const setHuggingFaceToken = async (req, res, next) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ success: false, message: t(req.lang, 'tokenRequired') });
    }

    req.user.huggingfaceToken = encrypt(token);
    await req.user.save();

    res.status(200).json({ success: true, message: t(req.lang, 'tokenSavedEncrypted') });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/users/huggingface-token
// @desc   حذف توكن HuggingFace من الحساب
const deleteHuggingFaceToken = async (req, res, next) => {
  try {
    req.user.huggingfaceToken = null;
    await req.user.save();
    res.status(200).json({ success: true, message: t(req.lang, 'tokenDeleted') });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/huggingface-token/status
// @desc   التأكد فقط هل فيه توكن محفوظ أو لأ (بدون إرجاع قيمته الحقيقية أبداً)
const getHuggingFaceTokenStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+huggingfaceToken');
    res.status(200).json({ success: true, hasToken: !!user.huggingfaceToken });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/users/api-key
// @desc   توليد (أو إعادة توليد) الـ API key الخاص بالمستخدم
const generateApiKey = async (req, res, next) => {
  try {
    const key = req.user.generateApiKey();
    await req.user.save();
    // هاي المرة الوحيدة يلي بترجع فيها القيمة الصريحة للمفتاح
    res.status(200).json({ success: true, apiKey: key });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/api-key/status
// @desc   التأكد هل عند المستخدم API key موجود أصلاً بدون كشف قيمته
const getApiKeyStatus = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('+apiKey');
    res.status(200).json({ success: true, hasApiKey: !!user.apiKey });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/users/:id
// @desc   عرض بروفايل عام لأي مستخدم (بدون بيانات حساسة)
// @route  GET /api/users/recent
// @desc   آخر الأعضاء اللي انضموا (للصفحة الرئيسية) - بيانات عامة آمنة بس، بدون
// حسابات محظورة أو بفترة حذف مؤجل (قسم ترحيبي، منطقي نستثنيهم منه)
const getRecentMembers = async (req, res, next) => {
  try {
    const limit = Math.min(Number(req.query.limit) || 8, 20);
    const users = await User.find({ isBanned: false, deletedAt: null })
      .select('name avatarUrl verified createdAt')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.status(200).json({
      success: true,
      users: users.map((u) => ({
        id: u._id,
        name: u.name,
        avatarUrl: u.avatarUrl,
        verified: u.verified,
        createdAt: u.createdAt,
      })),
    });
  } catch (error) {
    next(error);
  }
};

const getPublicProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user || user.deletedAt) {
      return res.status(404).json({ success: false, message: t(req.lang, 'userNotFound') });
    }

    res.status(200).json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        bio: user.bio,
        socialLinks: user.socialLinks,
        avatarUrl: user.avatarUrl,
        verified: user.verified,
        lastActiveAt: user.lastActiveAt,
        createdAt: user.createdAt,
      },
    });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/users/me
// @desc   طلب حذف الحساب - حذف مؤجل (soft delete) لمدة 30 يوم قبل الحذف النهائي
const requestAccountDeletion = async (req, res, next) => {
  try {
    const { password } = req.body;

    // نتأكد من كلمة السر قبل حذف الحساب، حماية من إنو حدا يحذف حسابك لو نسيت جلستك مفتوحة
    const user = await User.findById(req.user._id).select('+password');
    if (!password || !(await user.matchPassword(password))) {
      return res.status(401).json({ success: false, message: t(req.lang, 'wrongPassword') });
    }

    user.deletedAt = new Date();
    await user.save();

    res.status(200).json({
      success: true,
      message: t(req.lang, 'accountScheduledDeletion'),
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/users/me/restore
// @desc   إلغاء طلب الحذف واستعادة الحساب (لازم يكون لسه بفترة الـ 30 يوم)
const restoreAccount = async (req, res, next) => {
  try {
    if (!req.user.deletedAt) {
      return res.status(400).json({ success: false, message: t(req.lang, 'accountNotScheduled') });
    }

    req.user.deletedAt = null;
    await req.user.save();

    res.status(200).json({ success: true, message: t(req.lang, 'accountRestored') });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  updateProfile,
  setHuggingFaceToken,
  deleteHuggingFaceToken,
  getHuggingFaceTokenStatus,
  generateApiKey,
  getApiKeyStatus,
  getPublicProfile,
  getRecentMembers,
  requestAccountDeletion,
  restoreAccount,
};
