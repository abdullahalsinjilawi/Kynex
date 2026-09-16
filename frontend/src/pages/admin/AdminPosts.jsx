import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { ListSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import { postTypeOf } from '../../utils/postMeta';
import { formatRelativeTime } from '../../utils/format';

export default function AdminPosts() {
  const { t } = useTranslation();
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiClient
      .get('/admin/posts', { params: { search, limit: 50 } })
      .then((res) => setPosts(res.data.posts))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  // التثبيت/الإخفاء على /api/posts (نفس حماية adminOnly) مش على /api/admin —
  // حتى يضل منطق المنشور بمكان واحد بدل ما ينتسخ بين كنترولرين
  const togglePin = async (post) => {
    await apiClient.patch(`/posts/${post._id}/pin`);
    load();
  };

  const toggleHide = async (post) => {
    await apiClient.patch(`/posts/${post._id}/hide`);
    load();
  };

  return (
    <div>
      <input
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder={t('admin.posts.searchPlaceholder')}
        aria-label={t('admin.posts.searchPlaceholder')}
        className="input input-sm mb-5 max-w-sm"
      />

      {loading ? (
        <ListSkeleton count={6} />
      ) : posts.length === 0 ? (
        <EmptyState icon="comments" title={t('admin.posts.noResults')} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          {posts.map((post, index) => {
            const type = postTypeOf(post.type);
            return (
              <div
                key={post._id}
                className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-fg/[0.03] ${
                  index !== 0 ? 'border-t border-line' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5">
                    <Link to={`/forum/${post.slug}`} className="font-medium hover:text-brand-light">
                      {post.title}
                    </Link>
                    <span className={`badge gap-1 border ${type.chip}`}>{t(type.labelKey)}</span>
                    {post.isPinned && <span className="badge badge-brand">{t('forum.pinned')}</span>}
                    {(post.isHidden || post.isDeleted) && (
                      <span className="badge badge-danger">
                        {post.isDeleted ? t('admin.posts.deleted') : t('admin.posts.hidden')}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {post.author?.name} ({post.author?.email}) · {formatRelativeTime(post.createdAt)} ·{' '}
                    <span className="tnum">
                      {t('admin.posts.counters', {
                        reactions: post.reactionsCount || 0,
                        comments: post.commentsCount || 0,
                      })}
                    </span>
                  </p>
                </div>

                <div className="flex gap-2">
                  <button type="button" onClick={() => togglePin(post)} className="btn btn-secondary btn-sm">
                    {post.isPinned ? t('admin.posts.unpin') : t('admin.posts.pin')}
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleHide(post)}
                    className={`btn btn-sm ${post.isHidden ? 'btn-secondary' : 'btn-danger'}`}
                  >
                    {post.isHidden ? t('admin.posts.show') : t('admin.posts.hide')}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
