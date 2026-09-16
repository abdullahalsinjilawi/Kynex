const mongoose = require('mongoose');

const REACTION_TYPES = ['like', 'insightful', 'fire', 'celebrate', 'curious'];

// تفاعل واحد لكل مستخدم على كل هدف (منشور أو تعليق). لو تفاعل مرة تانية بنوع مختلف
// منحدّث النوع، ولو بنفس النوع منشيل التفاعل (toggle) - نفس سلوك المنصات المعروفة.
// الفهرس الفريد تحت هو اللي بيضمن هالشي على مستوى قاعدة البيانات، مش بس بالكود
const reactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetType: {
      type: String,
      enum: ['post', 'comment'],
      required: true,
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    type: {
      type: String,
      enum: REACTION_TYPES,
      default: 'like',
      required: true,
    },
  },
  { timestamps: true }
);

reactionSchema.index({ user: 1, targetType: 1, targetId: 1 }, { unique: true });
reactionSchema.index({ targetType: 1, targetId: 1 });

reactionSchema.statics.REACTION_TYPES = REACTION_TYPES;

module.exports = mongoose.model('Reaction', reactionSchema);
