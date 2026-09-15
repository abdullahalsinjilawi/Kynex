const mongoose = require('mongoose');

// نتتبع آخر مرة تم فيها تنزيل مشروع معيّن عن طريق API من نفس الجهة (IP)
// عشان نطبّق قاعدة "مرة وحدة باليوم لكل شخص" المذكورة بالمواصفات
const apiDownloadLogSchema = new mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
    callerIp: {
      type: String,
      required: true,
    },
    lastDownloadAt: {
      type: Date,
      required: true,
    },
  },
  { timestamps: true }
);

apiDownloadLogSchema.index({ project: 1, callerIp: 1 }, { unique: true });

module.exports = mongoose.model('ApiDownloadLog', apiDownloadLogSchema);
