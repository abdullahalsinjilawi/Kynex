const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const logger = require('../utils/logger');
const { t } = require('../utils/i18n');

// دالة مساعدة لإرجاع بيانات المستخدم بشكل آمن (بدون كلمة سر أو توكنات حساسة)
const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  bio: user.bio,
  socialLinks: user.socialLinks,
  avatarUrl: user.avatarUrl,
  isEmailVerified: user.isEmailVerified,
  verified: user.verified,
  role: user.role,
  createdAt: user.createdAt,
  deletedAt: user.deletedAt || null,
});

// إعدادات كوكي الـ JWT: httpOnly يمنع أي جافاسكريبت (حتى لو صار XSS) من قراءة التوكن،
// وهاد أهم فرق عن تخزينه بـ localStorage. secure/sameSite تتغير حسب البيئة لأنو
// بالإنتاج على Render، الفرونت والباك اند غالباً على دومينين مختلفين (cross-site)
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 أيام، يطابق JWT_EXPIRES_IN الافتراضي
};

const setAuthCookie = (res, userId) => {
  const token = generateToken(userId);
  res.cookie('token', token, COOKIE_OPTIONS);
};

// @route  POST /api/auth/register
const register = async (req, res, next) => {
  try {
    const { name, email, password, acceptedTerms } = req.body;

    if (!acceptedTerms) {
      return res
        .status(400)
        .json({ success: false, message: t(req.lang, 'mustAcceptTerms') });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ success: false, message: t(req.lang, 'emailAlreadyUsed') });
    }

    // ما فيه كود تفعيل ولا إيميل تحقق — الحساب يصير فعّال وموصول مباشرة بعد التسجيل
    const user = new User({ name, email, password, acceptedTermsAt: Date.now() });
    await user.save();

    logger.info(`مستخدم جديد سجّل: ${user.email}`);

    setAuthCookie(res, user._id);

    res.status(201).json({
      success: true,
      message: t(req.lang, 'registeredSuccess'),
      user: sanitizeUser(user),
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/login
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select(
      '+password +failedLoginAttempts +lockUntil'
    );

    // رسالة موحّدة لو الإيميل غير موجود أو كلمة السر غلط، حتى ما نسرّب أي إيميل مسجل فعلاً
    const invalidCredsResponse = () =>
      res.status(401).json({ success: false, message: t(req.lang, 'invalidCredentials') });

    if (!user) return invalidCredsResponse();

    if (user.isLocked()) {
      const minutesLeft = Math.ceil((user.lockUntil - Date.now()) / 60000);
      return res.status(423).json({
        success: false,
        message: t(req.lang, 'accountLocked', { minutes: minutesLeft }),
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      await user.registerFailedLogin();
      return invalidCredsResponse();
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: t(req.lang, 'accountBanned') });
    }

    await user.resetFailedLogins();
    setAuthCookie(res, user._id);

    res.status(200).json({
      success: true,
      user: sanitizeUser(user),
      accountPendingDeletion: !!user.deletedAt,
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/auth/logout
// @desc   حذف كوكي الجلسة
const logoutUser = (req, res) => {
  res.clearCookie('token', COOKIE_OPTIONS);
  res.status(200).json({ success: true, message: t(req.lang, 'loggedOut') });
};

// @route  GET /api/auth/me
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({ success: true, user: sanitizeUser(req.user) });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  register,
  login,
  logoutUser,
  getMe,
  sanitizeUser,
};
