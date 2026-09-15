// نستخدمها لتنظيف مسار الملف النسبي (relativePath) قبل تخزينه، سواء جاي من رفع
// مجلد كامل (خاصية webkitdirectory بالفرونت اند بتعطي كل ملف مساره النسبي تلقائياً)
// أو من ملف مفرد عادي (بنستخدم اسمه بس). بتحمي من:
// - محاولات path traversal (مثلاً اسم ملف/مسار فيه "../../etc/passwd")
// - رموز ممنوعة بأنظمة تشغيل مختلفة (خصوصاً ويندوز: < > : " | ? *)
// - فواصل backslash (بعض المتصفحات على ويندوز بترجع المسار فيها \ بدل /)
// - مسارات فاضية بالكامل بعد التنظيف (بترجع 'file' كقيمة احتياطية بدل ما تنكسر)
function sanitizeRelativePath(rawPath, fallbackName) {
  const source = rawPath || fallbackName || 'file';

  const segments = source
    .replace(/\\/g, '/')
    .split('/')
    .map((seg) => seg.trim())
    .filter((seg) => seg.length > 0 && seg !== '.' && seg !== '..')
    .map((seg) => seg.replace(/[<>:"|?*\x00-\x1f]/g, '_').slice(0, 200));

  const cleaned = segments.join('/');
  return cleaned || 'file';
}

module.exports = { sanitizeRelativePath };
