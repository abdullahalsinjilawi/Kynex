// الفرونت اند بيبعت هيدر X-Lang مع كل طلب (يعكس لغة i18next الحالية بالواجهة -
// أنظر frontend/src/api/client.js). منحط القيمة على req.lang حتى تستخدمها كل
// الـ controllers لما ترجع رسائل نصية (أنظر utils/i18n.js). عربي افتراضياً لو الهيدر
// مو موجود أو قيمته غير مدعومة.
const SUPPORTED_LANGS = ['ar', 'en'];

function detectLanguage(req, res, next) {
  const headerLang = req.headers['x-lang'];
  req.lang = SUPPORTED_LANGS.includes(headerLang) ? headerLang : 'ar';
  next();
}

module.exports = { detectLanguage, SUPPORTED_LANGS };
