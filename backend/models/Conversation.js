const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema(
  {
    // دايماً مرتبة (sorted) حسب الـ ID عشان القيد الفريد تحت يشتغل صح بغض النظر
    // مين بدأ المحادثة - نفس فكرة LinkedIn، محادثة وحدة بين شخصين مهما بلّشوها من مشروع مين
    participants: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      required: true,
      validate: (arr) => arr.length === 2,
    },
    // أول مشروع كان السبب ببداية المحادثة (للسياق بس، مش قيد على المحادثة)
    relatedProject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
    },
    lastMessageAt: {
      type: Date,
      default: Date.now,
    },
    lastMessagePreview: {
      type: String,
      default: '',
    },
  },
  { timestamps: true }
);

// قيد فريد: محادثة وحدة بس بين نفس الشخصين (بما إنو participants مرتبة دايماً بنفس الترتيب)
conversationSchema.index({ participants: 1 }, { unique: true });

module.exports = mongoose.model('Conversation', conversationSchema);
