const mongoose = require('mongoose');

const starSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: true,
    },
  },
  { timestamps: true }
);

// نمنع تكرار: نفس المستخدم ما يقدر يعمل star أكتر من مرة لنفس المشروع
starSchema.index({ user: 1, project: 1 }, { unique: true });

module.exports = mongoose.model('Star', starSchema);
