const mongoose = require('mongoose');
const logger = require('../utils/logger');

// دالة الاتصال بقاعدة بيانات MongoDB
// تُستدعى مرة واحدة عند تشغيل السيرفر
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`✅ MongoDB متصل بنجاح: ${conn.connection.host}`);

    // نتأكد صراحة إنو كل القيود الفريدة (unique indexes) مبنية فعلياً على قاعدة البيانات.
    // بدون هاد، لو فشل بناء قيد (مثلاً بسبب بيانات مكررة موجودة مسبقاً بالكولكشن)، مافي
    // أي رسالة خطأ توضح هيك، وميزات زي "نجمة وحدة لكل مستخدم" بتنكسر بصمت تام
    const Star = require('../models/Star');
    const User = require('../models/User');
    const ApiDownloadLog = require('../models/ApiDownloadLog');

    for (const [name, Model] of [
      ['Star', Star],
      ['User', User],
      ['ApiDownloadLog', ApiDownloadLog],
    ]) {
      try {
        await Model.syncIndexes();
      } catch (indexError) {
        logger.error(
          `❌ فشل بناء القيود الفريدة لموديل ${name} — على الأغلب فيه بيانات مكررة موجودة مسبقاً بالكولكشن لازم تنضف يدوياً بقاعدة البيانات!`,
          indexError.message
        );
      }
    }
  } catch (error) {
    console.error(`❌ فشل الاتصال بقاعدة البيانات: ${error.message}`);
    // لو فشل الاتصال، ما فيه داعي السيرفر يكمل شغل
    process.exit(1);
  }
};

module.exports = connectDB;
