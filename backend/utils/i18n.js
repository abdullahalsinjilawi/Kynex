/**
 * نظام ترجمة بسيط لرسائل الباك اند (أخطاء، رسائل نجاح، إشعارات). لغة الاستجابة تتحدد
 * حسب هيدر X-Lang يلي بيبعته الفرونت اند تلقائياً مع كل طلب (يعكس لغة i18next الحالية
 * بالواجهة) - أنظر middleware/language.js. الافتراضي عربي لو الهيدر مو موجود.
 *
 * الاستخدام: const { t } = require('../utils/i18n'); ... message: t(req.lang, 'auth.emailExists')
 * مع متغيرات: t(req.lang, 'auth.accountLocked', { minutes: 5 })
 */

const messages = {
  ar: {
    // ============ عام ============
    userNotFound: 'المستخدم غير موجود',
    projectNotFound: 'المشروع غير موجود',
    deletedUser: 'مستخدم محذوف',
    unauthorized: 'غير مصرّح، يجب تسجيل الدخول',
    forbiddenAdmin: 'هذا الإجراء يتطلب صلاحيات أدمن',
    accountBanned: 'هذا الحساب محظور',
    invalidToken: 'توكن غير صحيح أو منتهي',
    invalidId: 'معرّف غير صحيح',
    fieldAlreadyUsed: '{{field}} مستخدم مسبقاً',
    pendingDeletionBlock: 'حسابك مجدول للحذف حالياً. استعد حسابك أولاً من الإعدادات قبل إكمال هذا الإجراء',

    // ============ auth ============
    mustAcceptTerms: 'يجب الموافقة على شروط الاستخدام للمتابعة',
    emailAlreadyUsed: 'هذا الإيميل مستخدم مسبقاً',
    usernameRequired: 'اسم المستخدم مطلوب',
    usernameLength: 'اسم المستخدم لازم يكون بين 3 و30 حرف',
    usernameInvalidFormat: 'اسم المستخدم بيقبل بس حروف إنجليزية صغيرة وأرقام و_ و-',
    usernameTaken: 'اسم المستخدم هذا مأخوذ مسبقاً',
    registeredSuccess: 'تم إنشاء الحساب بنجاح',
    invalidCredentials: 'الإيميل أو كلمة السر غير صحيحة',
    accountLocked: 'الحساب مقفول مؤقتاً بسبب محاولات دخول فاشلة كتيرة. حاول بعد {{minutes}} دقيقة',
    loggedOut: 'تم تسجيل الخروج',

    // ============ project ============
    requiredFieldsMissing: 'الحقول الأساسية كلها مطلوبة',
    unknownLicenseType: 'نوع ترخيص غير معروف',
    customLicenseTextRequired: 'لازم تكتب نص الترخيص المخصص',
    projectSizeExceeded: 'حجم المشروع الإجمالي تجاوز الحد المسموح ({{maxGb}}GB)',
    newFilesSizeExceeded: 'حجم الملفات الجديدة تجاوز الحد المسموح',
    noFileProvided: 'ما في ملف مرفق بالطلب',
    notYourProject: 'هذا المشروع مش تبعك',
    cantDeleteProject: 'ما فيك تحذف هذا المشروع',
    projectDeleted: 'تم حذف المشروع',
    projectNoFiles: 'المشروع ما فيه ملفات للتنزيل',
    fileScanFailed: 'الملف {{filename}} فشل بفحص الأمان ({{viruses}})',
    scanUnavailable: 'تعذّر فحص الملف أمنياً حالياً، حاول مرة تانية بعد شوي',
    filePreviewUnsupported: 'معاينة هذا النوع من الملفات غير مدعومة',
    filePreviewTooLarge: 'الملف كبير جداً للمعاينة، نزّل المشروع كامل لعرضه',
    fileNotFound: 'الملف غير موجود',
    newStarNotification: '{{actor}} حط نجمة على مشروعك "{{project}}"',

    // ============ posts / المنتدى ============
    postNotFound: 'المنشور غير موجود',
    postFieldsRequired: 'العنوان والمحتوى مطلوبين',
    unknownPostType: 'نوع منشور غير معروف',
    unknownReactionType: 'نوع تفاعل غير معروف',
    notYourPost: 'هذا المنشور مش تبعك',
    postDeleted: 'تم حذف المنشور',
    postHidden: 'تم إخفاء المنشور',
    postShown: 'تم إظهار المنشور مجدداً',
    postTitleRequired: 'عنوان المنشور مطلوب',
    postTitleTooLong: 'العنوان طويل جداً (180 حرف كحد أقصى)',
    postContentRequired: 'محتوى المنشور مطلوب',
    postContentTooLong: 'المحتوى طويل جداً',
    cantDeleteOthersComment: 'ما فيك تحذف تعليق حدا تاني',
    commentDeleted: 'تم حذف التعليق',
    postCommentNotification: '{{actor}} علّق على منشورك "{{post}}"',
    postReplyNotification: '{{actor}} ردّ على تعليقك بمنشور "{{post}}"',
    postReactionNotification: '{{actor}} تفاعل مع منشورك "{{post}}"',

    // ============ comment ============
    commentContentRequired: 'محتوى التعليق مطلوب',
    commentNotFound: 'التعليق غير موجود',
    cantEditOthersComment: 'ما فيك تعدّل تعليق حدا تاني',
    newCommentNotification: '{{actor}} علّق على مشروعك "{{project}}"',

    // ============ report ============
    invalidReportType: 'نوع البلاغ غير صحيح',
    targetRequired: 'لازم تحدد الهدف',
    reportReasonRequired: 'لازم تختار سبب البلاغ',
    otherReasonRequires: 'لو اخترت "سبب آخر" لازم تكتب توضيح',
    reportReceived: 'تم استلام بلاغك، رح تراجعه الإدارة',
    reportNotFound: 'البلاغ غير موجود',

    // ============ message ============
    recipientAndContentRequired: 'المستلم والرسالة مطلوبين',
    cantMessageYourself: 'ما فيك تراسل حالك',
    conversationNotFound: 'المحادثة غير موجودة',
    messageEmpty: 'الرسالة فاضية',

    // ============ notification ============
    notificationNotFound: 'الإشعار غير موجود',
    allMarkedRead: 'تم تعليم كل الإشعارات كمقروءة',
    verifiedBadgeNotification: 'مبروك! حسابك حصل على شارة التحقق ✓',

    // ============ user / settings ============
    tokenRequired: 'التوكن مطلوب',
    tokenSavedEncrypted: 'تم حفظ التوكن بشكل مشفّر',
    tokenDeleted: 'تم حذف التوكن',
    wrongPassword: 'كلمة السر غير صحيحة',
    accountScheduledDeletion: 'تم جدولة حسابك للحذف بعد 30 يوم. فيك تسجّل دخول وتستعيده خلال هاي المدة',
    accountNotScheduled: 'حسابك مش مجدول للحذف أصلاً',
    accountRestored: 'تم استعادة حسابك بنجاح',

    // ============ admin ============
    cantBanAdmin: 'ما فيك تحظر حساب أدمن',
    userBanned: 'تم حظر المستخدم',
    userUnbanned: 'تم فك الحظر عن المستخدم',
    projectHidden: 'تم إخفاء المشروع',
    projectShown: 'تم إظهار المشروع مجدداً',
    bannedDueToReport: 'بسبب بلاغ: {{reason}}',

    // ============ api key ============
    apiKeyHeaderRequired: 'مطلوب API key بالـ header (x-api-key)',
    apiKeyInvalid: 'API key غير صحيح',
    accountInactive: 'هذا الحساب غير فعّال',
    apiKeyNotAuthorizedForProject: 'هذا الـ API key غير مصرّح له بتنزيل هذا المشروع',
    downloadRateLimited: 'تم تنزيل هذا المشروع مسبقاً اليوم. حاول بعد حوالي {{hours}} ساعة',

    // ============ validators ============
    nameRequired: 'الاسم مطلوب',
    emailInvalid: 'صيغة الإيميل غير صحيحة',
    passwordMinLength: 'كلمة السر يجب أن تكون 8 أحرف على الأقل',
    passwordRequired: 'كلمة السر مطلوبة',
    projectNameRequired: 'اسم المشروع مطلوب',
    descriptionRequired: 'الوصف مطلوب',
    unknownCategory: 'فئة غير معروفة',
    languageRequired: 'لغة البرمجة مطلوبة',
    commentTooLong: 'التعليق طويل جداً',

    // ============ encryption ============
    invalidEncryptedFormat: 'صيغة النص المشفّر غير صحيحة',

    // ============ عام (معالج الأخطاء) ============
    genericServerError: 'حدث خطأ في السيرفر',
    routeNotFound: 'المسار غير موجود: {{path}}',
  },

  en: {
    userNotFound: 'User not found',
    projectNotFound: 'Project not found',
    deletedUser: 'Deleted user',
    unauthorized: 'Unauthorized, please log in',
    forbiddenAdmin: 'This action requires admin permissions',
    accountBanned: 'This account is banned',
    invalidToken: 'Invalid or expired token',
    invalidId: 'Invalid ID',
    fieldAlreadyUsed: '{{field}} is already in use',
    pendingDeletionBlock: 'Your account is currently scheduled for deletion. Restore your account from Settings first before completing this action',

    mustAcceptTerms: 'You must accept the Terms of Use to continue',
    emailAlreadyUsed: 'This email is already in use',
    usernameRequired: 'Username is required',
    usernameLength: 'Username must be between 3 and 30 characters',
    usernameInvalidFormat: 'Username can only contain lowercase letters, numbers, _ and -',
    usernameTaken: 'This username is already taken',
    registeredSuccess: 'Account created successfully',
    invalidCredentials: 'Incorrect email or password',
    accountLocked: 'Account is temporarily locked due to too many failed login attempts. Try again in {{minutes}} minutes',
    loggedOut: 'Logged out',

    requiredFieldsMissing: 'All required fields must be filled in',
    unknownLicenseType: 'Unknown license type',
    customLicenseTextRequired: 'You must write the custom license text',
    projectSizeExceeded: 'Total project size exceeds the allowed limit ({{maxGb}}GB)',
    newFilesSizeExceeded: 'The new files size exceeds the allowed limit',
    noFileProvided: 'No file was attached to the request',
    notYourProject: "This project isn't yours",
    cantDeleteProject: "You can't delete this project",
    projectDeleted: 'Project deleted',
    projectNoFiles: 'This project has no files to download',
    fileScanFailed: 'The file {{filename}} failed the security scan ({{viruses}})',
    scanUnavailable: "Couldn't scan the file for security right now, please try again shortly",
    filePreviewUnsupported: "Preview isn't supported for this file type",
    filePreviewTooLarge: 'File is too large to preview — download the full project to view it',
    fileNotFound: 'File not found',
    newStarNotification: '{{actor}} starred your project "{{project}}"',

    postNotFound: 'Post not found',
    postFieldsRequired: 'Title and content are required',
    unknownPostType: 'Unknown post type',
    unknownReactionType: 'Unknown reaction type',
    notYourPost: "This post isn't yours",
    postDeleted: 'Post deleted',
    postHidden: 'Post hidden',
    postShown: 'Post shown again',
    postTitleRequired: 'Post title is required',
    postTitleTooLong: 'Title is too long (180 characters max)',
    postContentRequired: 'Post content is required',
    postContentTooLong: 'Content is too long',
    cantDeleteOthersComment: "You can't delete someone else's comment",
    commentDeleted: 'Comment deleted',
    postCommentNotification: '{{actor}} commented on your post "{{post}}"',
    postReplyNotification: '{{actor}} replied to your comment on "{{post}}"',
    postReactionNotification: '{{actor}} reacted to your post "{{post}}"',

    commentContentRequired: 'Comment content is required',
    commentNotFound: 'Comment not found',
    cantEditOthersComment: "You can't edit someone else's comment",
    newCommentNotification: '{{actor}} commented on your project "{{project}}"',

    invalidReportType: 'Invalid report type',
    targetRequired: 'You must specify a target',
    reportReasonRequired: 'You must choose a reason for the report',
    otherReasonRequires: 'If you picked "Other reason" you need to add an explanation',
    reportReceived: 'Your report was received, the team will review it',
    reportNotFound: 'Report not found',

    recipientAndContentRequired: 'Recipient and message content are required',
    cantMessageYourself: "You can't message yourself",
    conversationNotFound: 'Conversation not found',
    messageEmpty: 'Message is empty',

    notificationNotFound: 'Notification not found',
    allMarkedRead: 'All notifications marked as read',
    verifiedBadgeNotification: 'Congrats! Your account got the verified badge ✓',

    tokenRequired: 'Token is required',
    tokenSavedEncrypted: 'Token saved, fully encrypted',
    tokenDeleted: 'Token deleted',
    wrongPassword: 'Incorrect password',
    accountScheduledDeletion: 'Your account is scheduled for deletion in 30 days. You can log in and restore it during that window',
    accountNotScheduled: "Your account isn't scheduled for deletion",
    accountRestored: 'Your account has been restored',

    cantBanAdmin: "You can't ban an admin account",
    userBanned: 'User banned',
    userUnbanned: 'User unbanned',
    projectHidden: 'Project hidden',
    projectShown: 'Project shown again',
    bannedDueToReport: 'Due to a report: {{reason}}',

    apiKeyHeaderRequired: 'API key required in the header (x-api-key)',
    apiKeyInvalid: 'Invalid API key',
    accountInactive: 'This account is inactive',
    apiKeyNotAuthorizedForProject: "This API key isn't authorized to download this project",
    downloadRateLimited: 'This project was already downloaded today. Try again in about {{hours}} hours',

    nameRequired: 'Name is required',
    emailInvalid: 'Invalid email format',
    passwordMinLength: 'Password must be at least 8 characters',
    passwordRequired: 'Password is required',
    projectNameRequired: 'Project name is required',
    descriptionRequired: 'Description is required',
    unknownCategory: 'Unknown category',
    languageRequired: 'Programming language is required',
    commentTooLong: 'Comment is too long',

    invalidEncryptedFormat: 'Invalid encrypted text format',

    genericServerError: 'A server error occurred',
    routeNotFound: 'Route not found: {{path}}',
  },
};

// بديل رقم عشري بسيط بالنص - نستخدمه بدل مكتبة i18n كاملة لأنو حجم القاموس صغير
// ومحتاجين بس استبدال {{var}} بقيمة، بدون تعقيد جموع/قواعد لغوية بجانب السيرفر
function interpolate(str, params) {
  if (!params) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => (params[key] !== undefined ? params[key] : `{{${key}}}`));
}

function t(lang, key, params) {
  const dict = messages[lang] && messages[lang][key] ? messages[lang] : messages.ar;
  const template = dict[key] || messages.ar[key] || key;
  return interpolate(template, params);
}

module.exports = { t };
