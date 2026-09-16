const mongoose = require('mongoose');
const slugify = require('slugify');

// أنواع المنشورات بالمنتدى - كل نوع إله لون وأيقونة بالواجهة، والفلترة بتصير عليه
const POST_TYPES = [
  'news', // خبر ذكاء اصطناعي
  'article', // مقال / شرح
  'research', // ورقة بحثية أو تلخيص بحث
  'story', // قصة / تجربة شخصية
  'discussion', // نقاش مفتوح / سؤال
];

// أنواع التفاعلات المتاحة على المنشور (واحد لكل مستخدم، بيقدر يغيّره)
const REACTION_TYPES = ['like', 'insightful', 'fire', 'celebrate', 'curious'];

const postSchema = new mongoose.Schema(
  {
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: [true, 'عنوان المنشور مطلوب'],
      trim: true,
      maxlength: [180, 'العنوان طويل جداً'],
    },
    slug: {
      type: String,
      unique: true,
      index: true,
    },
    // نص المنشور بصيغة Markdown (نفس محرّك العرض المستخدم بالـ README تبع المشاريع)
    content: {
      type: String,
      required: [true, 'محتوى المنشور مطلوب'],
      maxlength: [50000, 'المحتوى طويل جداً'],
    },
    // مقتطف قصير للعرض بالبطاقات. بينولد تلقائياً من المحتوى لو المستخدم ما كتبه
    excerpt: {
      type: String,
      default: '',
      maxlength: [320, 'المقتطف طويل جداً'],
    },
    type: {
      type: String,
      enum: POST_TYPES,
      default: 'discussion',
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    // رابط المصدر الأصلي (مهم للأخبار والأبحاث - شفافية وعدم انتحال)
    sourceUrl: {
      type: String,
      default: '',
      trim: true,
    },
    // صورة غلاف اختيارية (رابط خارجي، ما منستضيف صور منشورات حالياً)
    coverUrl: {
      type: String,
      default: '',
      trim: true,
    },

    // وقت القراءة التقريبي بالدقايق، بينحسب وقت الحفظ من عدد الكلمات
    readingMinutes: {
      type: Number,
      default: 1,
    },

    viewsCount: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    reactionsCount: { type: Number, default: 0 },

    // عدّاد منفصل لكل نوع تفاعل، حتى نعرض الأرقام بدون ما نعمل aggregation كل مرة
    reactionBreakdown: {
      like: { type: Number, default: 0 },
      insightful: { type: Number, default: 0 },
      fire: { type: Number, default: 0 },
      celebrate: { type: Number, default: 0 },
      curious: { type: Number, default: 0 },
    },

    // تثبيت من الإدارة (بيطلع بأول المنتدى)
    isPinned: { type: Boolean, default: false },
    // إخفاء من الإدارة (بيضل موجود بقاعدة البيانات بس ما بينعرض)
    isHidden: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },

    isEdited: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// slug تلقائي من العنوان + لاحقة عشوائية لضمان التفرد.
// slugify مع strict بتشيل الحروف غير اللاتينية، فالعناوين العربية بترجع slug فاضي -
// بهاي الحالة منستخدم بادئة ثابتة حتى يضل الرابط شغال ومقروء
postSchema.pre('validate', function (next) {
  if (this.isModified('title') || !this.slug) {
    const base = slugify(this.title, { lower: true, strict: true }) || 'post';
    const uniqueSuffix = Math.random().toString(36).substring(2, 8);
    this.slug = `${base}-${uniqueSuffix}`;
  }

  // مقتطف تلقائي: أول 200 حرف من المحتوى بعد تنظيف أبسط رموز Markdown
  if (!this.excerpt && this.content) {
    const plain = this.content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
      .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
      .replace(/[#>*_`~|-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    this.excerpt = plain.slice(0, 200);
  }

  // وقت قراءة تقريبي: 200 كلمة بالدقيقة، بحد أدنى دقيقة وحدة
  if (this.isModified('content')) {
    const words = this.content.trim().split(/\s+/).filter(Boolean).length;
    this.readingMinutes = Math.max(1, Math.round(words / 200));
  }

  next();
});

// نفس ملاحظة فهرس المشاريع: نعطّل تفسير حقل language المحجوز عند MongoDB
// (ما عنا حقل language هون، بس منوحّد الإعدادات ومنعطّل الـ stemming لأنو المحتوى
// مختلط عربي/إنجليزي والتنقيح المخصص للغة وحدة بيضر أكتر ما بيفيد)
postSchema.index(
  { title: 'text', excerpt: 'text', tags: 'text' },
  { language_override: 'textIndexLanguageUnused', default_language: 'none' }
);
postSchema.index({ type: 1, createdAt: -1 });
postSchema.index({ isDeleted: 1, isHidden: 1, createdAt: -1 });
postSchema.index({ author: 1, createdAt: -1 });

postSchema.statics.POST_TYPES = POST_TYPES;
postSchema.statics.REACTION_TYPES = REACTION_TYPES;

module.exports = mongoose.model('Post', postSchema);
