import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import { ProjectGridSkeleton } from '../components/Skeleton';

const CATEGORIES = [
  { value: '', labelKey: 'categories.all' },
  { value: 'training-code', labelKey: 'categories.trainingCode' },
  { value: 'model-architecture', labelKey: 'categories.modelArchitecture' },
  { value: 'dataset', labelKey: 'categories.dataset' },
  { value: 'data-cleaning', labelKey: 'categories.dataCleaning' },
  { value: 'other', labelKey: 'categories.other' },
];

const SORT_OPTIONS = [
  { value: 'newest', labelKey: 'sort.newest' },
  { value: 'most-starred', labelKey: 'sort.mostStarred' },
  { value: 'most-downloaded', labelKey: 'sort.mostDownloaded' },
];

// بترجع مصفوفة أرقام صفحات + '...' حتى ما يطول صف الأزرار كتير لو صار فيه عشرات
// الصفحات - بتعرض أول صفحتين، آخر صفحتين، وصفحة وحدة قبل وبعد الصفحة الحالية
function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const keep = new Set([1, 2, total - 1, total, current - 1, current, current + 1]);
  const sorted = [...keep].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);

  const result = [];
  let prev = 0;
  for (const p of sorted) {
    if (prev && p - prev > 1) result.push('…');
    result.push(p);
    prev = p;
  }
  return result;
}

export default function Explore() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState(null);

  const search = searchParams.get('search') || '';
  const category = searchParams.get('category') || '';
  const language = searchParams.get('language') || '';
  const tags = searchParams.get('tags') || '';
  const sort = searchParams.get('sort') || 'newest';
  const page = Number(searchParams.get('page') || 1);

  // نستخدم قيمة محلية للوسوم حتى ما نبعت طلب لكل حرف يكتبه المستخدم (debounce أدناه)
  const [tagsInput, setTagsInput] = useState(tags);
  useEffect(() => setTagsInput(tags), [tags]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // أي تغيير بالفلاتر يرجعنا لأول صفحة
    setSearchParams(next);
  };

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (tagsInput !== tags) updateParam('tags', tagsInput);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsInput]);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get('/projects', { params: { search, category, language, tags, sort, page, limit: 12 } })
      .then((res) => {
        setProjects(res.data.projects);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, language, tags, sort, page]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold">{t('explore.title')}</h1>

      {/* الفلاتر */}
      <div className="mb-6 flex flex-wrap gap-3">
        <select
          value={category}
          onChange={(e) => updateParam('category', e.target.value)}
          className="rounded-lg border border-ink-border bg-ink-surface px-3 py-1.5 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
        >
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {t(c.labelKey)}
            </option>
          ))}
        </select>

        <input
          type="text"
          value={language}
          onChange={(e) => updateParam('language', e.target.value)}
          placeholder={t('explore.languagePlaceholder')}
          className="rounded-lg border border-ink-border bg-ink-surface px-3 py-1.5 text-sm outline-none placeholder:text-ink-muted focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
        />

        <input
          type="text"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          placeholder={t('explore.tagsPlaceholder')}
          className="rounded-lg border border-ink-border bg-ink-surface px-3 py-1.5 text-sm outline-none placeholder:text-ink-muted focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
        />

        <select
          value={sort}
          onChange={(e) => updateParam('sort', e.target.value)}
          className="ms-auto rounded-lg border border-ink-border bg-ink-surface px-3 py-1.5 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
        >
          {SORT_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>
              {t(s.labelKey)}
            </option>
          ))}
        </select>
      </div>

      {search && (
        <p className="mb-4 text-sm text-ink-muted light:text-paper-muted">
          {t('explore.searchResultsFor')} <span className="font-mono text-violet-400">{search}</span>
        </p>
      )}

      {loading ? (
        <ProjectGridSkeleton count={9} />
      ) : projects.length === 0 ? (
        <EmptyState icon="search" title={t('explore.empty')} />
      ) : (
        <>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {projects.map((project, i) => (
              <ProjectCard key={project._id} project={project} index={i} />
            ))}
          </div>

          {pagination && pagination.pages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-1.5">
              {getPageItems(page, pagination.pages).map((p, i) =>
                p === '…' ? (
                  <span key={`gap-${i}`} className="px-1 text-sm text-ink-muted light:text-paper-muted">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => updateParam('page', String(p))}
                    className={`h-8 w-8 rounded-lg text-sm ${
                      p === page
                        ? 'bg-violet-500 text-white'
                        : 'text-ink-muted hover:bg-ink-surface light:text-paper-muted light:hover:bg-paper-surface'
                    }`}
                  >
                    {p}
                  </button>
                )
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
