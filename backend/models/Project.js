const mongoose = require('mongoose');
const slugify = require('slugify');

// قائمة التراخيص الجاهزة يلي بتُعرض للمستخدم وقت الرفع
const PRESET_LICENSES = [
  'MIT',
  'Apache-2.0',
  'GPL-3.0',
  'BSD-3-Clause',
  'CC-BY-4.0',
  'CC-BY-SA-4.0',
  'Custom', // لو اختار يكتب ترخيص خاص فيه
];

const fileSchema = new mongoose.Schema(
  {
    filename: { type: String, required: true }, // اسم الملف بس (آخر جزء من المسار)، للعرض السريع
    // المسار الكامل للملف داخل المشروع (مثلاً "src/utils/helper.py")، بيحافظ على بنية
    // المجلدات لو المستخدم رفع مجلد كامل. لملف مفرد بدون مجلد، بيساوي filename بالضبط.
    // منظّف دائماً (أنظر utils/pathSanitize.js) قبل التخزين، حماية من path traversal.
    relativePath: { type: String, required: true },
    storageKey: { type: String, required: true }, // المسار الفعلي بـ R2/B2
    size: { type: Number, required: true }, // بالبايت
    mimeType: { type: String, default: '' },
  },
  { _id: true, timestamps: true }
);

const projectSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'اسم المشروع مطلوب'],
      trim: true,
      maxlength: [100, 'اسم المشروع طويل جداً'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'وصف المشروع مطلوب'],
      maxlength: [1000, 'الوصف طويل جداً'],
    },
    readme: {
      type: String,
      default: '',
    },

    // فئة المشروع (نوع المحتوى: كود تدريب، معمارية نموذج، داتا سيت، كود تنظيف بيانات...)
    category: {
      type: String,
      enum: ['training-code', 'model-architecture', 'dataset', 'data-cleaning', 'other'],
      required: true,
    },

    // لغة البرمجة الأساسية للمشروع (للبحث والفلترة)
    language: {
      type: String,
      required: true,
      trim: true,
    },

    tags: {
      type: [String],
      default: [],
    },

    license: {
      type: {
        type: String,
        enum: PRESET_LICENSES,
        required: true,
      },
      customText: {
        type: String, // يُستخدم فقط لو النوع Custom
        default: '',
      },
    },

    files: {
      type: [fileSchema],
      default: [],
    },
    totalSizeBytes: {
      type: Number,
      default: 0,
    },

    // نسخة احتياطية سابقة (7 أيام) قبل آخر تحديث، للحماية من غلطة رفع خاطئة
    previousBackup: {
      files: { type: [fileSchema], default: undefined },
      savedAt: { type: Date, default: undefined },
    },

    starsCount: {
      type: Number,
      default: 0,
    },
    downloadsCount: {
      type: Number,
      default: 0,
    },
    viewsCount: {
      type: Number,
      default: 0,
    },

    // تمييز يدوي من الإدارة بقسم الترند/المميز بالصفحة الرئيسية
    isFeatured: {
      type: Boolean,
      default: false,
    },

    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// نولّد الـ slug تلقائياً من اسم المشروع (مع رقم عشوائي بالنهاية لضمان التفرد)
projectSchema.pre('validate', function (next) {
  if (this.isModified('name') || !this.slug) {
    const base = slugify(this.name, { lower: true, strict: true });
    const uniqueSuffix = Math.random().toString(36).substring(2, 7);
    this.slug = `${base}-${uniqueSuffix}`;
  }
  next();
});

// فهرسة لتسريع البحث بالاسم والوسوم واللغة
// ⚠️ ملاحظة مهمة: MongoDB بتستخدم حقل اسمه "language" بشكل محجوز افتراضياً مع أي
// فهرس نصي (text index) لتحديد لغة تنقيح النص (stemming) لكل مستند. بما إنو عندنا
// حقل "language" خاص فينا (لغة البرمجة، زي "python")، لازم نعطّل هاد السلوك صراحة:
// - language_override: نحوّل الحقل يلي MongoDB بتدوّر عليه لاسم ما رح يتصادم مع أي
//   حقل فعلي عندنا، حتى ما تحاول تفسّر "python" كلغة تنقيح نصي
// - default_language: 'none' يعطّل التنقيح اللغوي بالكامل، وهاد أنسب أصلاً لمحتوى
//   مختلط عربي/إنجليزي (التنقيح المخصص للغة وحدة ما رح يشتغل صح على محتوى مختلط)
projectSchema.index(
  { name: 'text', tags: 'text' },
  { language_override: 'textIndexLanguageUnused', default_language: 'none' }
);
projectSchema.index({ language: 1 });
projectSchema.index({ category: 1 });

projectSchema.statics.PRESET_LICENSES = PRESET_LICENSES;

module.exports = mongoose.model('Project', projectSchema);
