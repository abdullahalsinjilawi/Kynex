import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import Block, { ProjectGridSkeleton } from '../components/Skeleton';
import { formatRelativeTime } from '../utils/format';
import { avatarColorFor } from '../utils/avatarColor';

export default function Profile() {
  const { id } = useParams();
  const { t } = useTranslation();
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get(`/users/${id}`),
      apiClient.get('/projects', { params: { owner: id, limit: 100 } }),
    ])
      .then(([profileRes, projectsRes]) => {
        setProfile(profileRes.data.user);
        setProjects(projectsRes.data.projects);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex items-start gap-4">
          <Block className="h-16 w-16 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Block className="h-6 w-40" />
            <Block className="h-4 w-64" />
          </div>
        </div>
        <ProjectGridSkeleton count={3} />
      </div>
    );
  }

  if (!profile) {
    return <div className="p-10 text-center text-sm text-ink-muted light:text-paper-muted">{t('common.userNotFound')}</div>;
  }

  const totalStars = projects.reduce((sum, p) => sum + (p.starsCount || 0), 0);

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-8 flex items-start gap-4">
        <span className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full font-mono text-xl font-semibold ${avatarColorFor(profile._id || id).bg} ${avatarColorFor(profile._id || id).text}`}>
          {profile.name?.charAt(0)}
        </span>
        <div>
          <h1 className="mb-1 flex items-center gap-2 text-xl font-semibold">
            {profile.name}
            {profile.verified && (
              <span className="rounded-full bg-violet-500/15 px-2 py-0.5 text-xs font-medium text-violet-400">
                {t('profile.verified')}
              </span>
            )}
          </h1>
          {profile.bio && (
            <p className="mb-2 text-sm text-ink-muted light:text-paper-muted">{profile.bio}</p>
          )}
          <p className="text-xs text-ink-muted light:text-paper-muted">
            {t('profile.lastActiveAndJoined', {
              lastActive: formatRelativeTime(profile.lastActiveAt),
              joined: formatRelativeTime(profile.createdAt),
            })}
          </p>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-ink-border p-4 light:border-paper-border">
          <p className="mb-1 text-xs text-ink-muted light:text-paper-muted">{t('profile.projects')}</p>
          <p className="font-mono text-2xl font-semibold">{projects.length}</p>
        </div>
        <div className="rounded-xl border border-ink-border p-4 light:border-paper-border">
          <p className="mb-1 text-xs text-ink-muted light:text-paper-muted">{t('profile.totalStars')}</p>
          <p className="font-mono text-2xl font-semibold">{totalStars}</p>
        </div>
      </div>

      <h2 className="mb-4 text-lg font-semibold">{t('profile.projects')}</h2>
      {projects.length === 0 ? (
        <EmptyState icon="projects" title={t('profile.empty')} />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project, i) => (
            <ProjectCard key={project._id} project={project} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
