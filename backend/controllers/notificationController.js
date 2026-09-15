const Notification = require('../models/Notification');
const { t } = require('../utils/i18n');

// بيحوّل مصفوفة إشعارات خام (فيها messageKey+messageParams) لمصفوفة جاهزة للعرض
// فيها message مترجمة بلغة الطلب الحالي (req.lang). لو إشعار قديم ما عندو messageKey
// (اتخزن قبل نظام الترجمة)، منستخدم حقل message المخزّن القديم كـ fallback مباشرة
function localizeNotifications(notifications, lang) {
  return notifications.map((n) => {
    const obj = n.toObject();
    obj.message = obj.messageKey ? t(lang, obj.messageKey, obj.messageParams) : obj.message;
    return obj;
  });
}

// @route  GET /api/notifications
// @desc   إرجاع إشعارات المستخدم الحالي (الأحدث أولاً)
const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('relatedProject', 'slug name')
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });

    res.status(200).json({
      success: true,
      notifications: localizeNotifications(notifications, req.lang),
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/notifications/unread-count
// @desc   العدد بس (بدون جلب كل الإشعارات) - أخف بكتير للاستخدام بالـ polling الدوري بالهيدر
const getUnreadCount = async (req, res, next) => {
  try {
    const unreadCount = await Notification.countDocuments({
      recipient: req.user._id,
      isRead: false,
    });
    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/notifications/:id/read
// @desc   تعليم إشعار واحد كمقروء
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOne({
      _id: req.params.id,
      recipient: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: t(req.lang, 'notificationNotFound') });
    }

    notification.isRead = true;
    await notification.save();

    res.status(200).json({ success: true, notification: localizeNotifications([notification], req.lang)[0] });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/notifications/read-all
// @desc   تعليم كل الإشعارات كمقروءة دفعة وحدة
const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.status(200).json({ success: true, message: t(req.lang, 'allMarkedRead') });
  } catch (error) {
    next(error);
  }
};

module.exports = { getNotifications, markAsRead, markAllAsRead, getUnreadCount };
