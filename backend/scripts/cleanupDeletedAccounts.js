// سكربت مستقل، يُشغّل دورياً (cron) لحذف الحسابات نهائياً بعد مرور 30 يوم على طلب الحذف
// مثال تشغيله يدوياً: node scripts/cleanupDeletedAccounts.js
// مثال جدولته بـ cron (كل يوم الساعة 4 فجراً):
//   0 4 * * * cd /path/to/backend && node scripts/cleanupDeletedAccounts.js >> logs/cleanup.log 2>&1
//
// ملاحظة تصميمية: لما نحذف حساب نهائياً، منحذف معه مشاريعه بالكامل (ملفاتها من التخزين +
// تعليقاتها + نجومها)، لأنو فلسفة الموقع إنو كل مشروع مرتبط بحساب واحد بدون تعدد ملاك.
// أما التعليقات يلي كتبها هاد المستخدم على مشاريع ناس تانيين، منسيبها موجودة (زي "مستخدم محذوف")
// حتى ما نكسر سياق النقاش على مشاريع الآخرين.

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');
const Project = require('../models/Project');
const Star = require('../models/Star');
const Notification = require('../models/Notification');
const { deleteFile } = require('../utils/fileStorage');

const RETENTION_MS = 30 * 24 * 60 * 60 * 1000; // 30 يوم

async function run() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('🧹 بدء حذف الحسابات المنتهية مدة الاحتفاظ بها...');

  const cutoffDate = new Date(Date.now() - RETENTION_MS);

  const usersToDelete = await User.find({
    deletedAt: { $ne: null, $lte: cutoffDate },
  });

  for (const user of usersToDelete) {
    // 1) حذف كل مشاريع هاد المستخدم بالكامل (ملفات + نسخ احتياطية)
    const projects = await Project.find({ owner: user._id });

    for (const project of projects) {
      await Promise.all(project.files.map((f) => deleteFile(f.storageKey)));
      if (project.previousBackup?.files?.length) {
        await Promise.all(project.previousBackup.files.map((f) => deleteFile(f.storageKey)));
      }
      await Star.deleteMany({ project: project._id });
      await project.deleteOne();
    }

    // 2) حذف النجوم يلي عملها هاد المستخدم على مشاريع تانية (مع تعديل عدادها)
    const userStars = await Star.find({ user: user._id });
    for (const star of userStars) {
      await Project.findByIdAndUpdate(star.project, { $inc: { starsCount: -1 } });
      await star.deleteOne();
    }

    // 3) حذف إشعاراته
    await Notification.deleteMany({ recipient: user._id });

    // 4) حذف الحساب نفسه نهائياً
    await user.deleteOne();

    console.log(`✅ تم حذف حساب ${user.email} نهائياً (${projects.length} مشروع معه)`);
  }

  console.log(`🏁 انتهى. تم حذف ${usersToDelete.length} حساب نهائياً`);
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error('❌ خطأ أثناء حذف الحسابات:', err);
  process.exit(1);
});
