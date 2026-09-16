import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import PostCard from '../components/PostCard';
import PageHeader from '../components/PageHeader';
import EmptyState from '../components/EmptyState';
import { ProjectGridSkeleton } from '../components/Skeleton';
import { POST_TYPES } from '../utils/postMeta';
import { formatNumber } from '../utils/formatNumber';

const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'forum.sort.newest' },
  { value: 'top', labelKey: 'forum.sort.top' },
  { value: 'discussed', labelKey: 'forum.sort.discussed' },
];

function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((page) => page >= 1 && page <= total).sort((a, b) => a - b);

  const result = [];
  let previous = 0;
  for (const page of sorted) {
    if (previous && page - previous > 1) result.push('…');
    result.push(page);
    previous = page;
  }
  return result;
}

function RemoveIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}

/**
 * المنتدى: مساحة مفتوحة لأخبار الذكاء الاصطناعي والمقالات والأبحاث والقصص.
 * نفس لغة تصميم صفحة التصفّح (فلاتر كأزرار ظاهرة + شبكة بطاقات + ترقيم)، حتى
 * الانتقال بين قسمي المنصة يحس كإنو نفس المكان مش موقعين ملزوقين ببعض.
 */
export default function Feed() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [popularTags, setPopularTags] = useState([]);
  const [loading, setLoading] = useState(true);

  const search = searchParams.get('search') || '';
  const type = searchParams.get('type') || '';
  const tag = searchParams.get('tag') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  const [searchInput, setSearchInput] = useState(search);
  useEffect(() => setSearchInput(search), [search]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next);
  };

  // تأخير البحث حتى ما نبعت طلب على كل حرف
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== search) updateParam('search', searchInput);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiClient
      .get('/posts', { params: { search, type, tag, sort, page, limit: 12 } })
      .then((res) => {
        if (cancelled) return;
        setPosts(res.data.posts || []);
        setPagination(res.data.pagination || null);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [search, type, tag, sort, page]);

  useEffect(() => {
    apiClient
      .get('/posts/tags')
      .then((res) => setPopularTags(res.data.tags || []))
      .catch(() => {});
  }, []);

  const total = pagination?.total;

  return (
    <div>
      <PageHeader
        title={t('forum.title')}
        description={t('forum.subtitle')}
        actions={
          user ? (
            <Link to="/forum/new" className="btn btn-primary">
              <svg className="h-[18px] w-[18px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
                <path d="M12 5v14M5 12h14" />
              </svg>
              {t('forum.newPost')}
            </Link>
          ) : (
            <Link to="/login" className="btn btn-primary">
              {t('forum.loginToPost')}
            </Link>
          )
        }
      >
        <div className="mt-8 flex flex-col gap-4">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            <button type="button" onClick={() => updateParam('type', '')} data-active={!type} className="chip">
              {t('forum.types.all')}
            </button>
            {POST_TYPES.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => updateParam('type', item.key)}
                data-active={type === item.key}
                className="chip gap-1.5"
              >
                <item.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                {t(item.labelKey)}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
            <div className="relative">
              <svg
                className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                aria-hidden="true"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20.5 20.5-4-4" />
              </svg>
              <input
                type="search"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder={t('forum.searchPlaceholder')}
                aria-label={t('forum.searchPlaceholder')}
                className="input ps-9"
              />
            </div>

            <select
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value)}
              aria-label={t('forum.sortLabel')}
              className="input sm:w-48"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {t(option.labelKey)}
                </option>
              ))}
            </select>
          </div>
        </div>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-[1fr_260px]">
          <div>
            {(tag || search) && (
              <div className="mb-6 flex flex-wrap items-center gap-2">
                {tag && (
                  <button type="button" onClick={() => updateParam('tag', '')} className="chip" data-active="true">
                    #{tag}
                    <RemoveIcon />
                  </button>
                )}
                {search && (
                  <button type="button" onClick={() => updateParam('search', '')} className="chip" data-active="true">
                    <span className="max-w-[16ch] truncate">{search}</span>
                    <RemoveIcon />
                  </button>
                )}
              </div>
            )}

            {!loading && total !== undefined && (
              <p className="mb-5 text-sm text-muted">
                {t('forum.resultCount', { formatted: formatNumber(total) })}
              </p>
            )}

            {loading ? (
              <ProjectGridSkeleton count={6} />
            ) : posts.length === 0 ? (
              <EmptyState
                icon="comments"
                title={t('forum.empty')}
                description={t('forum.emptyHint')}
                action={user ? { to: '/forum/new', label: t('forum.newPost') } : { to: '/login', label: t('forum.loginToPost') }}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  {posts.map((post, index) => (
                    <PostCard key={post._id} post={post} index={index} />
                  ))}
                </div>

                {pagination && pagination.pages > 1 && (
                  <nav className="mt-10 flex flex-wrap items-center justify-center gap-1.5" aria-label={t('explore.pagination')}>
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => updateParam('page', String(page - 1))}
                      className="btn btn-secondary btn-sm"
                    >
                      {t('explore.previous')}
                    </button>

                    {getPageItems(page, pagination.pages).map((item, index) =>
                      item === '…' ? (
                        <span key={`gap-${index}`} className="px-1 text-sm text-muted">
                          …
                        </span>
                      ) : (
                        <button
                          key={item}
                          type="button"
                          onClick={() => updateParam('page', String(item))}
                          aria-current={item === page ? 'page' : undefined}
                          className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors tnum ${
                            item === page ? 'bg-brand text-white' : 'text-muted hover:bg-fg/5 hover:text-fg'
                          }`}
                        >
                          {item}
                        </button>
                      )
                    )}

                    <button
                      type="button"
                      disabled={page >= pagination.pages}
                      onClick={() => updateParam('page', String(page + 1))}
                      className="btn btn-secondary btn-sm"
                    >
                      {t('explore.next')}
                    </button>
                  </nav>
                )}
              </>
            )}
          </div>

          {/* عمود جانبي: قواعد المنتدى + أكثر الوسوم — بيعطي الصفحة سياق وبيملّي
              الفراغ على الشاشات العريضة بدل عمود بطاقات ممدود */}
          <aside className="hidden flex-col gap-5 lg:flex">
            <div className="panel p-5">
              <h2 className="mb-3 font-display text-sm font-semibold">{t('forum.guidelines.title')}</h2>
              <ul className="space-y-2 text-sm leading-relaxed text-muted">
                <li className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {t('forum.guidelines.one')}
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {t('forum.guidelines.two')}
                </li>
                <li className="flex gap-2">
                  <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-brand" />
                  {t('forum.guidelines.three')}
                </li>
              </ul>
            </div>

            {popularTags.length > 0 && (
              <div className="panel p-5">
                <h2 className="mb-3 font-display text-sm font-semibold">{t('forum.popularTags')}</h2>
                <div className="flex flex-wrap gap-1.5">
                  {popularTags.map((item) => (
                    <button
                      key={item.tag}
                      type="button"
                      onClick={() => updateParam('tag', item.tag === tag ? '' : item.tag)}
                      data-active={item.tag === tag}
                      className="chip"
                    >
                      #{item.tag}
                      <span className="tnum text-muted">{item.count}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
