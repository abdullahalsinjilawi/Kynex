const Post = require('../models/Post');
const PostComment = require('../models/PostComment');
const Notification = require('../models/Notification');
const { toggleReaction, getMyReactions, AUTHOR_FIELDS } = require('./postController');
const { t } = require('../utils/i18n');

const REACTION_TYPES = Post.REACTION_TYPES;

// بتجيب المنشور لو كان مرئي للطالب (نفس قواعد صفحة التفاصيل)
async function findVisiblePost(slug, user) {
  const post = await Post.findOne({ slug, isDeleted: false }).populate('author', 'isBanned deletedAt');
  if (!post) return null;

  const isAdmin = user?.role === 'admin';
  const isAuthor = user && String(post.author?._id) === String(user._id);
  const authorHidden = !post.author || post.author.isBanned || post.author.deletedAt;

  if ((post.isHidden || authorHidden) && !isAdmin && !isAuthor) return null;
  return post;
}

// @route  GET /api/posts/:slug/comments
// @desc   تعليقات منشور، مرتبة كشجرة من مستوى واحد (تعليق + ردوده)
const getPostComments = async (req, res, next) => {
  try {
    const post = await findVisiblePost(req.params.slug, req.user);
    if (!post) {
      return res.status(404).json({ success: false, message: t(req.lang, 'postNotFound') });
    }

    const comments = await PostComment.find({ post: post._id })
      .populate('user', AUTHOR_FIELDS)
      .sort({ createdAt: 1 })
      .lean();

    const myReactions = await getMyReactions(
      req.user?._id,
      'comment',
      comments.map((c) => c._id)
    );

    // نبني الشجرة بمرور واحد: الآباء بالترتيب الأصلي، وكل رد بينحط تحت أبوه.
    // الردود اليتيمة (أبوها انحذف نهائياً) بتتعامل كتعليقات مستقلة بدل ما تختفي
    const byId = new Map();
    const roots = [];

    comments.forEach((c) => {
      const node = {
        ...c,
        content: c.isDeleted ? '' : c.content,
        myReaction: myReactions[String(c._id)] || null,
        replies: [],
      };
      byId.set(String(c._id), node);
    });

    byId.forEach((node) => {
      const parentId = node.parent ? String(node.parent) : null;
      if (parentId && byId.has(parentId)) {
        byId.get(parentId).replies.push(node);
      } else {
        roots.push(node);
      }
    });

    res.status(200).json({ success: true, comments: roots, total: comments.length });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/posts/:slug/comments
// @desc   إضافة تعليق أو رد على تعليق
const addPostComment = async (req, res, next) => {
  try {
    const { content, parent } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: t(req.lang, 'commentContentRequired') });
    }

    const post = await findVisiblePost(req.params.slug, req.user);
    if (!post) {
      return res.status(404).json({ success: false, message: t(req.lang, 'postNotFound') });
    }

    let parentComment = null;
    if (parent) {
      parentComment = await PostComment.findById(parent);
      if (!parentComment || String(parentComment.post) !== String(post._id)) {
        return res.status(404).json({ success: false, message: t(req.lang, 'commentNotFound') });
      }
      // مستوى واحد بس: الرد على ردّ بينحسب رد على التعليق الأصلي
      if (parentComment.parent) {
        parentComment = await PostComment.findById(parentComment.parent);
      }
    }

    const comment = await PostComment.create({
      post: post._id,
      user: req.user._id,
      content: content.trim(),
      parent: parentComment ? parentComment._id : null,
    });

    await comment.populate('user', AUTHOR_FIELDS);
    await Post.findByIdAndUpdate(post._id, { $inc: { commentsCount: 1 } });

    // إشعار صاحب المنشور (إلا لو هو المعلّق)
    if (String(post.author._id) !== String(req.user._id)) {
      Notification.create({
        recipient: post.author._id,
        type: 'post_comment',
        messageKey: 'postCommentNotification',
        messageParams: { actor: req.user.name, post: post.title },
        relatedPost: post._id,
      }).catch(() => {});
    }

    // وإشعار صاحب التعليق الأصلي لو كان ردّ عليه (وما يكون هو نفسه ولا صاحب المنشور
    // حتى ما ياخد إشعارين على نفس الحدث)
    if (
      parentComment &&
      String(parentComment.user) !== String(req.user._id) &&
      String(parentComment.user) !== String(post.author._id)
    ) {
      Notification.create({
        recipient: parentComment.user,
        type: 'post_reply',
        messageKey: 'postReplyNotification',
        messageParams: { actor: req.user.name, post: post.title },
        relatedPost: post._id,
      }).catch(() => {});
    }

    res.status(201).json({ success: true, comment: { ...comment.toObject(), replies: [], myReaction: null } });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/posts/comments/:id
// @desc   تعديل تعليق (لصاحبه فقط)
const updatePostComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: t(req.lang, 'commentContentRequired') });
    }

    const comment = await PostComment.findById(req.params.id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: t(req.lang, 'commentNotFound') });
    }

    if (String(comment.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: t(req.lang, 'cantEditOthersComment') });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    await comment.save();
    await comment.populate('user', AUTHOR_FIELDS);

    res.status(200).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

// @route  DELETE /api/posts/comments/:id
// @desc   حذف تعليق (لصاحبه أو للأدمن) - حذف ناعم حتى تضل الردود عليه مفهومة
const deletePostComment = async (req, res, next) => {
  try {
    const comment = await PostComment.findById(req.params.id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: t(req.lang, 'commentNotFound') });
    }

    if (String(comment.user) !== String(req.user._id) && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: t(req.lang, 'cantDeleteOthersComment') });
    }

    comment.isDeleted = true;
    comment.content = '';
    await comment.save();

    await Post.findByIdAndUpdate(comment.post, { $inc: { commentsCount: -1 } });

    res.status(200).json({ success: true, message: t(req.lang, 'commentDeleted') });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/posts/comments/:id/react
// @desc   تفاعل على تعليق
const reactToPostComment = async (req, res, next) => {
  try {
    const { type = 'like' } = req.body;
    if (!REACTION_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: t(req.lang, 'unknownReactionType') });
    }

    const comment = await PostComment.findById(req.params.id);
    if (!comment || comment.isDeleted) {
      return res.status(404).json({ success: false, message: t(req.lang, 'commentNotFound') });
    }

    const { action, current } = await toggleReaction({
      user: req.user,
      targetType: 'comment',
      targetId: comment._id,
      type,
    });

    let delta = 0;
    if (action === 'added') delta = 1;
    if (action === 'removed') delta = -1;

    const updated = await PostComment.findByIdAndUpdate(
      comment._id,
      { $inc: { reactionsCount: delta } },
      { new: true }
    ).select('reactionsCount');

    res.status(200).json({
      success: true,
      myReaction: current,
      reactionsCount: updated.reactionsCount,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPostComments,
  addPostComment,
  updatePostComment,
  deletePostComment,
  reactToPostComment,
};
