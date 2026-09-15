const crypto = require('crypto');

// نستخدم خوارزمية AES-256-GCM لتشفير التوكنات الحساسة (زي توكن HuggingFace)
// GCM بتعطينا كمان "authentication tag" يتأكد إنو النص ما تلاعب فيه حدا

const ALGORITHM = 'aes-256-gcm';

// بناخد مفتاح التشفير من متغيرات البيئة (لازم يكون 32 بايت = 64 حرف hex)
const getKey = () => {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error(
      'ENCRYPTION_KEY غير موجود أو غير صحيح الطول. لازم يكون 64 حرف hex (32 بايت).'
    );
  }
  return Buffer.from(key, 'hex');
};

/**
 * تشفير نص عادي (زي توكن HuggingFace) قبل تخزينه بقاعدة البيانات
 * @param {string} plainText - النص المراد تشفيره
 * @returns {string} - نص مشفّر بصيغة "iv:authTag:encryptedData" (كل واحد hex)
 */
function encrypt(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(12); // IV عشوائي لكل عملية تشفير
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plainText, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  // بنخزن الثلاثة أجزاء مع بعض عشان نقدر نفك التشفير لاحقاً
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}

/**
 * فك تشفير نص مشفّر بواسطة encrypt()
 * @param {string} encryptedText - النص المشفّر بصيغة "iv:authTag:encryptedData"
 * @returns {string} - النص الأصلي
 */
function decrypt(encryptedText) {
  const key = getKey();
  const [ivHex, authTagHex, encryptedData] = encryptedText.split(':');

  if (!ivHex || !authTagHex || !encryptedData) {
    throw new Error('صيغة النص المشفّر غير صحيحة');
  }

  const decipher = crypto.createDecipheriv(
    ALGORITHM,
    key,
    Buffer.from(ivHex, 'hex')
  );
  decipher.setAuthTag(Buffer.from(authTagHex, 'hex'));

  let decrypted = decipher.update(encryptedData, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

module.exports = { encrypt, decrypt };
