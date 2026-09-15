// نتأكد من وجود كل المتغيرات الحرجة *قبل* ما نشغّل أي شي، حتى ما يصير فشل صامت
// أو خطأ غامض بمنتصف تشغيل الموقع بسبب متغير ناقص أو غلط بالإنتاج

function validateEnv() {
  const required = ['MONGO_URI', 'JWT_SECRET', 'ENCRYPTION_KEY'];
  const missing = required.filter((key) => !process.env[key]);

  if (missing.length > 0) {
    console.error(`❌ متغيرات بيئة ناقصة بالـ .env: ${missing.join(', ')}`);
    process.exit(1);
  }

  if (process.env.ENCRYPTION_KEY.length !== 64) {
    console.error('❌ ENCRYPTION_KEY لازم يكون بالضبط 64 حرف hex (32 بايت)');
    process.exit(1);
  }

  if (process.env.JWT_SECRET.length < 32) {
    console.error('❌ JWT_SECRET قصير جداً وغير آمن (لازم 32 حرف على الأقل)');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    console.error('❌ FRONTEND_URL مطلوب بالإنتاج (يُستخدم لتقييد CORS)');
    process.exit(1);
  }
}

module.exports = validateEnv;
