# Backend — منصة مشاريع الذكاء الاصطناعي

## التشغيل

```bash
npm install
cp .env.example .env
# عبّي .env: MONGO_URI, JWT_SECRET, ENCRYPTION_KEY (أنظر التعليقات جوا .env.example)
npm run dev
```

تأكد: `http://localhost:5000/api/health`

## ميزات الأمان (Production-Grade)

- **الجلسة**: JWT بكوكي `httpOnly` (مو localStorage) — حتى لو صار XSS، ما فيه جافاسكريبت يقدر يسرق التوكن
- **قفل الحساب**: بعد 5 محاولات دخول فاشلة متتالية، الحساب يُقفل 15 دقيقة تلقائياً
- **NoSQL injection**: `express-mongo-sanitize` بينضف أي محاولة حقن عبر `$` أو `.` بالمدخلات
- **Input validation**: `express-validator` مفعّل فعلياً بأهم المسارات (تسجيل، دخول، رفع مشروع، تعليق)
- **CORS مقيّد**: فقط دومين الفرونت اند المحدد بـ `FRONTEND_URL`، مو `*`
- **Rate limiting**: عام (300 طلب/15 دقيقة) + أشد على تسجيل الدخول (20 محاولة/15 دقيقة)
- **سجل تدقيق (Audit Log)**: كل إجراء أدمن (حظر، توثيق، إخفاء، تمييز، بلاغات) يُسجّل بـ `AdminAuditLog` مع هوية الأدمن ووقت الإجراء — `GET /api/admin/audit-log`
- **trust proxy مفعّل**: ضروري لأنو Render (وأي استضافة حديثة) خلف reverse proxy، وإلا كل الطلبات بتبين من نفس الـ IP وينكسر الـ rate limiting وتتبع تنزيلات الـ API
- **Graceful shutdown**: يقفل الاتصالات وقاعدة البيانات بشكل نظيف عند SIGTERM (Render بيرسلها قبل كل إعادة نشر)
- **صفر ثغرات معروفة** بمكتبات الإنتاج (`npm audit` نظيف) — تمت ترقية `multer` لـ 2.x، `nodemailer` لـ 10.x، وفرض نسخة `qs` آمنة

## كيف تعمل أول حساب أدمن

**متعمد** إنو ما فيه أي API endpoint لترقية مستخدم لأدمن — هاد قرار أمني، حتى ما يقدر حدا
يستغل ثغرة ويرقّي حسابه لأدمن بنفسه. لازم تعمل هيك يدوياً بقاعدة البيانات:

1. سجّل حساب عادي بالموقع وفعّله بالإيميل
2. افتح MongoDB (Compass أو `mongosh`) ولاقي المستخدم بقاعدة `kynex` بمجموعة `users`
3. غيّر حقل `role` من `"user"` إلى `"admin"` يدوياً

بعدها هاد الحساب رح يقدر يوصل لكل مسارات `/api/admin/*`.

## السكربتات الدورية (Cron Jobs)

فيه سكربتين لازم تشغلهم بشكل دوري (يدوياً هلأ بالتطوير، وبـ cron لما تنشر الموقع فعلياً):

```bash
node scripts/cleanupBackups.js          # يحذف النسخ الاحتياطية الأقدم من 7 أيام
node scripts/cleanupDeletedAccounts.js  # يحذف نهائياً الحسابات الأقدم من 30 يوم على طلب حذفها
```

> ملاحظة: Render's free/starter web services ما بتدعم cron jobs مدمجة. استخدم "Render Cron
> Jobs" (خدمة منفصلة بلوحة تحكم Render) أو خدمة خارجية زي cron-job.org تنادي endpoint خاص
> بهيك مهام (لو حبيت تحوّل السكربتين لـ HTTP endpoints محمية بمفتاح سري بدل تشغيل مباشر).

## بنية المشروع

```
backend/
├── config/         الاتصال بقاعدة البيانات + التحقق من متغيرات البيئة
├── controllers/    منطق كل route
├── middleware/     auth (كوكي JWT + API key)، رفع الملفات، validators، معالجة الأخطاء
├── models/         User, Project, Star, Comment, Report, Notification, ApiDownloadLog, AdminAuditLog
├── routes/         تجميع الـ endpoints
├── scripts/        سكربتات التنظيف الدورية
├── utils/          تشفير، إيميل، تخزين ملفات، فحص أمان، تراخيص، logger
└── server.js       نقطة التشغيل
```

## نقاط مهمة قبل الإنتاج الفعلي (Production)

- `utils/malwareScan.js` حالياً **stub** بيرجع "نظيف" دائماً — لازم تربطه بـ ClamAV أو VirusTotal فعلياً
- `utils/fileStorage.js` بيشتغل محلياً بدون إعدادات S3 — **على Render التخزين المحلي ما رح يستمر بين إعادة النشر** (ephemeral filesystem)، فلازم تعبي `S3_*` بـ Cloudflare R2 أو Backblaze B2 **قبل** أول نشر حقيقي
- Render ما بيوفر MongoDB مدمجة — استخدم [MongoDB Atlas](https://www.mongodb.com/atlas) (فيه خطة مجانية كافية للبداية) وحط رابطها بـ `MONGO_URI`
- `utils/sendEmail.js` غير مستخدم حالياً (التسجيل ما عاد يحتاج تفعيل إيميل) — موجود بس لو حبيت تفعّل إشعارات بالإيميل بالمستقبل

