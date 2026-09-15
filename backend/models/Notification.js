const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // المستخدم يلي رح يستقبل الإشعار
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      enum: ['new_comment', 'new_star', 'report_update', 'verified_badge'],
      required: true,
    },
    // مفتاح رسالة الإشعار (يقابل مفتاح بقاموس utils/i18n.js) + متغيراته، بدل نص جاهز
    // مترجم مسبقاً - هيك رسالة الإشعار بتترجم بلغة المستلم *الحالية* وقت ما يشوفها
    // (getNotifications)، مو بلغة اللي سببها وقت إنشائها. الحقل القديم `message` بيضل
    // موجود اختيارياً للتوافق الخلفي مع أي إشعار قديم اتخزن قبل هاد التغيير.
    messageKey: {
      type: String,
    },
    messageParams: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
    message: {
      type: String,
    },
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
