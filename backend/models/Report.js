const mongoose = require('mongoose');

// الفئات الجاهزة لسبب البلاغ - نفس فلسفة منصات التواصل الاجتماعي (استبيان بدل نص حر فقط)
const REPORT_CATEGORIES = [
  'harassment', // إساءة لفظية / تنمّر
  'hate_speech', // خطاب كراهية
  'inappropriate_content', // محتوى غير لائق
  'spam', // سبام / إعلان
  'stolen_content', // انتحال/سرقة محتوى
  'misinformation', // معلومات مضللة
  'other', // سبب آخر
];

const reportSchema = new mongoose.Schema(
  {
    reporter: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // نوع المحتوى المُبلَّغ عنه
    targetType: {
      type: String,
      enum: ['comment', 'project', 'user'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    category: {
      type: String,
      enum: REPORT_CATEGORIES,
      required: true,
    },
    reason: {
      type: String,
      maxlength: [500, 'السبب طويل جداً'],
      default: '',
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'actioned', 'dismissed'],
      default: 'pending',
    },
    // ملاحظة الأدمن بعد المراجعة
    adminNote: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

reportSchema.statics.REPORT_CATEGORIES = REPORT_CATEGORIES;

module.exports = mongoose.model('Report', reportSchema);
