const mongoose = require('mongoose');

// تعليقات المنتدى منفصلة عن تعليقات المشاريع (Comment) لأنها بتدعم ردود متداخلة
// وتفاعلات، وما بدنا نلخبط الاثنين بنفس الكوليكشن
const postCommentSchema = new mongoose.Schema(
  {
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: [true, 'محتوى التعليق مطلوب'],
      trim: true,
      maxlength: [2000, 'التعليق طويل جداً'],
    },
    // ردّ على تعليق تاني (مستوى واحد بس - ما منسمح بردود على ردود حتى ما تصير
    // الشجرة عميقة وغير مقروءة على الموبايل)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PostComment',
      default: null,
    },
    reactionsCount: { type: Number, default: 0 },
    isEdited: { type: Boolean, default: false },
    // حذف ناعم: منخلي التعليق مكانه بالشجرة (حتى ما تضيع الردود عليه) بس بمحتوى محذوف
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

postCommentSchema.index({ post: 1, createdAt: 1 });
postCommentSchema.index({ parent: 1 });

module.exports = mongoose.model('PostComment', postCommentSchema);
