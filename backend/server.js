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
const allowedOrigin = process.env.FRONTEND_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
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
app.use('/api/health', require('./routes/health'));
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/projects', require('./routes/projectRoutes'));
app.use('/api/comments', require('./routes/commentRoutes'));
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
