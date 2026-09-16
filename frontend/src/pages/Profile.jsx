import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import PostCard from '../components/PostCard';
import Tabs from '../components/Tabs';
import EmptyState from '../components/EmptyState';
import Avatar, { VerifiedMark } from '../components/Avatar';
import Block, { ProjectGridSkeleton } from '../components/Skeleton';
import { formatRelativeTime } from '../utils/format';
import { formatNumber } from '../utils/formatNumber';

export default function Profile() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    Promise.all([
      apiClient.get(`/users/${id}`),
      apiClient.get('/projects', { params: { owner: id, limit: 100 } }),
      apiClient.get('/posts', { params: { author: id, limit: 24 } }),
    ])
      .then(([profileRes, projectsRes, postsRes]) => {
        if (cancelled) return;
        setProfile(profileRes.data.user);
        setProjects(projectsRes.data.projects);
        setPosts(postsRes.data.posts || []);
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) {
    return (
      <div>
        <div className="border-b border-line bg-surface/40">
          <div className="mx-auto flex max-w-6xl items-center gap-5 px-4 py-10 sm:px-6">
            <Block className="h-20 w-20 shrink-0 rounded-full" />
            <div className="flex-1 space-y-3">
              <Block className="h-6 w-48" />
              <Block className="h-4 w-64" />
            </div>
          </div>
        </div>
        <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
          <ProjectGridSkeleton count={3} />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <p className="text-base font-semibold">{t('common.userNotFound')}</p>
        <Link to="/explore" className="btn btn-secondary btn-sm mt-5">
          {t('nav.explore')}
        </Link>
      </div>
    );
  }

  const totalStars = projects.reduce((sum, project) => sum + (project.starsCount || 0), 0);
  const totalDownloads = projects.reduce((sum, project) => sum + (project.downloadsCount || 0), 0);
  const isMe = user?.id === (profile._id || id);

  return (
    <div>
      <div className="border-b border-line bg-surface/40">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex min-w-0 items-start gap-5">
              <Avatar name={profile.name} id={profile._id || id} size="xl" />

              <div className="min-w-0">
                <h1 className="flex flex-wrap items-center gap-2 font-display text-2xl font-bold tracking-tight">
                  {profile.name}
                  {profile.verified && (
                    <span className="badge badge-brand">
                      <VerifiedMark title={t('profile.verified')} className="h-3.5 w-3.5" />
                      {t('profile.verified')}
                    </span>
                  )}
                </h1>

                {profile.bio && (
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted">{profile.bio}</p>
                )}

                <p className="mt-3 text-xs text-muted">
                  {t('profile.lastActiveAndJoined', {
                    lastActive: formatRelativeTime(profile.lastActiveAt),
                    joined: formatRelativeTime(profile.createdAt),
                  })}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              {isMe ? (
                <Link to="/settings" className="btn btn-secondary btn-sm">
                  {t('profile.editProfile')}
                </Link>
              ) : (
                <Link to="/messages" className="btn btn-secondary btn-sm">
                  {t('header.messages')}
                </Link>
              )}
            </div>
          </div>

          <div className="mt-8 grid max-w-xl grid-cols-3 divide-x divide-line rounded-2xl border border-line bg-surface rtl:divide-x-reverse">
            <StatCell value={projects.length} label={t('profile.projects')} />
            <StatCell value={totalStars} label={t('profile.totalStars')} />
            <StatCell value={totalDownloads} label={t('profile.totalDownloads')} />
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        {/* تابات: المشاريع ومنشورات المنتدى — بعد ما صار المنتدى قسم أساسي بالمنصة،
            نشاط العضو ما عاد مشاريع بس، فالبروفايل لازم يعكس الاتنين */}
        <Tabs
          tabs={[
            {
              label: t('profile.projects'),
              count: projects.length,
              content:
                projects.length === 0 ? (
                  <EmptyState
                    icon="projects"
                    title={t('profile.empty')}
                    description={isMe ? t('profile.emptyMineHint') : undefined}
                    action={isMe ? { to: '/upload', label: t('nav.upload') } : undefined}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {projects.map((project, index) => (
                      <ProjectCard key={project._id} project={project} index={index} />
                    ))}
                  </div>
                ),
            },
            {
              label: t('profile.posts'),
              count: posts.length,
              content:
                posts.length === 0 ? (
                  <EmptyState
                    icon="comments"
                    title={t('profile.noPosts')}
                    description={isMe ? t('profile.noPostsMineHint') : undefined}
                    action={isMe ? { to: '/forum/new', label: t('forum.newPost') } : undefined}
                  />
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {posts.map((post, index) => (
                      <PostCard key={post._id} post={post} index={index} />
                    ))}
                  </div>
                ),
            },
          ]}
        />
      </div>
    </div>
  );
}

function StatCell({ value, label }) {
  return (
    <div className="px-4 py-5 text-center">
      <p className="font-display text-2xl font-bold tracking-tight tnum">{formatNumber(value)}</p>
      <p className="mt-1 text-xs text-muted">{label}</p>
    </div>
  );
}
