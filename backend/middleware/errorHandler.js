// هذا الـ middleware بيمسك أي خطأ يصير بأي route وبيرجعه بشكل موحّد ومنظم
// بدل ما كل route يتعامل مع الأخطاء بطريقته الخاصة

const { t } = require('../utils/i18n');

const errorHandler = (err, req, res, next) => {
  console.error('❌ خطأ:', err.message);
  const lang = req.lang || 'ar';

  // لو الخطأ من Mongoose بسبب ID غير صحيح الصيغة
  if (err.name === 'CastError') {
    return res.status(400).json({ success: false, message: t(lang, 'invalidId') });
  }

  // لو الخطأ بسبب تكرار قيمة فريدة (مثلاً إيميل مستخدم مسبقاً)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(400).json({
      success: false,
      message: t(lang, 'fieldAlreadyUsed', { field }),
    });
  }

  // لو الخطأ من validation بتاع Mongoose (حقل مفقود أو غير صحيح)
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map((val) => val.message);
    return res.status(400).json({ success: false, message: messages.join(', ') });
  }

  // أي خطأ تاني غير متوقع - err.message ممكن يكون أصلاً نص مترجم (رسالة رميناها إحنا
  // بالكود عن طريق t())، فبنسيبه متل ما هو، وبنرجع رسالة عامة مترجمة بس لو ما فيه شي
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || t(lang, 'genericServerError'),
  });
};

// middleware للتعامل مع أي route غير موجود (404)
const notFound = (req, res, next) => {
  const error = new Error(t(req.lang || 'ar', 'routeNotFound', { path: req.originalUrl }));
  res.status(404);
  next(error);
};

module.exports = { errorHandler, notFound };
