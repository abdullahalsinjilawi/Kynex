const mongoose = require('mongoose');

const adminAuditLogSchema = new mongoose.Schema(
  {
    admin: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    action: {
      type: String,
      required: true, // مثلاً: 'ban_user', 'verify_user', 'hide_project', 'feature_project', 'update_report'
    },
    targetType: {
      type: String,
      enum: ['user', 'project', 'report'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    details: {
      type: mongoose.Schema.Types.Mixed, // أي بيانات إضافية (سبب الحظر، الحالة الجديدة...)
      default: {},
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AdminAuditLog', adminAuditLogSchema);
