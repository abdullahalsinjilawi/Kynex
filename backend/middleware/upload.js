const multer = require('multer');
const fs = require('fs');
const path = require('path');

const TEMP_DIR = path.join(__dirname, '..', 'temp_uploads', 'incoming');
fs.mkdirSync(TEMP_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, TEMP_DIR),
  filename: (req, file, cb) => {
    // نضيف timestamp عشوائي عشان ما يصير تعارض أسماء لو رفع حدا ملفين بنفس الاسم بنفس اللحظة
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`;
    cb(null, uniqueName);
  },
});

const MAX_FILE_SIZE = Number(process.env.MAX_FILE_SIZE_BYTES) || 2 * 1024 * 1024 * 1024; // 2GB افتراضي

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 200, // سقف عملي لعدد الملفات بالطلب الواحد (المشروع الموديولر بيقدر يستخدم مجلدات كتير)
  },
});

module.exports = upload;
