const User = require('../models/User');
const { t } = require('../utils/i18n');

// نستخدم هاد الـ middleware بدل protect العادي بمسارات الـ API الخارجية
// لأنو الاعتماد هون على API key بالـ header، مش على JWT تسجيل الدخول
const apiKeyAuth = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({ success: false, message: t(req.lang, 'apiKeyHeaderRequired') });
  }

  const owner = await User.findOne({ apiKey }).select('+apiKey');

  if (!owner) {
    return res.status(401).json({ success: false, message: t(req.lang, 'apiKeyInvalid') });
  }

  if (owner.isBanned || owner.deletedAt) {
    return res.status(403).json({ success: false, message: t(req.lang, 'accountInactive') });
  }

  req.apiOwner = owner; // صاحب الـ API key (يلي هاد الكي بيسمح بتنزيل مشاريعه فقط)
  next();
};

module.exports = apiKeyAuth;
