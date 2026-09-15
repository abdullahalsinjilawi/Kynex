const Comment = require('../models/Comment');
const Notification = require('../models/Notification');
const { findVisibleProject } = require('./projectController');
const { t } = require('../utils/i18n');

// @route  GET /api/projects/:slug/comments
// @desc   عرض كل تعليقات مشروع معيّن
const getComments = async (req, res, next) => {
  try {
    const project = await findVisibleProject(req.params.slug, req.user);
    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    const comments = await Comment.find({ project: project._id })
      .populate('user', 'name avatarUrl verified')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, comments });
  } catch (error) {
    next(error);
  }
};

// @route  POST /api/projects/:slug/comments
// @desc   إضافة تعليق جديد على مشروع
const addComment = async (req, res, next) => {
  try {
    const { content } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({ success: false, message: t(req.lang, 'commentContentRequired') });
    }

    const project = await findVisibleProject(req.params.slug, req.user);
    if (!project) {
      return res.status(404).json({ success: false, message: t(req.lang, 'projectNotFound') });
    }

    const comment = await Comment.create({
      project: project._id,
      user: req.user._id,
      content: content.trim(),
    });

    await comment.populate('user', 'name avatarUrl verified');

    // نشعر صاحب المشروع بتعليق جديد (إلا لو هو نفسه يلي علّق على مشروعه)
    // ملاحظة: project.owner هون object كامل (populated عن طريق findVisibleProject)، مو ID خام
    if (String(project.owner._id) !== String(req.user._id)) {
      await Notification.create({
        recipient: project.owner._id,
        type: 'new_comment',
        messageKey: 'newCommentNotification',
        messageParams: { actor: req.user.name, project: project.name },
        relatedProject: project._id,
      });
    }

    res.status(201).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

// @route  PUT /api/comments/:id
// @desc   تعديل تعليق (لصاحبه فقط)
const updateComment = async (req, res, next) => {
  try {
    const { content } = req.body;
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({ success: false, message: t(req.lang, 'commentNotFound') });
    }

    if (String(comment.user) !== String(req.user._id)) {
      return res.status(403).json({ success: false, message: t(req.lang, 'cantEditOthersComment') });
    }

    comment.content = content.trim();
    comment.isEdited = true;
    await comment.save();

    res.status(200).json({ success: true, comment });
  } catch (error) {
    next(error);
  }
};

module.exports = { getComments, addComment, updateComment };
