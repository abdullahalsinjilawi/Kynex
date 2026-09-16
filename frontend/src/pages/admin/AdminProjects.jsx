import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { ListSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

export default function AdminProjects() {
  const { t } = useTranslation();
  const [projects, setProjects] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiClient
      .get('/admin/projects', { params: { search, limit: 50 } })
      .then((res) => setProjects(res.data.projects))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleToggleHide = async (project) => {
    await apiClient.put(`/admin/projects/${project._id}/hide`);
    load();
  };

  const handleToggleFeature = async (project) => {
    await apiClient.put(`/admin/projects/${project._id}/feature`);
    load();
  };

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('admin.projects.searchPlaceholder')}
        className="input input-sm mb-5 max-w-sm"
      />

      {loading ? (
        <ListSkeleton count={6} />
      ) : projects.length === 0 ? (
        <EmptyState icon="projects" title={t('admin.projects.noResults')} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          {projects.map((p, i) => (
            <div
              key={p._id}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-fg/[0.03] ${
                i !== 0 ? 'border-t border-line' : ''
              }`}
            >
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-1.5">
                  <Link to={`/project/${p.slug}`} className="font-medium hover:text-brand-light">
                    {p.name}
                  </Link>
                  {p.isDeleted && <span className="badge badge-danger">{t('admin.projects.hidden')}</span>}
                  {p.isFeatured && <span className="badge badge-brand">{t('admin.projects.featured')}</span>}
                </p>
                <p className="text-xs text-muted">
                  {p.owner?.name} ({p.owner?.email}) · {t('admin.projects.starsCount', { count: p.starsCount })}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleFeature(p)}
                  className="btn btn-secondary btn-sm"
                >
                  {p.isFeatured ? t('admin.projects.unfeature') : t('admin.projects.feature')}
                </button>
                <button
                  onClick={() => handleToggleHide(p)}
                  className={`btn btn-sm ${p.isDeleted ? 'btn-secondary' : 'btn-danger'}`}
                >
                  {p.isDeleted ? t('admin.projects.show') : t('admin.projects.hide')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
