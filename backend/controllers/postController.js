const mongoose = require('mongoose');
const Post = require('../models/Post');
const PostComment = require('../models/PostComment');
const Reaction = require('../models/Reaction');
const Notification = require('../models/Notification');
const { getHiddenOwnerIds } = require('../utils/visibility');
const { t } = require('../utils/i18n');

const POST_TYPES = Post.POST_TYPES;
const REACTION_TYPES = Post.REACTION_TYPES;

// الحقول اللي منرجعها عن كاتب المنشور - أبداً مش الوثيقة كاملة (فيها كلمة سر وتوكنات)
const AUTHOR_FIELDS = 'name avatarUrl verified role';

// الأساس اللي بينطبق على كل استعلام عام: بدون محذوف وبدون مخفي من الإدارة
const publicBase = { isDeleted: false, isHidden: false };

// بتبني شرط "مرئي للعموم" مع استثناء منشورات الحسابات المحظورة/بفترة الحذف المؤجل.
// نفس منطق المشاريع بالضبط، حتى يضل سلوك المنصة موحّد بين الأقسام
async function buildVisibleQuery(extra = {}) {
  const query = { ...publicBase, ...extra };
  if (!query.author) {
    const hiddenAuthorIds = await getHiddenOwnerIds();
    if (hiddenAuthorIds.length) query.author = { $nin: hiddenAuthorIds };
  }
  return query;
}

// بترجع خريطة { postId: reactionType } لتفاعلات المستخدم الحالي على مجموعة منشورات،
// بطلب واحد بس بدل طلب لكل منشور (منستخدمها بالقوائم وبصفحة التفاصيل)
async function getMyReactions(userId, targetType, ids) {
  if (!userId || !ids.length) return {};
  const reactions = await Reaction.find({
    user: userId,
    targetType,
    targetId: { $in: ids },
  }).select('targetId type');

  return reactions.reduce((acc, r) => {
    acc[String(r.targetId)] = r.type;
    return acc;
  }, {});
}

function normalizeTags(raw) {
  if (!raw) return [];
  const list = Array.isArray(raw) ? raw : String(raw).split(',');
  return [
    ...new Set(
      list
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean)
        .slice(0, 8)
    ),
  ];
}

// بنسمح فقط بروابط http/https كمصدر أو غلاف - حماية من javascript: وdata: URIs
function sanitizeUrl(raw) {
  if (!raw) return '';
  const value = String(raw).trim();
  if (!value) return '';
  if (!/^https?:\/\//i.test(value)) return '';
  return value.slice(0, 500);
}

// @route  GET /api/posts
// @desc   قائمة منشورات المنتدى مع بحث/فلترة/ترتيب وصفحات
const getPosts = async (req, res, next) => {
  try {
    const { search, type, tag, author, sort = 'newest', page = 1, limit = 12 } = req.query;

    const extra = {};
    if (type && POST_TYPES.includes(type)) extra.type = type;
    if (tag) extra.tags = tag.trim().toLowerCase();
    if (author && mongoose.isValidObjectId(author)) extra.author = author;
    if (search) extra.$text = { $search: search };

    const query = await buildVisibleQuery(extra);

    const sortOptions = {
      newest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      top: { reactionsCount: -1, createdAt: -1 },
      discussed: { commentsCount: -1, createdAt: -1 },
    };

    const pageNum = Math.max(1, Number(page) || 1);
    const limitNum = Math.min(50, Math.max(1, Number(limit) || 12));
    const skip = (pageNum - 1) * limitNum;

    // المنشورات المثبتة بتطلع فوق دايماً، بس بالترتيب الافتراضي (newest) وبأول صفحة -
    // غير هيك بتصير مزعجة وبتكسر منطق الترتيب اللي اختاره المستخدم
    const sortStage =
      sort === 'newest' ? { isPinned: -1, createdAt: -1 } : sortOptions[sort] || sortOptions.newest;

    const [posts, total] = await Promise.all([
      Post.find(query)
        .select('-content')
        .populate('author', AUTHOR_FIELDS)
        .sort(sortStage)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Post.countDocuments(query),
    ]);

    const myReactions = await getMyReactions(
      req.user?._id,
      'post',
      posts.map((p) => p._id)
    );

    res.status(200).json({
      success: true,
      posts: posts.map((p) => ({ ...p, myReaction: myReactions[String(p._id)] || null })),
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/posts/highlights
// @desc   مختارات المنتدى للصفحة الرئيسية (آخر الأخبار + الأكثر تفاعلاً)
const getHighlights = async (req, res, next) => {
  try {
    const query = await buildVisibleQuery();

    const [latest, top] = await Promise.all([
      Post.find(query)
        .select('-content')
        .populate('author', AUTHOR_FIELDS)
        .sort({ isPinned: -1, createdAt: -1 })
        .limit(4)
        .lean(),
      Post.find({ ...query, createdAt: { $gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) } })
        .select('-content')
        .populate('author', AUTHOR_FIELDS)
        .sort({ reactionsCount: -1, commentsCount: -1 })
        .limit(3)
        .lean(),
    ]);

    res.status(200).json({ success: true, latest, top });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/posts/tags
// @desc   أكثر الوسوم استخداماً بالمنتدى (لشريط الاستكشاف)
const getPopularTags = async (req, res, next) => {
  try {
    const query = await buildVisibleQuery();

    const tags = await Post.aggregate([
      { $match: query },
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 16 },
    ]);

    res.status(200).json({ success: true, tags: tags.map((tag) => ({ tag: tag._id, count: tag.count })) });
  } catch (error) {
    next(error);
  }
};

// @route  GET /api/posts/:slug
// @desc   تفاصيل منشور واحد (+ تسجيل مشاهدة)
const getPost = async (req, res, next) => {
  try {
    const post = await Post.findOne({ slug: req.params.slug, isDeleted: false }).populate(
      'author',
      `${AUTHOR_FIELDS} bio isBanned deletedAt`
    );

    if (!post) {
      return res.status(404).json({ success: false, message: t(req.lang, 'postNotFound') });
    }

    const isAdmin = req.user?.role === 'admin';
    const isAuthor = req.user && String(post.author?._id) === String(req.user._id);
    const authorHidden = !post.author || post.author.isBanned || post.author.deletedAt;

    // المخفي من الإدارة أو تبع حساب محظور: بيشوفه صاحبه والأدمن بس
    if ((post.isHidden || authorHidden) && !isAdmin && !isAuthor) {
      return res.status(404).json({ success: false, message: t(req.lang, 'postNotFound') });
    }

    // ما منعد مشاهدات صاحب المنشور لحاله (رقم مضلل)
    if (!isAuthor) {
      Post.findByIdAndUpdate(post._id, { $inc: { viewsCount: 1 } }).catch(() => {});
    }

    const myReactions = await getMyReactions(req.user?._id, 'post', [post._id]);

    const result = post.toObject();
    delete result.author.isBanned;
    delete result.author.deletedAt;

    res.status(200).json({
      success: true,
      post: { ...result, myReaction: myReactions[String(post._id)] || null },
    });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/posts
// @desc   نشر خبر / مقال / بحث / قصة / نقاش
const createPost = async (req, res, next) => {
  try {
    const { title, content, type, excerpt, tags, sourceUrl, coverUrl } = req.body;

    if (!title?.trim() || !content?.trim()) {
      return res.status(400).json({ success: false, message: t(req.lang, 'postFieldsRequired') });
    }

    if (type && !POST_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: t(req.lang, 'unknownPostType') });
    }

    const post = await Post.create({
      author: req.user._id,
      title: title.trim(),
      content: content.trim(),
      type: type || 'discussion',
      excerpt: excerpt?.trim().slice(0, 320) || '',
      tags: normalizeTags(tags),
      sourceUrl: sanitizeUrl(sourceUrl),
      coverUrl: sanitizeUrl(coverUrl),
    });

    await post.populate('author', AUTHOR_FIELDS);

    res.status(201).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/posts/:id
// @desc   تعديل منشور (لصاحبه أو للأدمن)
const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: t(req.lang, 'postNotFound') });
    }

    const isAdmin = req.user.role === 'admin';
    if (String(post.author) !== String(req.user._id) && !isAdmin) {
      return res.status(403).json({ success: false, message: t(req.lang, 'notYourPost') });
    }

    const { title, content, type, excerpt, tags, sourceUrl, coverUrl } = req.body;

    if (title?.trim()) post.title = title.trim();
    if (content?.trim()) post.content = content.trim();
    if (type) {
      if (!POST_TYPES.includes(type)) {
        return res.status(400).json({ success: false, message: t(req.lang, 'unknownPostType') });
      }
      post.type = type;
    }
    if (excerpt !== undefined) post.excerpt = String(excerpt).trim().slice(0, 320);
    if (tags !== undefined) post.tags = normalizeTags(tags);
    if (sourceUrl !== undefined) post.sourceUrl = sanitizeUrl(sourceUrl);
    if (coverUrl !== undefined) post.coverUrl = sanitizeUrl(coverUrl);

    post.isEdited = true;
    await post.save();
    await post.populate('author', AUTHOR_FIELDS);

    res.status(200).json({ success: true, post });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/posts/:id
// @desc   حذف منشور (حذف ناعم، لصاحبه أو للأدمن)
const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: t(req.lang, 'postNotFound') });
    }

    if (String(post.author) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: t(req.lang, 'notYourPost') });
    }

    post.isDeleted = true;
    await post.save();

    res.status(200).json({ success: true, message: t(req.lang, 'postDeleted') });
  } catch (error) {
    next(error);
  }
};

// دالة مشتركة للتفاعل على منشور أو تعليق: نفس النوع = إلغاء، نوع تاني = تبديل
async function toggleReaction({ user, targetType, targetId, type }) {
  const existing = await Reaction.findOne({ user: user._id, targetType, targetId });

  if (existing && existing.type === type) {
    await existing.deleteOne();
    return { action: 'removed', previous: type, current: null };
  }

  if (existing) {
    const previous = existing.type;
    existing.type = type;
    await existing.save();
    return { action: 'switched', previous, current: type };
  }

  await Reaction.create({ user: user._id, targetType, targetId, type });
  return { action: 'added', previous: null, current: type };
}

// @route  POST /api/posts/:id/react
// @desc   تفاعل على منشور (like / insightful / fire / celebrate / curious)
const reactToPost = async (req, res, next) => {
  try {
    const { type = 'like' } = req.body;
    if (!REACTION_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: t(req.lang, 'unknownReactionType') });
    }

    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted || post.isHidden) {
      return res.status(404).json({ success: false, message: t(req.lang, 'postNotFound') });
    }

    const { action, previous, current } = await toggleReaction({
      user: req.user,
      targetType: 'post',
      targetId: post._id,
      type,
    });

    // نحدّث العدادات بـ $inc ذرّي بدل قراءة-تعديل-حفظ، حتى ما تضيع تفاعلات متزامنة
    const inc = {};
    if (previous) inc[`reactionBreakdown.${previous}`] = -1;
    if (current) inc[`reactionBreakdown.${current}`] = 1;
    if (action === 'added') inc.reactionsCount = 1;
    if (action === 'removed') inc.reactionsCount = -1;

    const updated = await Post.findByIdAndUpdate(post._id, { $inc: inc }, { new: true }).select(
      'reactionsCount reactionBreakdown'
    );

    // إشعار لصاحب المنشور عند أول تفاعل جديد بس (مش عند كل تبديل نوع، ولا لتفاعل الشخص على نفسه)
    if (action === 'added' && String(post.author) !== String(req.user._id)) {
      Notification.create({
        recipient: post.author,
        type: 'post_reaction',
        messageKey: 'postReactionNotification',
        messageParams: { actor: req.user.name, post: post.title },
        relatedPost: post._id,
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      myReaction: current,
      reactionsCount: updated.reactionsCount,
      reactionBreakdown: updated.reactionBreakdown,
    });
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/posts/:id/pin   (أدمن)
const togglePin = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: t(req.lang, 'postNotFound') });
    }
    post.isPinned = !post.isPinned;
    await post.save();
    res.status(200).json({ success: true, isPinned: post.isPinned });
  } catch (error) {
    next(error);
  }
};

// @route  PATCH /api/posts/:id/hide   (أدمن)
const toggleHide = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post || post.isDeleted) {
      return res.status(404).json({ success: false, message: t(req.lang, 'postNotFound') });
    }
    post.isHidden = !post.isHidden;
    await post.save();
    res.status(200).json({
      success: true,
      isHidden: post.isHidden,
      message: t(req.lang, post.isHidden ? 'postHidden' : 'postShown'),
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  getHighlights,
  getPopularTags,
  getPost,
  createPost,
  updatePost,
  deletePost,
  reactToPost,
  togglePin,
  toggleHide,
  // مُصدّرة حتى يستخدمها postCommentController بدون تكرار منطق
  toggleReaction,
  getMyReactions,
  AUTHOR_FIELDS,
};
