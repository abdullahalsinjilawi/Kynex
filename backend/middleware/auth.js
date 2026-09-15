const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { t } = require('../utils/i18n');

// بيتأكد إنو فيه توكن صحيح بالـ header، وبيحط بيانات المستخدم بـ req.user
// نستخدمه قبل أي route بده المستخدم يكون مسجل دخول (مثلاً: رفع مشروع، إضافة تعليق)
const protect = async (req, res, next) => {
  let token;

  // أولوية للكوكي (هيك بيشتغل الفرونت اند)، وندعم الـ header كمان لسهولة الاختبار بـ curl/Postman
  if (req.cookies?.token) {
    token = req.cookies.token;
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return res.status(401).json({ success: false, message: t(req.lang, 'unauthorized') });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({ success: false, message: t(req.lang, 'userNotFound') });
    }

    if (user.isBanned) {
      return res.status(403).json({ success: false, message: t(req.lang, 'accountBanned') });
    }

    // ملاحظة: ما منمنع المستخدم كلياً هون لو حسابه بفترة الحذف المؤجل (deletedAt)
    // لأنو لازم يقدر يسجّل دخول ليشوف صفحة "استعادة الحساب". الحماية الفعلية
    // من استخدام باقي ميزات الموقع أثناء هاي الفترة موجودة بـ requireActiveAccount أدناه،
    // وتُستخدم بشكل منفصل على الـ routes الحساسة (رفع مشروع، تعليق...الخ)

    // نحدّث آخر نشاط للمستخدم (بدون ما ننتظر النتيجة، ما يهمناش نأخر الطلب بسببها)
    User.findByIdAndUpdate(user._id, { lastActiveAt: Date.now() }).catch(() => {});

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({ success: false, message: t(req.lang, 'invalidToken') });
  }
};

// بيسمح فقط للأدمن يكمل، لازم يجي بعد protect
const adminOnly = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({ success: false, message: t(req.lang, 'forbiddenAdmin') });
};

// يُستخدم على أي إجراء "فعلي" (رفع، تعليق، نجمة...) لمنع حسابات بفترة الحذف المؤجل من التفاعل
// بينما يسمحلها بالتسجيل دخول واستعادة الحساب فقط، لازم يجي بعد protect
const requireActiveAccount = (req, res, next) => {
  if (req.user && req.user.deletedAt) {
    return res.status(403).json({
      success: false,
      message: t(req.lang, 'pendingDeletionBlock'),
    });
  }
  next();
};

// نفس فكرة protect، بس ما بيرفض الطلب لو ما في توكن - بس بيحط req.user لو موجود ومصحح
// نستخدمه بصفحات عامة (زي تفاصيل مشروع) بدها تعرف هوية الزائر *لو كان مسجل دخول* بدون
// ما تجبره يسجل دخول أصلاً (مثال: نعرف هل هو مسجل نجمة على هاد المشروع أو لأ)
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.cookies?.token) {
    token = req.cookies.token;
  } else {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) return next();

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (user && !user.isBanned) {
      req.user = user;
    }
  } catch (error) {
    // توكن غلط أو منتهي - نكمل كزائر عادي بدون ما نوقف الطلب
  }

  next();
};

module.exports = { protect, adminOnly, requireActiveAccount, optionalAuth };
