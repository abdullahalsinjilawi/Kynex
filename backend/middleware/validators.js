const { body, validationResult } = require('express-validator');
const { t } = require('../utils/i18n');

// middleware مشترك: يفحص لو فيه أخطاء تحقق (من أي سلسلة validators قبله) ويرجعها موحّدة
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: errors.array()[0].msg, // أول خطأ بس، حتى ما نغرق المستخدم برسائل كتيرة
      errors: errors.array(),
    });
  }
  next();
};

// .withMessage بتقبل دالة (value, { req }) => نص بدل نص ثابت، فهيك رسالة كل قاعدة
// تترجم حسب req.lang (نفس آلية باقي الردود) بدل ما تضل عربي دايماً بغض النظر عن اللغة
const msg = (key, params) => (value, { req }) => t(req.lang, key, params);

const registerValidators = [
  body('name').trim().notEmpty().withMessage(msg('nameRequired')).isLength({ max: 50 }),
  body('email').trim().isEmail().withMessage(msg('emailInvalid')).normalizeEmail(),
  body('password').isLength({ min: 8 }).withMessage(msg('passwordMinLength')),
  handleValidationErrors,
];

const loginValidators = [
  body('email').trim().isEmail().withMessage(msg('emailInvalid')).normalizeEmail(),
  body('password').notEmpty().withMessage(msg('passwordRequired')),
  handleValidationErrors,
];

const createProjectValidators = [
  body('name').trim().notEmpty().withMessage(msg('projectNameRequired')).isLength({ max: 100 }),
  body('description').trim().notEmpty().withMessage(msg('descriptionRequired')).isLength({ max: 1000 }),
  body('category')
    .isIn(['training-code', 'model-architecture', 'dataset', 'data-cleaning', 'other'])
    .withMessage(msg('unknownCategory')),
  body('language').trim().notEmpty().withMessage(msg('languageRequired')),
  handleValidationErrors,
];

const addCommentValidators = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage(msg('commentContentRequired'))
    .isLength({ max: 1000 })
    .withMessage(msg('commentTooLong')),
  handleValidationErrors,
];

module.exports = {
  handleValidationErrors,
  registerValidators,
  loginValidators,
  createProjectValidators,
  addCommentValidators,
};
