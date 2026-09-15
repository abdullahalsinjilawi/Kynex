import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';

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
        className="mb-4 w-full max-w-sm rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
      />

      {loading ? (
        <p className="text-sm text-ink-muted light:text-paper-muted">{t('common.loading')}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-border light:border-paper-border">
          {projects.map((p, i) => (
            <div
              key={p._id}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm ${
                i !== 0 ? 'border-t border-ink-border light:border-paper-border' : ''
              }`}
            >
              <div>
                <Link to={`/project/${p.slug}`} className="font-medium hover:text-violet-400">
                  {p.name}
                </Link>
                {p.isDeleted && <span className="ms-2 text-xs text-red-400">{t('admin.projects.hidden')}</span>}
                {p.isFeatured && <span className="ms-2 text-xs text-violet-400">{t('admin.projects.featured')}</span>}
                <p className="text-xs text-ink-muted light:text-paper-muted">
                  {p.owner?.name} ({p.owner?.email}) · {t('admin.projects.starsCount', { count: p.starsCount })}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleToggleFeature(p)}
                  className="rounded-lg border border-ink-border px-2.5 py-1 text-xs hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
                >
                  {p.isFeatured ? t('admin.projects.unfeature') : t('admin.projects.feature')}
                </button>
                <button
                  onClick={() => handleToggleHide(p)}
                  className={`rounded-lg px-2.5 py-1 text-xs ${
                    p.isDeleted
                      ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                      : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                  }`}
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
