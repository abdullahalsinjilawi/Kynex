const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const { t } = require('../utils/i18n');

// نرتّب الـ participants دايماً بنفس الترتيب (حسب الـ ID كنص) عشان القيد الفريد
// بالموديل يشتغل صح بغض النظر مين بدأ المحادثة (أ->ب لازم تساوي ب->أ)
const sortParticipants = (idA, idB) => [String(idA), String(idB)].sort();

// حساب حسابات محذوفة نهائياً بيسيب المحادثة موجودة (قصداً - حتى ما نمسح سجل المحادثة
// عند الطرف التاني)، لكن الـ populate بيرجع null لهاد الطرف. هاي دالة موحّدة تلاقي
// الطرف التاني بأمان وترجع بيانات "مستخدم محذوف" جاهزة للعرض لو صار هيك (مترجمة حسب lang)
function findOtherParticipant(participants, myId, lang) {
  const other = participants.find((p) => p && String(p._id) !== String(myId));
  if (other) return other;
  return { _id: null, name: t(lang, 'deletedUser'), avatarUrl: '', verified: false, deleted: true };
}

// @route  POST /api/messages/start
// @desc   بدء محادثة جديدة (أو المتابعة بمحادثة موجودة أصلاً) مع أول رسالة
const startConversation = async (req, res, next) => {
  try {
    const { recipientId, projectId, content } = req.body;

    if (!recipientId || !content?.trim()) {
      return res.status(400).json({ success: false, message: t(req.lang, 'recipientAndContentRequired') });
    }

    if (String(recipientId) === String(req.user._id)) {
      return res.status(400).json({ success: false, message: t(req.lang, 'cantMessageYourself') });
    }

    const recipient = await User.findById(recipientId);
    if (!recipient || recipient.deletedAt) {
      return res.status(404).json({ success: false, message: t(req.lang, 'userNotFound') });
    }

    const participants = sortParticipants(req.user._id, recipientId);

    // نلاقي محادثة موجودة أصلاً بين نفس الشخصين، أو ننشئ وحدة جديدة
    let conversation = await Conversation.findOne({ participants });
    if (!conversation) {
      conversation = await Conversation.create({
        participants,
        relatedProject: projectId || undefined,
      });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: content.trim(),
    });

    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessagePreview = content.trim().slice(0, 100);
    await conversation.save();

    res.status(201).json({ success: true, conversationId: conversation._id, message });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/messages/conversations
// @desc   قائمة محادثات المستخدم الحالي، الأحدث أولاً
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({ participants: req.user._id })
      .populate('participants', 'name avatarUrl verified')
      .populate('relatedProject', 'name slug')
      .sort({ lastMessageAt: -1 });

    // لكل محادثة، نحسب عدد الرسائل غير المقروءة (يلي مو منّي وموسومة unread)
    const withUnread = await Promise.all(
      conversations.map(async (conv) => {
        const unreadCount = await Message.countDocuments({
          conversation: conv._id,
          sender: { $ne: req.user._id },
          isRead: false,
        });
        const otherUser = findOtherParticipant(conv.participants, req.user._id, req.lang);
        return {
          _id: conv._id,
          otherUser,
          relatedProject: conv.relatedProject,
          lastMessageAt: conv.lastMessageAt,
          lastMessagePreview: conv.lastMessagePreview,
          unreadCount,
        };
      })
    );

    res.status(200).json({ success: true, conversations: withUnread });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/messages/conversations/:id
// @desc   رسائل محادثة معيّنة + تعليمها كمقروءة
const getConversationMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findById(req.params.id).populate(
      'participants',
      'name avatarUrl verified'
    );

    // ملاحظة: p ممكن تكون null لو الطرف التاني بالمحادثة اتحذف حسابه نهائياً (populate
    // بيرجع null للـ ref يلي ما عاد موجود) - لازم نتأكد p موجودة قبل ما نقرأ p._id
    if (!conversation || !conversation.participants.some((p) => p && String(p._id) === String(req.user._id))) {
      return res.status(404).json({ success: false, message: t(req.lang, 'conversationNotFound') });
    }

    const messages = await Message.find({ conversation: conversation._id }).sort({ createdAt: 1 });

    // نعلّم كل الرسائل يلي مو مني كمقروءة بمجرد ما أفتح المحادثة
    await Message.updateMany(
      { conversation: conversation._id, sender: { $ne: req.user._id }, isRead: false },
      { isRead: true }
    );

    const otherUser = findOtherParticipant(conversation.participants, req.user._id, req.lang);

    res.status(200).json({ success: true, messages, otherUser });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/messages/conversations/:id
// @desc   إرسال رسالة جديدة بمحادثة موجودة
const sendMessage = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) {
      return res.status(400).json({ success: false, message: t(req.lang, 'messageEmpty') });
    }

    const conversation = await Conversation.findById(req.params.id);
    if (!conversation || !conversation.participants.some((p) => String(p) === String(req.user._id))) {
      return res.status(404).json({ success: false, message: t(req.lang, 'conversationNotFound') });
    }

    const message = await Message.create({
      conversation: conversation._id,
      sender: req.user._id,
      content: content.trim(),
    });

    conversation.lastMessageAt = message.createdAt;
    conversation.lastMessagePreview = content.trim().slice(0, 100);
    await conversation.save();

    res.status(201).json({ success: true, message });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/messages/unread-count
// @desc   العدد الكلي للرسائل غير المقروءة (لشارة الهيدر)
const getUnreadCount = async (req, res, next) => {
  try {
    const myConversations = await Conversation.find({ participants: req.user._id }).select('_id');
    const conversationIds = myConversations.map((c) => c._id);

    const unreadCount = await Message.countDocuments({
      conversation: { $in: conversationIds },
      sender: { $ne: req.user._id },
      isRead: false,
    });

    res.status(200).json({ success: true, unreadCount });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  startConversation,
  getConversations,
  getConversationMessages,
  sendMessage,
  getUnreadCount,
};
