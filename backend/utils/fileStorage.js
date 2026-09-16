const fs = require('fs');
const path = require('path');
const {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} = require('@aws-sdk/client-s3');

// لو إعدادات S3 (R2/B2) موجودة بالـ .env، نستخدمها. لو لأ، نخزن محلياً بمجلد temp_uploads
// هيك تقدر تطوّر وتختبر رفع/تنزيل الملفات محلياً بدون ما تحتاج حساب R2 فوراً
const hasS3Config =
  process.env.S3_ENDPOINT && process.env.S3_ACCESS_KEY_ID && process.env.S3_BUCKET_NAME;

const LOCAL_STORAGE_DIR = path.join(__dirname, '..', 'temp_uploads', 'storage');

let s3Client = null;
if (hasS3Config) {
  s3Client = new S3Client({
    endpoint: process.env.S3_ENDPOINT,
    region: process.env.S3_REGION || 'auto',
    credentials: {
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
    },
  });
} else {
  // نتأكد إنو مجلد التخزين المحلي موجود
  fs.mkdirSync(LOCAL_STORAGE_DIR, { recursive: true });
  console.log(
    '⚠️  ما فيه إعدادات S3 (R2/B2) بالـ .env — الملفات رح تُخزّن محلياً بمجلد temp_uploads/storage (وضع تطوير فقط، مش للإنتاج)'
  );

  // تحذير إضافي وأوضح لو هاد صاير بالإنتاج فعلياً (Render أو أي منصة مشابهة): القرص المحلي
  // مؤقت (ephemeral) - أي ملف اتخزن فيه بينمسح نهائياً مع أي redeploy أو إعادة تشغيل للسيرفر،
  // حتى لو الـ Project نفسه ضل موجود بقاعدة البيانات. النتيجة: تنزيل/معاينة ملفات مشاريع
  // مرفوعة قبل آخر redeploy بترجع "not found" رغم إنو المستخدم شافها شغالة قبل هيك
  if (process.env.NODE_ENV === 'production') {
    console.warn(
      '🔴 تحذير إنتاج: بيئة الإنتاج شغالة بدون S3 حقيقي! كل الملفات المرفوعة (مشاريع ' +
        'المستخدمين) رح تنمسح مع أي redeploy أو إعادة تشغيل، لأنو قرص Render مؤقت (ephemeral). ' +
        'لازم تعبّي S3_ENDPOINT / S3_ACCESS_KEY_ID / S3_SECRET_ACCESS_KEY / S3_BUCKET_NAME ' +
        'بمتغيرات البيئة بلوحة تحكم Render (Cloudflare R2 أو Backblaze B2 كافيين ومجانيين للبداية).'
    );
  }
}

/**
 * رفع ملف من مسار مؤقت على القرص إلى التخزين الدائم
 * @param {string} localFilePath - المسار المؤقت يلي حط فيه multer الملف
 * @param {string} storageKey - المفتاح/المسار يلي رح يُخزّن فيه الملف (مثلاً projects/xxx/file.zip)
 */
async function uploadFile(localFilePath, storageKey) {
  if (s3Client) {
    const fileStream = fs.createReadStream(localFilePath);
    await s3Client.send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET_NAME,
        Key: storageKey,
        Body: fileStream,
      })
    );
  } else {
    const destPath = path.join(LOCAL_STORAGE_DIR, storageKey.replace(/\//g, '__'));
    await fs.promises.copyFile(localFilePath, destPath);
  }
}

/**
 * إرجاع stream للقراءة من ملف مخزّن (نستخدمه عند بناء الـ ZIP للتنزيل)
 * @param {string} storageKey
 * @returns {Promise<ReadableStream|fs.ReadStream>}
 */
async function getFileStream(storageKey) {
  if (s3Client) {
    const response = await s3Client.send(
      new GetObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: storageKey })
    );
    return response.Body; // Readable stream
  } else {
    const filePath = path.join(LOCAL_STORAGE_DIR, storageKey.replace(/\//g, '__'));
    return fs.createReadStream(filePath);
  }
}

/**
 * حذف ملف من التخزين الدائم
 * @param {string} storageKey
 */
async function deleteFile(storageKey) {
  if (s3Client) {
    await s3Client.send(
      new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET_NAME, Key: storageKey })
    );
  } else {
    const filePath = path.join(LOCAL_STORAGE_DIR, storageKey.replace(/\//g, '__'));
    await fs.promises.unlink(filePath).catch(() => {}); // نتجاهل لو الملف مش موجود أصلاً
  }
}

module.exports = { uploadFile, getFileStream, deleteFile, isUsingLocalStorage: !hasS3Config };
