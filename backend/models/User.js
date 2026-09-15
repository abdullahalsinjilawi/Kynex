const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'الاسم مطلوب'],
      trim: true,
      maxlength: [50, 'الاسم يجب ألا يتجاوز 50 حرف'],
    },
    email: {
      type: String,
      required: [true, 'الإيميل مطلوب'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'صيغة الإيميل غير صحيحة'],
    },
    password: {
      type: String,
      required: [true, 'كلمة السر مطلوبة'],
      minlength: [8, 'كلمة السر يجب أن تكون 8 أحرف على الأقل'],
      select: false, // ما يترجعش تلقائياً بالـ queries، لازم .select('+password') يدوياً
    },
    bio: {
      type: String,
      maxlength: [500, 'النبذة يجب ألا تتجاوز 500 حرف'],
      default: '',
    },
    socialLinks: {
      github: { type: String, default: '' },
      website: { type: String, default: '' },
      twitter: { type: String, default: '' },
    },
    avatarUrl: {
      type: String,
      default: '',
    },

    // --- التحقق من الإيميل (ألغينا خطوة كود OTP؛ الحساب مفعّل مباشرة عند التسجيل) ---
    isEmailVerified: {
      type: Boolean,
      default: true,
    },

    // --- توكن HuggingFace (مشفّر دائماً قبل التخزين، أنظر utils/encryption.js) ---
    huggingfaceToken: {
      type: String,
      select: false, // حساس جداً، ما يترجعش إلا لو طلبناه صراحة
      default: null,
    },

    // --- API key الخاص بالمستخدم للسماح بتنزيل ملفاته برمجياً ---
    apiKey: {
      type: String,
      unique: true,
      sparse: true, // يسمح بوجود مستخدمين بدون apiKey لسه (null) بدون تعارض unique
      select: false,
    },

    // --- شارة التحقق (يدوية من الأدمن فقط) ---
    verified: {
      type: Boolean,
      default: false,
    },

    // --- صلاحيات ---
    role: {
      type: String,
      enum: ['user', 'admin'],
      default: 'user',
    },

    // --- حظر الحساب (بعد بلاغات مثلاً) ---
    isBanned: {
      type: Boolean,
      default: false,
    },
    banReason: {
      type: String,
      default: '',
    },

    // --- آخر نشاط (يظهر بالبروفايل "متصل منذ...") ---
    lastActiveAt: {
      type: Date,
      default: Date.now,
    },

    // --- الموافقة على الشروط (checkbox إجباري وقت التسجيل) ---
    acceptedTermsAt: {
      type: Date,
      required: true,
    },

    // --- حماية من محاولات تخمين كلمة السر (brute-force) ---
    failedLoginAttempts: {
      type: Number,
      default: 0,
      select: false,
    },
    lockUntil: {
      type: Date,
      default: null,
      select: false,
    },

    // --- حذف مؤجل (soft delete) لمدة 30 يوم قبل الحذف النهائي ---
    deletedAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

// --- Hooks ---

// قبل ما نحفظ المستخدم، نشفّر كلمة السر لو كانت جديدة أو تغيّرت
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// --- Methods ---

// مقارنة كلمة السر المدخلة مع المشفّرة بقاعدة البيانات
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// توليد API key عشوائي جديد للمستخدم (يستخدم لتنزيل الملفات برمجياً)
userSchema.methods.generateApiKey = function () {
  const key = 'ak_' + crypto.randomBytes(24).toString('hex');
  this.apiKey = key;
  return key;
};

// هل الحساب مقفول حالياً بسبب محاولات دخول فاشلة متكررة؟
userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > Date.now());
};

// نسجّل محاولة فاشلة، ونقفل الحساب 15 دقيقة لو وصل 5 محاولات متتالية
userSchema.methods.registerFailedLogin = async function () {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.lockUntil = new Date(Date.now() + 15 * 60 * 1000);
    this.failedLoginAttempts = 0;
  }
  await this.save();
};

// نصفّر العداد عند نجاح تسجيل الدخول
userSchema.methods.resetFailedLogins = async function () {
  if (this.failedLoginAttempts > 0 || this.lockUntil) {
    this.failedLoginAttempts = 0;
    this.lockUntil = null;
    await this.save();
  }
};

module.exports = mongoose.model('User', userSchema);
