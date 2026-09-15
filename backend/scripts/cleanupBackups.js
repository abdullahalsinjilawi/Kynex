// سكربت مستقل، يُشغّل دورياً (cron) لحذف النسخ الاحتياطية يلي عدت عليها أكثر من 7 أيام
// مثال تشغيله يدوياً: node scripts/cleanupBackups.js
// مثال جدولته بـ cron على Linux/Mac (كل يوم الساعة 3 فجراً):
//   0 3 * * * cd /path/to/backend && node scripts/cleanupBackups.js >> logs/cleanup.log 2>&1

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');
const { deleteFile } = require('../utils/fileStorage');

const BACKUP_RETENTION_MS = 7 * 24 * 60 * 60 * 1000; // 7 أيام

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🧹 بدء تنظيف النسخ الاحتياطية القديمة...');

  const cutoffDate = new Date(Date.now() - BACKUP_RETENTION_MS);

  const projectsWithOldBackup = await Project.find({
    'previousBackup.savedAt': { $lte: cutoffDate },
  });

  let deletedCount = 0;

  for (const project of projectsWithOldBackup) {
    const files = project.previousBackup?.files || [];
    await Promise.all(files.map((f) => deleteFile(f.storageKey)));

    project.previousBackup = undefined;
    await project.save();
    deletedCount++;
  }

  console.log(`✅ تم تنظيف ${deletedCount} نسخة احتياطية قديمة`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ خطأ أثناء تنظيف النسخ الاحتياطية:', err);
  process.exit(1);
});
