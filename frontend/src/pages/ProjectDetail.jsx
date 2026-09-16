import { useEffect, useRef, useState, lazy, Suspense } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Tabs from '../components/Tabs';
import ReportModal from '../components/ReportModal';
import FileTree from '../components/FileTree';
import EmptyState from '../components/EmptyState';
import Avatar, { VerifiedMark } from '../components/Avatar';
import Spinner from '../components/Spinner';
import { ProjectDetailSkeleton } from '../components/Skeleton';
import usePolling from '../hooks/usePolling';
import { formatBytes, formatRelativeTime } from '../utils/format';
import { formatNumber } from '../utils/formatNumber';
import { isPreviewable } from '../utils/previewable';

// منأجّل تحميل هدول لأنهم بيسحبوا معهم marked + DOMPurify + highlight.js، وما
// منحتاجهم إلا لو المشروع فيه README أو المستخدم فتح معاينة ملف
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
  const [reportTarget, setReportTarget] = useState(null);
  const [newComment, setNewComment] = useState('');
  const [commentError, setCommentError] = useState('');
  const [editingCommentId, setEditingCommentId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [editError, setEditError] = useState('');
  const [contactOpen, setContactOpen] = useState(false);
  const [contactMessage, setContactMessage] = useState('');
  const [contactSent, setContactSent] = useState(false);
  const [contactError, setContactError] = useState('');
  const [previewFile, setPreviewFile] = useState(null);

  const licenseRef = useRef(null);

  const loadComments = () => {
    apiClient.get(`/projects/${slug}/comments`).then((res) => setComments(res.data.comments)).catch(() => {});
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

  usePolling(loadComments, 15000);

  // إغلاق بطاقة شرح الترخيص بالضغط برّاها
  useEffect(() => {
    if (!showLicenseInfo) return undefined;
    const onPointerDown = (event) => {
      if (licenseRef.current && !licenseRef.current.contains(event.target)) setShowLicenseInfo(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [showLicenseInfo]);

  const handleStar = async () => {
    if (!user) return navigate('/login');
    if (starPending) return;
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

  const handleAddComment = async (event) => {
    event.preventDefault();
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
      setComments(comments.map((comment) => (comment._id === id ? res.data.comment : comment)));
      setEditingCommentId(null);
    } catch (err) {
      setEditError(err.response?.data?.message || t('projectDetail.commentEditError'));
    }
  };

  const handleContact = async (event) => {
    event.preventDefault();
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

  if (loading) return <ProjectDetailSkeleton />;

  if (!data) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-base font-semibold">{t('common.projectNotFound')}</p>
        <Link to="/explore" className="btn btn-secondary btn-sm mt-5">
          {t('nav.explore')}
        </Link>
      </div>
    );
  }

  const { project, licenseDetails } = data;
  const ownerId = project.owner._id;
  const isOwner = user?.id === ownerId;

  return (
    <div>
      {/* ----------------------------- ترويسة المشروع ----------------------------- */}
      <div className="border-b border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <nav className="mb-4 flex items-center gap-2 text-sm text-muted" aria-label="breadcrumb">
            <Link to="/explore" className="transition-colors hover:text-fg">
              {t('nav.explore')}
            </Link>
            <span aria-hidden="true">/</span>
            <Link
              to={`/explore?category=${project.category}`}
              className="transition-colors hover:text-fg"
            >
              {t(`categories.${toCategoryKey(project.category)}`, project.category)}
            </Link>
          </nav>

          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {project.name}
              </h1>
              <p className="mt-3 max-w-2xl leading-relaxed text-muted">{project.description}</p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleStar}
                disabled={starPending}
                aria-pressed={starred}
                className="btn btn-secondary"
              >
                <svg
                  className={`h-4 w-4 ${starred ? 'fill-gold text-gold' : 'fill-none'}`}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M12 2.6l2.8 6.3 6.8.6-5.1 4.5 1.5 6.7L12 17.1 6 20.7l1.5-6.7L2.4 9.5l6.8-.6z" />
                </svg>
                <span className="tnum">{formatNumber(starsCount)}</span>
              </button>

              {isOwner ? (
                <Link to={`/project/${slug}/edit`} className="btn btn-secondary">
                  {t('editProject.title')}
                </Link>
              ) : (
                <button onClick={() => setContactOpen((open) => !open)} className="btn btn-secondary">
                  {t('projectDetail.contactOwner')}
                </button>
              )}

              <button onClick={handleDownload} className="btn btn-primary">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 4v10m0 0 4-4m-4 4-4-4" />
                  <path d="M5 17v1.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V17" />
                </svg>
                {t('projectDetail.download', { count: project.downloadsCount })}
              </button>
            </div>
          </div>

          {/* صندوق التواصل مع صاحب المشروع */}
          {contactOpen && !isOwner && (
            <div className="mt-6 rounded-2xl border border-brand/30 bg-brand/5 p-4">
              {contactSent ? (
                <p className="text-sm text-brand-light">
                  {t('projectDetail.messageSent')}{' '}
                  <Link to="/messages" className="underline underline-offset-4">
                    {t('projectDetail.viewConversation')}
                  </Link>
                </p>
              ) : (
                <form onSubmit={handleContact} className="flex flex-col gap-2">
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      value={contactMessage}
                      onChange={(event) => setContactMessage(event.target.value)}
                      placeholder={t('projectDetail.askPlaceholder', { name: project.owner.name })}
                      aria-label={t('projectDetail.contactOwner')}
                      className="input flex-1"
                    />
                    <button className="btn btn-primary">{t('common.send')}</button>
                  </div>
                  {contactError && <p className="text-xs text-danger">{contactError}</p>}
                </form>
              )}
            </div>
          )}
        </div>
      </div>

      {/* ------------------------------- المحتوى ------------------------------- */}
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_320px]">
        {/* --- العمود الأساسي --- */}
        <div className="min-w-0">
          <Tabs
            tabs={[
              {
                label: t('projectDetail.overview'),
                content: project.readme ? (
                  <div className="panel p-6">
                    <Suspense fallback={<div className="skeleton h-40 w-full" />}>
                      <MarkdownView content={project.readme} />
                    </Suspense>
                  </div>
                ) : (
                  <EmptyState icon="files" title={t('projectDetail.noReadme')} />
                ),
              },
              {
                label: t('projectDetail.filesTab'),
                count: project.files?.length || 0,
                content:
                  project.files?.length === 0 ? (
                    <EmptyState icon="files" title={t('projectDetail.noFiles')} />
                  ) : (
                    <div className="overflow-hidden rounded-2xl border border-line">
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
                              style={{ paddingInlineStart: `${depth * 18 + 16}px` }}
                              className={`flex w-full items-center justify-between gap-2 border-t border-line-soft py-2.5 pe-4 text-start text-sm first:border-t-0 ${
                                previewable ? 'cursor-pointer hover:bg-fg/5' : 'cursor-default'
                              }`}
                            >
                              <span className="flex min-w-0 items-center gap-2">
                                <svg className="h-3.5 w-3.5 shrink-0 text-muted" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
                                  <path d="M6 3h8l4 4v14H6z" />
                                  <path d="M14 3v4h4" />
                                </svg>
                                <span className="truncate font-mono text-[13px]">{file.filename}</span>
                              </span>
                              <span className="shrink-0 text-xs text-muted tnum">{formatBytes(file.size)}</span>
                            </button>
                          );
                        }}
                      />
                    </div>
                  ),
              },
              {
                label: t('projectDetail.commentsTab'),
                count: comments.length,
                content: (
                  <div>
                    {user ? (
                      <form onSubmit={handleAddComment} className="mb-6">
                        <div className="flex flex-col gap-2 sm:flex-row">
                          <input
                            value={newComment}
                            onChange={(event) => setNewComment(event.target.value)}
                            placeholder={t('projectDetail.commentPlaceholder')}
                            aria-label={t('projectDetail.commentPlaceholder')}
                            className="input flex-1"
                          />
                          <button className="btn btn-primary">{t('common.send')}</button>
                        </div>
                        {commentError && (
                          <p role="alert" className="mt-2 text-xs text-danger">
                            {commentError}
                          </p>
                        )}
                      </form>
                    ) : (
                      <p className="mb-6 rounded-xl border border-line bg-surface px-4 py-3 text-sm text-muted">
                        <Link to="/login" className="link-brand font-medium">
                          {t('projectDetail.loginTo')}
                        </Link>{' '}
                        {t('projectDetail.toComment')}
                      </p>
                    )}

                    {comments.length === 0 ? (
                      <EmptyState icon="comments" title={t('projectDetail.noComments')} />
                    ) : (
                      <ul className="flex flex-col gap-5">
                        {comments.map((comment) => (
                          <li key={comment._id} className="flex gap-3">
                            <Avatar name={comment.user?.name} id={comment.user?._id} size="md" />

                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-sm font-semibold">{comment.user?.name}</span>
                                <span className="text-xs text-muted">
                                  {formatRelativeTime(comment.createdAt)}
                                  {comment.isEdited && ` ${t('projectDetail.edited')}`}
                                </span>
                              </div>

                              {editingCommentId === comment._id ? (
                                <div className="mt-2">
                                  <div className="flex flex-col gap-2 sm:flex-row">
                                    <input
                                      value={editingContent}
                                      onChange={(event) => setEditingContent(event.target.value)}
                                      className="input flex-1"
                                    />
                                    <div className="flex gap-2">
                                      <button onClick={() => handleSaveEdit(comment._id)} className="btn btn-primary btn-sm">
                                        {t('common.save')}
                                      </button>
                                      <button
                                        onClick={() => {
                                          setEditingCommentId(null);
                                          setEditError('');
                                        }}
                                        className="btn btn-ghost btn-sm"
                                      >
                                        {t('common.cancel')}
                                      </button>
                                    </div>
                                  </div>
                                  {editError && (
                                    <p role="alert" className="mt-1.5 text-xs text-danger">
                                      {editError}
                                    </p>
                                  )}
                                </div>
                              ) : (
                                <p className="mt-1 text-sm leading-relaxed">{comment.content}</p>
                              )}

                              <div className="mt-2 flex gap-4 text-xs text-muted">
                                {user?.id === comment.user?._id && editingCommentId !== comment._id && (
                                  <button
                                    onClick={() => {
                                      setEditingCommentId(comment._id);
                                      setEditingContent(comment.content);
                                      setEditError('');
                                    }}
                                    className="transition-colors hover:text-fg"
                                  >
                                    {t('common.edit')}
                                  </button>
                                )}
                                <button
                                  onClick={() => setReportTarget({ targetType: 'comment', targetId: comment._id })}
                                  className="transition-colors hover:text-danger"
                                >
                                  {t('common.report')}
                                </button>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </div>

        {/* --- العمود الجانبي: كل المعلومات الثابتة بمكان واحد بدل ما تكون مبعثرة --- */}
        <aside className="flex flex-col gap-4 lg:sticky lg:top-24 lg:self-start">
          <section className="panel p-5">
            <h2 className="mb-4 text-sm font-semibold text-muted">{t('projectDetail.ownerTitle')}</h2>
            <Link to={`/profile/${ownerId}`} className="flex items-center gap-3 transition-colors hover:text-brand-light">
              <Avatar name={project.owner.name} id={ownerId} size="lg" />
              <span className="min-w-0">
                <span className="flex items-center gap-1 font-semibold">
                  <span className="truncate">{project.owner.name}</span>
                  {project.owner.verified && <VerifiedMark title={t('profile.verified')} />}
                </span>
                <span className="mt-0.5 block text-xs text-muted">
                  {t('projectDetail.publishedAt', { time: formatRelativeTime(project.createdAt) })}
                </span>
              </span>
            </Link>
          </section>

          <section className="panel divide-y divide-line-soft">
            <SidebarRow label={t('projectDetail.language')} value={<span className="font-display">{project.language}</span>} />
            <SidebarRow label={t('common.viewCountLabel')} value={<span className="tnum">{formatNumber(project.viewsCount ?? 0)}</span>} />
            <SidebarRow label={t('projectDetail.downloads')} value={<span className="tnum">{formatNumber(project.downloadsCount ?? 0)}</span>} />
            <SidebarRow label={t('projectDetail.filesTab')} value={<span className="tnum">{formatNumber(project.files?.length || 0)}</span>} />

            <div className="relative flex items-center justify-between gap-3 px-5 py-3.5" ref={licenseRef}>
              <span className="text-sm text-muted">{t('projectDetail.license')}</span>
              <button
                onClick={() => setShowLicenseInfo((open) => !open)}
                className="flex items-center gap-1.5 text-sm font-medium text-brand-light"
                aria-expanded={showLicenseInfo}
              >
                {project.license.type}
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <circle cx="12" cy="12" r="9" />
                  <path d="M12 11v5M12 8h.01" strokeLinecap="round" />
                </svg>
              </button>

              {showLicenseInfo && licenseDetails && (
                <div className="absolute end-4 top-12 z-20 w-72 rounded-2xl border border-line bg-elevated p-4 text-xs shadow-[var(--shadow-pop)]">
                  <p className="mb-2 text-sm font-semibold">{licenseDetails.name}</p>
                  <p className="leading-relaxed text-muted">{licenseDetails.summary}</p>
                  {project.license.type === 'Custom' && project.license.customText && (
                    <p className="mt-3 whitespace-pre-wrap border-t border-line-soft pt-3 leading-relaxed">
                      {project.license.customText}
                    </p>
                  )}
                </div>
              )}
            </div>
          </section>

          {project.tags?.length > 0 && (
            <section className="panel p-5">
              <h2 className="mb-3 text-sm font-semibold text-muted">{t('projectDetail.tags')}</h2>
              <div className="flex flex-wrap gap-2">
                {project.tags.map((tag) => (
                  <Link
                    key={tag}
                    to={`/explore?tags=${encodeURIComponent(tag)}`}
                    className="rounded-lg bg-fg/5 px-2.5 py-1 font-mono text-xs text-muted transition-colors hover:text-brand-light"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            </section>
          )}

          <button
            onClick={() => setReportTarget({ targetType: 'project', targetId: project._id })}
            className="btn btn-ghost btn-sm self-start"
          >
            {t('projectDetail.reportProject')}
          </button>
        </aside>
      </div>

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
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <Spinner className="h-8 w-8 text-brand-light" />
            </div>
          }
        >
          <FilePreviewModal slug={slug} file={previewFile} onClose={() => setPreviewFile(null)} />
        </Suspense>
      )}
    </div>
  );
}

function SidebarRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 px-5 py-3.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  );
}

/** بيحوّل قيمة الفئة من الـ API لمفتاح الترجمة المقابل. */
function toCategoryKey(category) {
  return (
    {
      'training-code': 'trainingCode',
      'model-architecture': 'modelArchitecture',
      dataset: 'dataset',
      'data-cleaning': 'dataCleaning',
      other: 'other',
    }[category] || 'other'
  );
}
