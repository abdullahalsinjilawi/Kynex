const User = require('../models/User');

// بترجع true لو صاحب الحساب لازم مشاريعه تختفي من العرض العام (محظور أو بفترة حذف مؤجل)
// نستخدمها بعد ما نكون already عملنا populate لحقلي isBanned/deletedAt على owner
function isOwnerHidden(owner) {
  if (!owner) return true; // ما فيه صاحب أصلاً (اتحذف نهائياً) - نعتبره مخفي
  return !!owner.isBanned || !!owner.deletedAt;
}

// بترجع مصفوفة IDs لكل المستخدمين المحظورين أو بفترة الحذف المؤجل حالياً
// نستخدمها بقوائم المشاريع العامة (getProjects, getFeaturedProjects) لاستثنائهم
// عن طريق $nin بدل ما نعمل populate + فلترة يدوية بعد الجلب (أبسط وأخف على قاعدة البيانات)
async function getHiddenOwnerIds() {
  const hidden = await User.find({
    $or: [{ isBanned: true }, { deletedAt: { $ne: null } }],
  }).select('_id');
  return hidden.map((u) => u._id);
}

module.exports = { isOwnerHidden, getHiddenOwnerIds };
