require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const mongoose = require('mongoose');

const validateEnv = require('./config/validateEnv');
const connectDB = require('./config/db');
const logger = require('./utils/logger');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const { detectLanguage } = require('./middleware/language');

// نتأكد من صحة متغيرات البيئة الحرجة قبل أي شي، ونتصل بقاعدة البيانات
validateEnv();
connectDB();

const app = express();

// Render (وأي منصة استضافة حديثة) بتحط تطبيقك خلف reverse proxy تبعها.
// بدون هاد السطر، req.ip بيرجع IP البروكسي الداخلي لكل الطلبات، يعني rate limiting
// وتتبع تنزيلات الـ API (مرة باليوم لكل IP) بينكسر تماماً لأنو كل الطلبات بتبين من نفس الـ IP
app.set('trust proxy', 1);

// --- Middlewares عامة ---
app.use(helmet());
app.use(compression());

// Logging احترافي لكل طلب HTTP (شكل مختصر بالإنتاج، مفصّل بالتطوير)
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// CORS: بالإنتاج نسمح فقط لدومين الفرونت اند الحقيقي (مو '*')، لأنو الكوكيز
// اللي فيها الـ JWT ما بتنبعت أصلاً لطلبات cross-origin إلا لو الأصل مسموح صراحة
//
// FRONTEND_URL ممكن يكون أكتر من دومين مفصولين بفاصلة (مثلاً بعد ما تضيف دومين مخصص
// بجانب دومين Render الافتراضي): FRONTEND_URL=https://kynex-2tld.onrender.com,https://kynex.app
//
// بيدعم كمان نمط wildcard بـ '*' جوا أي مقطع من الدومين — مفيد مع Render لأنو لو
// حذفت سيرفس وأعدت إنشاءه (أو الاسم الأصلي كان محجوز)، بيطلعلك لاحقة عشوائية جديدة
// كل مرة (kynex-pq7j.onrender.com بدل kynex-frontend.onrender.com مثلاً)، فبدل ما
// تضطر تحدّث FRONTEND_URL يدوياً بعد كل نشر، حط: FRONTEND_URL=https://kynex-*.onrender.com
// (انتبه: هاد بيوثق بأي سيرفس Render اسمه يبلش بـ kynex- بس، مش بس سيرفسك تحديداً —
// نطاق أضيق من الثقة بكل onrender.com، بس مش دقيق 100% متل دومين كامل محدد)
const DEV_FALLBACK_ORIGIN = 'http://localhost:5173';

// بنشيل محارف مخفية شائعة (مسافات صفرية، BOM، محارف اتجاه النص RTL/LTR زي ‎/‏) ممكن
// تنلصق بالغلط وقت نسخ رابط من واجهة عربية أو من متصفح، وبتخلي القيمة تبين مطابقة
// بالعين المجردة بس مش مطابقة فعلياً بالبايتات - وهاد بالضبط شكل الخطأ اللي بيصعب
// اكتشافه لو ما فحصت القيمة بمحرر نصوص عادي
const stripInvisibleChars = (str) => str.replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, '');

const normalizeOrigin = (raw) => stripInvisibleChars(raw).trim().replace(/\/$/, '').toLowerCase();

const allowedOriginPatterns = (process.env.FRONTEND_URL || DEV_FALLBACK_ORIGIN)
  .split(',')
  .map(normalizeOrigin)
  .filter(Boolean);

// نطبعها مرة وحدة وقت التشغيل (مش بس وقت الرفض) حتى تشوف فوراً بالـ Render logs،
// بدون ما تحتاج تستنى خطأ أول، شو بالضبط قاري الكود من FRONTEND_URL هلأ
logger.info(`🌐 CORS allowed origins: ${allowedOriginPatterns.join(', ') || '(فاضي! لازم تعبّي FRONTEND_URL)'}`);

const originMatchesPattern = (origin, pattern) => {
  if (!pattern.includes('*')) return origin === pattern;
  const escapedParts = pattern.split('*').map((part) => part.replace(/[.+?^${}()|[\]\\]/g, '\\$&'));
  const regex = new RegExp(`^${escapedParts.join('[a-z0-9-]+')}$`);
  return regex.test(origin);
};

app.use(
  cors({
    origin: (origin, callback) => {
      // ما في Origin header إطلاقاً (طلبات سيرفر-لسيرفر، curl، Postman...) - نسمحها
      if (!origin) return callback(null, true);

      const normalizedOrigin = normalizeOrigin(origin);
      const isAllowed = allowedOriginPatterns.some((pattern) => originMatchesPattern(normalizedOrigin, pattern));

      if (isAllowed) return callback(null, true);

      // نسجّل الدومين المرفوض *و* القائمة المسموحة الحالية سوا بنفس السطر، حتى
      // تشوف فوراً وين بالضبط الفرق بدل ما تضل تخمّن ليش عم يترفض
      logger.warn(
        `🚫 CORS رفض طلب من دومين غير موجود بقائمة FRONTEND_URL: "${origin}" ← بعد التنضيف: "${normalizedOrigin}" (القائمة المسموحة حالياً: ${allowedOriginPatterns.join(', ') || '(فاضي!)'})`
      );
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true, // ضروري حتى تنبعت/تنقبل الكوكيز عبر الطلبات cross-origin
  })
);

app.use(cookieParser());
app.use(express.json());

// حماية من NoSQL injection: بتشيل أي مفتاح بالـ body/query/params يبلش بـ '$' أو فيه '.'
// (مثال هجوم لولا هاي الحماية: إرسال {"password": {"$gt": ""}} بمحاولة تسجيل دخول)
app.use(mongoSanitize());
app.use(detectLanguage);

// Rate limiting عام
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: { success: false, message: 'طلبات كتيرة، حاول بعد شوي' },
});
app.use(generalLimiter);

// --- Routes ---
// بعض أدوات المراقبة/الـ uptime pingers بتضرب الدومين الرئيسي "/" مباشرة (مش "/api/health")
// حتى تتأكد إنو الخدمة صاحية. بدون هاد الراوت كانت كل هاي الطلبات بترجع كخطأ بالـ logs
app.get('/', (req, res) => {
  res.status(200).json({ success: true, message: 'Kynex API 🚀' });
});

app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
app.use('/api/posts', require('./routes/postRoutes'));
app.use('/api/reports', require('./routes/reportRoutes'));
app.use('/api/notifications', require('./routes/notificationRoutes'));
app.use('/api/messages', require('./routes/messageRoutes'));
app.use('/api/external', require('./routes/externalApiRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));

// --- معالجة الأخطاء (لازم تكون آخر شي) ---
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  logger.info(`🚀 السيرفر شغال على المنفذ ${PORT} (${process.env.NODE_ENV || 'development'})`);
});

// إغلاق نظيف (graceful shutdown): Render بيبعت SIGTERM قبل أي إعادة نشر أو إيقاف،
// فبنسكر الاتصالات الجارية وقاعدة البيانات بشكل مرتب بدل ما نقطع الطلبات فجأة
const shutdown = (signal) => {
  logger.info(`استلمنا ${signal}، جاري الإغلاق بشكل نظيف...`);
  server.close(async () => {
    await mongoose.connection.close();
    logger.info('تم إغلاق السيرفر وقاعدة البيانات بنجاح');
    process.exit(0);
  });

  // لو ما خلص الإغلاق النظيف خلال 10 ثواني، نجبر الإغلاق
  setTimeout(() => process.exit(1), 10000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));