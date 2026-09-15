import { useEffect, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Tabs from '../components/Tabs';
import ReportModal from '../components/ReportModal';
import FileTree from '../components/FileTree';
import EmptyState from '../components/EmptyState';
import { ProjectDetailSkeleton } from '../components/Skeleton';
import usePolling from '../hooks/usePolling';
import { formatBytes, formatRelativeTime } from '../utils/format';
import { avatarColorFor } from '../utils/avatarColor';
import { isPreviewable } from '../utils/previewable';

// نؤجّل تحميل هدول لأنهم بيسحبوا معهم highlight.js + marked + DOMPurify (مكتبة وزنها
// محسوس)، وما محتاجينهم إلا لو المشروع فيه README أو المستخدم فتح معاينة ملف فعلياً -
// هيك أول تحميل لأي صفحة تانية بالموقع (تصفّح، رفع، إلخ) بيضل خفيف
const MarkdownView = lazy(() => import('../components/MarkdownView'));
const FilePreviewModal = lazy(() => import('../components/FilePreviewModal'));

export default function ProjectDetail() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [data, setData] = useState(null);
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [starred, setStarred] = useState(false);
  const [starsCount, setStarsCount] = useState(0);
  const [starPending, setStarPending] = useState(false);
  const [showLicenseInfo, setShowLicenseInfo] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { targetType, targetId } | null
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editError, setEditError] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');
  const [previewFile, setPreviewFile] = useState(null); // ملف الشجرة يلي فاتح بمعاينة حالياً

  const loadComments = () => {
    apiClient.get(`/projects/${slug}/comments`).then((res) => setComments(res.data.comments));
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`/projects/${slug}`),
      apiClient.get(`/projects/${slug}/comments`),
    ])
      .then(([projectRes, commentsRes]) => {
        setData(projectRes.data);
        setStarsCount(projectRes.data.project.starsCount);
        setStarred(projectRes.data.isStarredByMe);
        setComments(commentsRes.data.comments);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  // تحديث دوري للتعليقات - حتى تبان تعليقات جديدة بدون ما تحدّث الصفحة يدوياً
  usePolling(loadComments, 15000);

  const handleStar = async () => {
    if (!user) return navigate('/login');
    if (starPending) return; // نمنع الضغط السريع المتكرر من إرسال طلبات فوق بعض
    setStarPending(true);
    try {
      const res = await apiClient.post(`/projects/${slug}/star`);
      setStarred(res.data.starred);
      setStarsCount(res.data.starsCount);
    } finally {
      setStarPending(false);
    }
  };

  const handleDownload = () => {
    window.open(`${apiClient.defaults.baseURL}/projects/${slug}/download`, '_blank');
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    setCommentError('');
    if (!newComment.trim()) return;
    try {
      const res = await apiClient.post(`/projects/${slug}/comments`, { content: newComment });
      setComments([res.data.comment, ...comments]);
      setNewComment('');
    } catch (err) {
      setCommentError(err.response?.data?.message || t('projectDetail.commentAddError'));
    }
  };

  const handleSaveEdit = async (id) => {
    setEditError('');
    try {
      const res = await apiClient.put(`/comments/${id}`, { content: editingContent });
      setComments(comments.map((c) => (c._id === id ? res.data.comment : c)));
      setEditingCommentId(null);
    } catch (err) {
      setEditError(err.response?.data?.message || t('projectDetail.commentEditError'));
    }
  };

  const handleContact = async (e) => {
    e.preventDefault();
    setContactError('');
    if (!user) return navigate('/login');
    if (!contactMessage.trim()) return;
    try {
      await apiClient.post('/messages/start', {
        recipientId: data.project.owner._id,
        projectId: data.project._id,
        content: contactMessage,
      });
      setContactMessage('');
      setContactSent(true);
    } catch (err) {
      setContactError(err.response?.data?.message || t('projectDetail.contactSendError'));
    }
  };

  if (loading) {
    return <ProjectDetailSkeleton />;
  }
  if (!data) {
    return <div className="p-10 text-center text-sm text-ink-muted light:text-paper-muted">{t('common.projectNotFound')}</div>;
  }

  const { project, licenseDetails } = data;
  const isOwner = user?.id === project.owner._id;

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      {/* رأس الصفحة */}
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="mb-2 text-2xl font-semibold">{project.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-sm text-ink-muted light:text-paper-muted">
            <Link to={`/profile/${project.owner._id}`} className="flex items-center gap-1.5 hover:text-violet-400">
              <span className={`flex h-5 w-5 items-center justify-center rounded-full font-mono text-[10px] font-semibold ${avatarColorFor(project.owner._id).bg} ${avatarColorFor(project.owner._id).text}`}>
                {project.owner.name?.charAt(0)}
              </span>
              {project.owner.name}
              {project.owner.verified && <span className="text-violet-400">✓</span>}
            </Link>
            <span>·</span>
            <span className="font-mono">{project.language}</span>
            <span>·</span>
            <span>{formatRelativeTime(project.createdAt)}</span>
            <span>·</span>
            <span className="flex items-center gap-1">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {t('common.viewCount', { count: project.viewsCount ?? 0 })}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handleStar}
            disabled={starPending}
            className="flex items-center gap-1.5 rounded-lg border border-ink-border px-3 py-1.5 text-sm hover:bg-ink-surface disabled:opacity-60 light:border-paper-border light:hover:bg-paper-surface"
          >
            <svg
              className={`h-4 w-4 ${starred ? 'fill-gold text-gold' : 'fill-none text-ink-muted light:text-paper-muted'}`}
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6L12 2z" />
            </svg>
            {starsCount}
          </button>

          {isOwner ? (
            <Link
              to={`/project/${slug}/edit`}
              className="flex items-center gap-1.5 rounded-lg border border-ink-border px-3 py-1.5 text-sm hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
            >
              {t('editProject.title')}
            </Link>
          ) : (
            <button
              onClick={() => setContactOpen((v) => !v)}
              className="flex items-center gap-1.5 rounded-lg border border-ink-border px-3 py-1.5 text-sm hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
            >
              {t('projectDetail.contactOwner')}
            </button>
          )}

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 rounded-lg bg-violet-500 px-3 py-1.5 text-sm font-medium text-white hover:bg-violet-600"
          >
            {t('projectDetail.download', { count: project.downloadsCount })}
          </button>
        </div>
      </div>

      {/* صندوق التواصل مع صاحب المشروع */}
      {contactOpen && !isOwner && (
        <div className="mb-6 rounded-lg border border-violet-500/30 bg-violet-500/5 p-4">
          {contactSent ? (
            <p className="text-sm text-violet-400">
              {t('projectDetail.messageSent')}{' '}
              <Link to="/messages" className="underline">
                {t('projectDetail.viewConversation')}
              </Link>
            </p>
          ) : (
            <form onSubmit={handleContact} className="flex flex-col gap-2">
              <div className="flex gap-2">
                <input
                  value={contactMessage}
                  onChange={(e) => setContactMessage(e.target.value)}
                  placeholder={t('projectDetail.askPlaceholder', { name: project.owner.name })}
                  className="flex-1 rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
                />
                <button className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600">
                  {t('common.send')}
                </button>
              </div>
              {contactError && <p className="text-xs text-red-400">{contactError}</p>}
            </form>
          )}
        </div>
      )}

      {/* الوصف والوسوم */}
      <p className="mb-4 leading-relaxed text-ink-text light:text-paper-text">{project.description}</p>

      <div className="mb-6 flex flex-wrap items-center gap-2">
        {project.tags?.map((tag) => (
          <Link
            key={tag}
            to={`/explore?tags=${encodeURIComponent(tag)}`}
            className="rounded-md bg-ink-surface px-2 py-1 font-mono text-xs text-ink-muted hover:text-violet-400 light:bg-paper-surface light:text-paper-muted"
          >
            {tag}
          </Link>
        ))}

        <div className="relative">
          <button
            onClick={() => setShowLicenseInfo((v) => !v)}
            className="rounded-md border border-ink-border px-2 py-1 font-mono text-xs text-violet-400 hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
          >
            {project.license.type} ⓘ
          </button>
          {showLicenseInfo && licenseDetails && (
            <div className="absolute top-8 z-10 w-72 rounded-lg border border-ink-border bg-ink-surface-raised p-3 text-xs shadow-lg light:border-paper-border light:bg-paper-surface">
              <p className="mb-2 font-medium">{licenseDetails.name}</p>
              <p className="mb-2 leading-relaxed text-ink-muted light:text-paper-muted">
                {licenseDetails.summary}
              </p>
              {project.license.type === 'Custom' && project.license.customText && (
                <p className="mt-2 whitespace-pre-wrap border-t border-ink-border pt-2 light:border-paper-border">
                  {project.license.customText}
                </p>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => setReportTarget({ targetType: 'project', targetId: project._id })}
          className="ms-auto text-xs text-ink-muted hover:text-red-400 light:text-paper-muted"
        >
          {t('projectDetail.reportProject')}
        </button>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          {
            label: t('projectDetail.overview'),
            content: project.readme ? (
              <div className="rounded-xl border border-ink-border bg-ink-surface p-5 light:border-paper-border light:bg-paper-surface">
                <Suspense fallback={<div className="h-24 animate-pulse rounded-lg bg-ink/40 light:bg-paper" />}>
                  <MarkdownView content={project.readme} />
                </Suspense>
              </div>
            ) : (
              <div className="rounded-xl border border-ink-border bg-ink-surface p-5 text-sm text-ink-muted light:border-paper-border light:bg-paper-surface light:text-paper-muted">
                {t('projectDetail.noReadme')}
              </div>
            ),
          },
          {
            label: t('projectDetail.filesTab'),
            count: project.files?.length || 0,
            content: (
              <div className="overflow-hidden rounded-xl border border-ink-border light:border-paper-border">
                {project.files?.length === 0 ? (
                  <EmptyState icon="files" title={t('projectDetail.noFiles')} />
                ) : (
                  <FileTree
                    files={project.files}
                    renderLeaf={(file, depth) => {
                      const previewable = isPreviewable(file.filename);
                      return (
                        <button
                          key={file._id}
                          type="button"
                          onClick={() => previewable && setPreviewFile(file)}
                          disabled={!previewable}
                          style={{ paddingRight: `${depth * 18 + 16}px` }}
                          className={`flex w-full items-center justify-between gap-2 border-t border-ink-border py-2.5 pl-4 text-sm first:border-t-0 light:border-paper-border ${
                            previewable ? 'cursor-pointer text-start hover:bg-ink/40 light:hover:bg-paper' : 'cursor-default text-start'
                          }`}
                        >
                          <span className="flex min-w-0 items-center gap-1.5">
                            {previewable && (
                              <svg className="h-3.5 w-3.5 shrink-0 text-ink-muted light:text-paper-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                                <circle cx="12" cy="12" r="3" />
                              </svg>
                            )}
                            <span className="truncate font-mono">{file.filename}</span>
                          </span>
                          <span className="shrink-0 text-ink-muted light:text-paper-muted">{formatBytes(file.size)}</span>
                        </button>
                      );
                    }}
                  />
                )}
              </div>
            ),
          },
          {
            label: t('projectDetail.commentsTab'),
            count: comments.length,
            content: (
              <div>
                {user ? (
                  <form onSubmit={handleAddComment} className="mb-5">
                    <div className="flex gap-2">
                      <input
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('projectDetail.commentPlaceholder')}
                        className="flex-1 rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
                      />
                      <button className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600">
                        {t('common.send')}
                      </button>
                    </div>
                    {commentError && <p className="mt-1.5 text-xs text-red-400">{commentError}</p>}
                  </form>
                ) : (
                  <p className="mb-5 text-sm text-ink-muted light:text-paper-muted">
                    <Link to="/login" className="text-violet-400 hover:underline">
                      {t('projectDetail.loginTo')}
                    </Link>{' '}
                    {t('projectDetail.toComment')}
                  </p>
                )}

                <div className="flex flex-col gap-4">
                  {comments.length === 0 && (
                    <EmptyState icon="comments" title={t('projectDetail.noComments')} />
                  )}
                  {comments.map((comment) => (
                    <div key={comment._id} className="flex gap-3">
                      <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-mono text-xs font-semibold ${avatarColorFor(comment.user?._id).bg} ${avatarColorFor(comment.user?._id).text}`}>
                        {comment.user?.name?.charAt(0)}
                      </span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="font-medium">{comment.user?.name}</span>
                          <span className="text-xs text-ink-muted light:text-paper-muted">
                            {formatRelativeTime(comment.createdAt)}
                            {comment.isEdited && ` ${t('projectDetail.edited')}`}
                          </span>
                        </div>

                        {editingCommentId === comment._id ? (
                          <div className="mt-1">
                            <div className="flex gap-2">
                              <input
                                value={editingContent}
                                onChange={(e) => setEditingContent(e.target.value)}
                                className="flex-1 rounded-lg border border-ink-border bg-ink-surface px-2 py-1 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
                              />
                              <button onClick={() => handleSaveEdit(comment._id)} className="text-xs text-violet-400 hover:underline">
                                {t('common.save')}
                              </button>
                              <button
                                onClick={() => {
                                  setEditingCommentId(null);
                                  setEditError('');
                                }}
                                className="text-xs text-ink-muted hover:underline light:text-paper-muted"
                              >
                                {t('common.cancel')}
                              </button>
                            </div>
                            {editError && <p className="mt-1 text-xs text-red-400">{editError}</p>}
                          </div>
                        ) : (
                          <p className="mt-0.5 text-sm leading-relaxed">{comment.content}</p>
                        )}

                        <div className="mt-1 flex gap-3 text-xs text-ink-muted light:text-paper-muted">
                          {user?.id === comment.user?._id && editingCommentId !== comment._id && (
                            <button
                              onClick={() => {
                                setEditingCommentId(comment._id);
                                setEditingContent(comment.content);
                                setEditError('');
                              }}
                              className="hover:text-violet-400"
                            >
                              {t('common.edit')}
                            </button>
                          )}
                          <button
                            onClick={() => setReportTarget({ targetType: 'comment', targetId: comment._id })}
                            className="hover:text-red-400"
                          >
                            {t('common.report')}
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ),
          },
        ]}
      />

      {reportTarget && (
        <ReportModal
          targetType={reportTarget.targetType}
          targetId={reportTarget.targetId}
          onClose={() => setReportTarget(null)}
          onSubmitted={() => alert(t('projectDetail.reportSubmitted'))}
        />
      )}

      {previewFile && (
        <Suspense
          fallback={
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-400 border-t-transparent" />
            </div>
          }
        >
          <FilePreviewModal slug={slug} file={previewFile} onClose={() => setPreviewFile(null)} />
        </Suspense>
      )}
    </div>
  );
}
