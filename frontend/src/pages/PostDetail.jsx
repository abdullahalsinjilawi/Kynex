import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import MarkdownView from '../components/MarkdownView';
import ReactionBar from '../components/ReactionBar';
import Avatar, { VerifiedMark } from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import ReportModal from '../components/ReportModal';
import Spinner from '../components/Spinner';
import PostCard from '../components/PostCard';
import { postTypeOf } from '../utils/postMeta';
import { formatNumber } from '../utils/formatNumber';
import { formatRelativeTime } from '../utils/format';

function ExternalIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M14 4h6v6" />
      <path d="M20 4 11 13" />
      <path d="M18 14v5a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 4 19V8a1.5 1.5 0 0 1 1.5-1.5H10" />
    </svg>
  );
}

/** تعليق واحد + ردوده (مستوى واحد فقط — نفس ما بيرجعه الباك اند). */
function CommentNode({ comment, depth = 0, currentUser, onReply, onReact, onEdit, onDelete }) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(comment.content);
  const [replying, setReplying] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [busy, setBusy] = useState(false);

  const authorId = comment.user?._id || comment.user?.id;
  const isMine = currentUser && String(authorId) === String(currentUser._id || currentUser.id);
  const canDelete = isMine || currentUser?.role === 'admin';

  const submitEdit = async () => {
    if (!draft.trim()) return;
    setBusy(true);
    await onEdit(comment._id, draft.trim());
    setBusy(false);
    setEditing(false);
  };

  const submitReply = async () => {
    if (!replyText.trim()) return;
    setBusy(true);
    await onReply(replyText.trim(), comment._id);
    setBusy(false);
    setReplyText('');
    setReplying(false);
  };

  return (
    <li className={depth > 0 ? 'ms-4 border-s border-line-soft ps-4 sm:ms-6 sm:ps-5' : ''}>
      <div className="flex gap-3 py-4">
        <Link to={`/profile/${authorId}`} className="shrink-0">
          <Avatar name={comment.user?.name} id={authorId} size="md" />
        </Link>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            <Link to={`/profile/${authorId}`} className="font-medium transition-colors hover:text-brand-light">
              {comment.user?.name}
            </Link>
            {comment.user?.verified && <VerifiedMark className="h-3.5 w-3.5" title={t('common.verified')} />}
            <span className="text-xs text-muted">{formatRelativeTime(comment.createdAt)}</span>
            {comment.isEdited && !comment.isDeleted && (
              <span className="text-xs text-muted">· {t('forum.edited')}</span>
            )}
          </div>

          {comment.isDeleted ? (
            <p className="mt-1.5 text-sm italic text-muted">{t('forum.commentDeleted')}</p>
          ) : editing ? (
            <div className="mt-2 flex flex-col gap-2">
              <textarea
                dir="auto"
                rows={3}
                value={draft}
                maxLength={2000}
                onChange={(e) => setDraft(e.target.value)}
                className="input"
              />
              <div className="flex gap-2">
                <button type="button" onClick={submitEdit} disabled={busy} className="btn btn-primary btn-sm">
                  {t('common.save')}
                </button>
                <button type="button" onClick={() => setEditing(false)} className="btn btn-ghost btn-sm">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          ) : (
            <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed" dir="auto">
              {comment.content}
            </p>
          )}

          {!comment.isDeleted && !editing && (
            <div className="mt-2.5 flex flex-wrap items-center gap-2">
              <ReactionBar
                compact
                size="sm"
                myReaction={comment.myReaction}
                count={comment.reactionsCount || 0}
                disabled={!currentUser}
                onReact={(type) => onReact(comment._id, type)}
              />

              {currentUser && depth === 0 && (
                <button
                  type="button"
                  onClick={() => setReplying((v) => !v)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-fg"
                >
                  {t('forum.reply')}
                </button>
              )}

              {isMine && (
                <button
                  type="button"
                  onClick={() => {
                    setDraft(comment.content);
                    setEditing(true);
                  }}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-fg"
                >
                  {t('common.edit')}
                </button>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => onDelete(comment._id)}
                  className="rounded-lg px-2 py-1 text-xs font-medium text-muted transition-colors hover:text-danger"
                >
                  {t('common.delete')}
                </button>
              )}
            </div>
          )}

          {replying && (
            <div className="mt-3 flex flex-col gap-2">
              <textarea
                dir="auto"
                rows={3}
                value={replyText}
                maxLength={2000}
                onChange={(e) => setReplyText(e.target.value)}
                placeholder={t('forum.replyPlaceholder')}
                className="input"
              />
              <div className="flex gap-2">
                <button type="button" onClick={submitReply} disabled={busy || !replyText.trim()} className="btn btn-primary btn-sm">
                  {t('forum.sendReply')}
                </button>
                <button type="button" onClick={() => setReplying(false)} className="btn btn-ghost btn-sm">
                  {t('common.cancel')}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {comment.replies?.length > 0 && (
        <ul className="border-t border-line-soft">
          {comment.replies.map((reply) => (
            <CommentNode
              key={reply._id}
              comment={reply}
              depth={depth + 1}
              currentUser={currentUser}
              onReply={onReply}
              onReact={onReact}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export default function PostDetail() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [commentsTotal, setCommentsTotal] = useState(0);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [sending, setSending] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);

  const loadComments = useCallback(() => {
    apiClient
      .get(`/posts/${slug}/comments`)
      .then((res) => {
        setComments(res.data.comments || []);
        setCommentsTotal(res.data.total || 0);
      })
      .catch(() => {});
  }, [slug]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotFound(false);

    apiClient
      .get(`/posts/${slug}`)
      .then((res) => {
        if (cancelled) return;
        setPost(res.data.post);
        // منشورات قريبة: نفس النوع، بدون المنشور الحالي
        apiClient
          .get('/posts', { params: { type: res.data.post.type, limit: 4 } })
          .then((r) => {
            if (cancelled) return;
            setRelated((r.data.posts || []).filter((p) => p.slug !== slug).slice(0, 3));
          })
          .catch(() => {});
      })
      .catch(() => !cancelled && setNotFound(true))
      .finally(() => !cancelled && setLoading(false));

    loadComments();
    return () => {
      cancelled = true;
    };
  }, [slug, loadComments]);

  // تفاعل على المنشور — تحديث متفائل مع رجوع للحالة السابقة لو فشل الطلب
  const reactToPost = async (type) => {
    if (!post || !user) return;
    const snapshot = post;

    setPost((prev) => {
      const removing = prev.myReaction === type;
      const switching = prev.myReaction && prev.myReaction !== type;
      const breakdown = { ...(prev.reactionBreakdown || {}) };
      if (prev.myReaction) breakdown[prev.myReaction] = Math.max(0, (breakdown[prev.myReaction] || 0) - 1);
      if (!removing) breakdown[type] = (breakdown[type] || 0) + 1;

      return {
        ...prev,
        myReaction: removing ? null : type,
        reactionBreakdown: breakdown,
        reactionsCount: Math.max(0, (prev.reactionsCount || 0) + (removing ? -1 : switching ? 0 : 1)),
      };
    });

    try {
      const res = await apiClient.post(`/posts/${post._id}/react`, { type });
      setPost((prev) => ({
        ...prev,
        myReaction: res.data.myReaction,
        reactionsCount: res.data.reactionsCount,
        reactionBreakdown: res.data.reactionBreakdown,
      }));
    } catch {
      setPost(snapshot);
    }
  };

  const reactToComment = async (commentId, type) => {
    try {
      const res = await apiClient.post(`/posts/comments/${commentId}/react`, { type });
      const apply = (list) =>
        list.map((c) => ({
          ...c,
          ...(c._id === commentId
            ? { myReaction: res.data.myReaction, reactionsCount: res.data.reactionsCount }
            : {}),
          replies: c.replies ? apply(c.replies) : [],
        }));
      setComments((prev) => apply(prev));
    } catch {
      /* نتجاهل — الحالة الحالية بتضل صحيحة */
    }
  };

  const addComment = async (content, parent = null) => {
    try {
      await apiClient.post(`/posts/${slug}/comments`, { content, parent });
      loadComments();
      setPost((prev) => (prev ? { ...prev, commentsCount: (prev.commentsCount || 0) + 1 } : prev));
    } catch {
      /* رسالة الخطأ بتظهر من السيرفر بالحالات المهمة (حد معدّل/حساب موقوف) */
    }
  };

  const editComment = async (commentId, content) => {
    try {
      await apiClient.put(`/posts/comments/${commentId}`, { content });
      loadComments();
    } catch {
      /* تجاهل */
    }
  };

  const deleteComment = async (commentId) => {
    if (!window.confirm(t('forum.confirmDeleteComment'))) return;
    try {
      await apiClient.delete(`/posts/comments/${commentId}`);
      loadComments();
      setPost((prev) => (prev ? { ...prev, commentsCount: Math.max(0, (prev.commentsCount || 0) - 1) } : prev));
    } catch {
      /* تجاهل */
    }
  };

  const deletePost = async () => {
    if (!window.confirm(t('forum.confirmDeletePost'))) return;
    try {
      await apiClient.delete(`/posts/${post._id}`);
      navigate('/forum');
    } catch {
      /* تجاهل */
    }
  };

  const submitComment = async (event) => {
    event.preventDefault();
    if (!newComment.trim()) return;
    setSending(true);
    await addComment(newComment.trim());
    setNewComment('');
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20">
        <EmptyState
          icon="search"
          title={t('forum.postNotFound')}
          description={t('forum.postNotFoundHint')}
          action={{ to: '/forum', label: t('forum.backToForum') }}
        />
      </div>
    );
  }

  const type = postTypeOf(post.type);
  const authorId = post.author?._id || post.author?.id;
  const isAuthor = user && String(authorId) === String(user._id || user.id);
  const canManage = isAuthor || user?.role === 'admin';

  return (
    <article>
      {/* ترويسة المنشور على خلفية خفيفة — بتفصل "هوية المنشور" عن نصّه */}
      <header className="border-b border-line bg-surface/40">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <nav className="mb-5 flex items-center gap-1.5 text-sm text-muted" aria-label="breadcrumb">
            <Link to="/forum" className="transition-colors hover:text-fg">
              {t('forum.title')}
            </Link>
            <span aria-hidden="true">/</span>
            <span className="truncate">{t(type.labelKey)}</span>
          </nav>

          <div className="flex flex-wrap items-center gap-2">
            <span className={`badge gap-1.5 border ${type.chip}`}>
              <type.Icon className="h-3.5 w-3.5" aria-hidden="true" />
              {t(type.labelKey)}
            </span>
            {post.isPinned && <span className="badge badge-brand">{t('forum.pinned')}</span>}
            {post.isHidden && <span className="badge badge-danger">{t('forum.hiddenByAdmin')}</span>}
          </div>

          <h1 className="mt-4 font-display text-2xl font-bold leading-tight tracking-tight sm:text-4xl" dir="auto">
            {post.title}
          </h1>

          <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
            <Link to={`/profile/${authorId}`} className="flex items-center gap-2 transition-colors hover:text-fg">
              <Avatar name={post.author?.name} id={authorId} size="sm" />
              <span className="font-medium text-fg">{post.author?.name}</span>
              {post.author?.verified && <VerifiedMark className="h-3.5 w-3.5" title={t('common.verified')} />}
            </Link>
            <span aria-hidden="true">·</span>
            <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
            <span aria-hidden="true">·</span>
            <span>{t('forum.readingTime', { n: post.readingMinutes || 1 })}</span>
            <span aria-hidden="true">·</span>
            <span className="tnum">{t('forum.views', { formatted: formatNumber(post.viewsCount || 0) })}</span>
            {post.isEdited && (
              <>
                <span aria-hidden="true">·</span>
                <span>{t('forum.edited')}</span>
              </>
            )}
          </div>

          {canManage && (
            <div className="mt-5 flex flex-wrap gap-2">
              <Link to={`/forum/${post.slug}/edit`} className="btn btn-secondary btn-sm">
                {t('common.edit')}
              </Link>
              <button type="button" onClick={deletePost} className="btn btn-ghost btn-sm text-danger">
                {t('common.delete')}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        {post.coverUrl && (
          <img
            src={post.coverUrl}
            alt=""
            loading="lazy"
            className="mb-8 w-full rounded-2xl border border-line object-cover"
          />
        )}

        {post.sourceUrl && (
          <a
            href={post.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="mb-8 flex items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-sm transition-colors hover:border-brand/40"
          >
            <ExternalIcon />
            <span className="min-w-0 flex-1">
              <span className="block text-xs text-muted">{t('forum.source')}</span>
              <span className="block truncate font-display text-[13px]">{post.sourceUrl}</span>
            </span>
          </a>
        )}

        <MarkdownView content={post.content} />

        {post.tags?.length > 0 && (
          <div className="mt-8 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Link
                key={tag}
                to={`/forum?tag=${encodeURIComponent(tag)}`}
                className="rounded-md border border-line px-2.5 py-1 font-display text-xs text-muted transition-colors hover:border-brand/40 hover:text-fg"
              >
                #{tag}
              </Link>
            ))}
          </div>
        )}

        {/* شريط التفاعل — ثابت أسفل النص، وهو الدعوة الأساسية للفعل بصفحة المنشور */}
        <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-y border-line py-5">
          <ReactionBar
            myReaction={post.myReaction}
            count={post.reactionsCount}
            breakdown={post.reactionBreakdown}
            disabled={!user}
            onReact={reactToPost}
          />

          {user && !isAuthor && (
            <button
              type="button"
              onClick={() => setReporting(true)}
              disabled={reported}
              className="text-sm text-muted transition-colors hover:text-danger disabled:opacity-60"
            >
              {reported ? t('forum.reportSubmitted') : t('forum.reportPost')}
            </button>
          )}
        </div>

        {!user && (
          <p className="mt-5 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
            <Link to="/login" className="link-brand">
              {t('forum.loginToInteract')}
            </Link>
          </p>
        )}

        {/* التعليقات */}
        <section className="mt-12" id="comments">
          <h2 className="section-title mb-5">
            {t('forum.commentsHeading', { formatted: formatNumber(commentsTotal) })}
          </h2>

          {user ? (
            <form onSubmit={submitComment} className="mb-6 flex flex-col gap-2">
              <textarea
                dir="auto"
                rows={3}
                value={newComment}
                maxLength={2000}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder={t('forum.commentPlaceholder')}
                aria-label={t('forum.commentPlaceholder')}
                className="input"
              />
              <div className="flex justify-end">
                <button type="submit" disabled={sending || !newComment.trim()} className="btn btn-primary btn-sm">
                  {sending ? t('forum.sending') : t('forum.publishComment')}
                </button>
              </div>
            </form>
          ) : null}

          {comments.length === 0 ? (
            <p className="rounded-xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
              {t('forum.noComments')}
            </p>
          ) : (
            <ul className="divide-y divide-line-soft">
              {comments.map((comment) => (
                <CommentNode
                  key={comment._id}
                  comment={comment}
                  currentUser={user}
                  onReply={addComment}
                  onReact={reactToComment}
                  onEdit={editComment}
                  onDelete={deleteComment}
                />
              ))}
            </ul>
          )}
        </section>

        {related.length > 0 && (
          <section className="mt-14">
            <h2 className="section-title mb-5">{t('forum.related')}</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {related.map((item, index) => (
                <PostCard key={item._id} post={item} index={index} variant="compact" />
              ))}
            </div>
          </section>
        )}
      </div>

      {reporting && (
        <ReportModal
          targetType="post"
          targetId={post._id}
          onClose={() => setReporting(false)}
          onSubmitted={() => setReported(true)}
        />
      )}
    </article>
  );
}
