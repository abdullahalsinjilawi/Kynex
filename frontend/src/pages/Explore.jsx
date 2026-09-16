import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { ProjectGridSkeleton } from '../components/Skeleton';
import { formatNumber } from '../utils/formatNumber';

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

/**
 * أرقام الصفحات مع "…" حتى ما يطول الصف لو صار في عشرات الصفحات:
 * أول صفحتين، آخر صفحتين، وصفحة قبل وبعد الحالية.
 */
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

  // قيم محلية للحقول النصية حتى ما نبعت طلب لكل حرف (التأخير تحت)
  const [searchInput, setSearchInput] = useState(search);
  const [languageInput, setLanguageInput] = useState(language);
  const [tagsInput, setTagsInput] = useState(tags);

  useEffect(() => setSearchInput(search), [search]);
  useEffect(() => setLanguageInput(language), [language]);
  useEffect(() => setTagsInput(tags), [tags]);

  const updateParam = (key, value) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page'); // أي تغيير بالفلاتر بيرجّعنا لأول صفحة
    setSearchParams(next);
  };

  const clearAll = () => setSearchParams(new URLSearchParams());

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput !== search) updateParam('search', searchInput);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (languageInput !== language) updateParam('language', languageInput);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [languageInput]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (tagsInput !== tags) updateParam('tags', tagsInput);
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tagsInput]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    apiClient
      .get('/projects', { params: { search, category, language, tags, sort, page, limit: 12 } })
      .then((res) => {
        if (cancelled) return;
        setProjects(res.data.projects);
        setPagination(res.data.pagination);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [search, category, language, tags, sort, page]);

  const activeFilters = [
    search && { key: 'search', label: search },
    language && { key: 'language', label: language },
    tags && { key: 'tags', label: tags },
  ].filter(Boolean);

  const total = pagination?.total;

  return (
    <div>
      <PageHeader title={t('explore.title')} description={t('explore.subtitle')}>
        {/* شريط الفلاتر: الفئات كأزرار ظاهرة (مش قائمة منسدلة) لأنها بس 6 خيارات،
            وبتصير الأكثر استخداماً — إظهارها بيوفّر ضغطتين على كل تصفية */}
        <div className="mt-8 flex flex-col gap-4">
          <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:px-0">
            {CATEGORIES.map((item) => (
              <button
                key={item.value || 'all'}
                type="button"
                onClick={() => updateParam('category', item.value)}
                data-active={category === item.value}
                className="chip"
              >
                {t(item.labelKey)}
              </button>
            ))}
          </div>

          <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto] lg:grid-cols-[1.4fr_1fr_1fr_auto]">
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
                placeholder={t('explore.searchPlaceholder')}
                aria-label={t('explore.searchPlaceholder')}
                className="input ps-9"
              />
            </div>

            <input
              type="text"
              value={languageInput}
              onChange={(event) => setLanguageInput(event.target.value)}
              placeholder={t('explore.languagePlaceholder')}
              aria-label={t('explore.languagePlaceholder')}
              className="input"
            />

            <input
              type="text"
              value={tagsInput}
              onChange={(event) => setTagsInput(event.target.value)}
              placeholder={t('explore.tagsPlaceholder')}
              aria-label={t('explore.tagsPlaceholder')}
              className="input"
            />

            <select
              value={sort}
              onChange={(event) => updateParam('sort', event.target.value)}
              aria-label={t('explore.sortLabel')}
              className="input"
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
        {/* الفلاتر الفعّالة — واضحة وقابلة للإزالة وحدة وحدة، بدل ما يحتار المستخدم
            ليش النتايج قليلة */}
        {(activeFilters.length > 0 || category) && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {category && (
              <button type="button" onClick={() => updateParam('category', '')} className="chip" data-active="true">
                {t(CATEGORIES.find((item) => item.value === category)?.labelKey || 'categories.other')}
                <RemoveIcon />
              </button>
            )}
            {activeFilters.map((filter) => (
              <button
                key={filter.key}
                type="button"
                onClick={() => updateParam(filter.key, '')}
                className="chip"
                data-active="true"
              >
                <span className="max-w-[16ch] truncate">{filter.label}</span>
                <RemoveIcon />
              </button>
            ))}
            <button type="button" onClick={clearAll} className="text-sm text-muted transition-colors hover:text-fg">
              {t('explore.clearAll')}
            </button>
          </div>
        )}

        {!loading && total !== undefined && (
          <p className="mb-5 text-sm text-muted">
            {t('explore.resultCount', { formatted: formatNumber(total) })}
          </p>
        )}

        {loading ? (
          <ProjectGridSkeleton count={9} />
        ) : projects.length === 0 ? (
          <EmptyState
            icon="search"
            title={t('explore.empty')}
            description={t('explore.emptyHint')}
            action={{ to: '/explore', label: t('explore.clearAll') }}
          />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {projects.map((project, index) => (
                <ProjectCard key={project._id} project={project} index={index} />
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
                        item === page
                          ? 'bg-brand text-white'
                          : 'text-muted hover:bg-fg/5 hover:text-fg'
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
    </div>
  );
}

function RemoveIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  );
}
