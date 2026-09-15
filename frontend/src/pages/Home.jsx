import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import { ProjectGridSkeleton } from '../components/Skeleton';
import { avatarColorFor } from '../utils/avatarColor';
import { formatRelativeTime } from '../utils/format';

export default function Home() {
  const { t } = useTranslation();
  const [featuredData, setFeaturedData] = useState(null);
  const [latestProjects, setLatestProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [recentMembers, setRecentMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      apiClient.get('/projects/featured'),
      apiClient.get('/projects?limit=9&sort=newest'),
      apiClient.get('/projects/stats'),
      apiClient.get('/users/recent?limit=8'),
    ])
      .then(([featuredRes, latestRes, statsRes, membersRes]) => {
        setFeaturedData(featuredRes.data);
        setLatestProjects(latestRes.data.projects);
        setStats(statsRes.data.stats);
        setRecentMembers(membersRes.data.users);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const trending = featuredData?.trending?.slice(0, 6) || [];

  return (
    <div className="relative mx-auto max-w-6xl overflow-hidden px-4 py-10 sm:px-6">
      {/* توهج خلفي هادئ - زخرفة بس، ما بتأثر على أي عنصر تفاعلي */}
      <div
        aria-hidden="true"
        className="animate-float-slow pointer-events-none absolute -top-20 end-0 h-80 w-80 rounded-full bg-violet-500/20 blur-[110px]"
      />
      <div
        aria-hidden="true"
        className="animate-float-slow-reverse pointer-events-none absolute top-52 -start-10 h-64 w-64 rounded-full bg-cyan-500/10 blur-[110px]"
      />

      {/* Hero */}
      <section className="relative mb-12 grid gap-10 pt-4 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
        <div className="max-w-xl">
          <h1 className="mb-4 font-[var(--font-display)] text-3xl font-bold leading-[1.2] tracking-tight sm:text-4xl">
            {t('home.heroTitle')}
          </h1>
          <p className="mb-7 text-base leading-relaxed text-ink-muted light:text-paper-muted">
            {t('home.heroSubtitle')}
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/explore"
              className="rounded-lg bg-gradient-to-l from-violet-500 to-violet-600 px-5 py-2.5 text-sm font-medium text-white shadow-[0_8px_24px_-8px_var(--color-violet-500)] transition-transform hover:-translate-y-0.5 hover:shadow-[0_10px_28px_-6px_var(--color-violet-500)]"
            >
              {t('home.exploreProjects')}
            </Link>
            <Link
              to="/upload"
              className="rounded-lg border border-ink-border px-5 py-2.5 text-sm font-medium hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
            >
              {t('home.uploadYours')}
            </Link>
          </div>
        </div>

        {/* زخرفة شبكة عُقد - نفس هوية الشعار (بنفسجي + لمسة سماوية)، توحي بشبكة
            عصبية/نماذج مترابطة بدل بلوبات ضبابية عامة ما إلها علاقة بموضوع المنصة */}
        <div className="relative hidden h-64 lg:block" aria-hidden="true">
          <svg viewBox="0 0 400 260" className="h-full w-full overflow-visible">
            <g className="text-violet-400/60" stroke="currentColor" strokeWidth="1.5" fill="none">
              <line x1="60" y1="180" x2="160" y2="110" />
              <line x1="160" y1="110" x2="150" y2="30" />
              <line x1="160" y1="110" x2="270" y2="70" />
              <line x1="270" y1="70" x2="340" y2="140" />
              <line x1="60" y1="180" x2="180" y2="220" />
              <line x1="180" y1="220" x2="270" y2="70" />
            </g>
            <circle cx="60" cy="180" r="6" className="fill-violet-500" />
            <circle cx="160" cy="110" r="9" className="fill-violet-400" />
            <circle cx="150" cy="30" r="5" className="fill-violet-500/70" />
            <circle cx="270" cy="70" r="7" className="fill-violet-500" />
            <circle cx="340" cy="140" r="6" className="fill-cyan-500" />
            <circle cx="180" cy="220" r="5" className="fill-cyan-400" />
          </svg>
        </div>
      </section>

      {/* شريط إحصائيات المجتمع - رقم حي بيدي إحساس "فيه ناس فعلاً هون" من أول نظرة،
          بدل ما الصفحة تبلش بشبكة مشاريع بس بدون أي سياق عن حجم المجتمع */}
      {stats && (stats.projectsCount > 0 || stats.membersCount > 0) && (
        <section className="mb-14 grid grid-cols-3 divide-x divide-ink-border rounded-2xl border border-ink-border light:divide-paper-border light:border-paper-border rtl:divide-x-reverse">
          {[
            { value: stats.projectsCount, label: t('home.stats.projects') },
            { value: stats.membersCount, label: t('home.stats.members') },
            { value: stats.starsCount, label: t('home.stats.stars') },
          ].map((item) => (
            <div key={item.label} className="px-4 py-5 text-center sm:px-6">
              <p className="font-[var(--font-display)] text-2xl font-bold text-violet-400 sm:text-3xl">
                {item.value.toLocaleString()}
              </p>
              <p className="mt-1 text-xs text-ink-muted light:text-paper-muted">{item.label}</p>
            </div>
          ))}
        </section>
      )}

      {loading ? (
        <ProjectGridSkeleton count={6} />
      ) : (
        <>
          {/* الترند */}
          {trending.length > 0 && (
            <section className="mb-14">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('home.trending')}</h2>
                <Link to="/explore?sort=most-starred" className="text-sm text-violet-400 hover:underline">
                  {t('home.viewAll')}
                </Link>
              </div>
              <div className="no-scrollbar -mx-4 flex gap-5 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {trending.map((project, i) => (
                  <div key={project._id} className="w-80 shrink-0">
                    <ProjectCard project={project} index={i} />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* أحدث المشاريع */}
          <section className="mb-14">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold">{t('home.latest')}</h2>
              <Link to="/explore" className="text-sm text-violet-400 hover:underline">
                {t('home.viewAll')}
              </Link>
            </div>

            {latestProjects.length === 0 ? (
              <EmptyState icon="projects" title={t('home.empty')} />
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {latestProjects.map((project, i) => (
                  <ProjectCard key={project._id} project={project} index={i} />
                ))}
              </div>
            )}
          </section>

          {/* أحدث الأعضاء - بتخلي الصفحة الرئيسية تحس فيها ناس حقيقية عم تنضم، مو بس
              أرشيف مشاريع ثابت */}
          {recentMembers.length > 0 && (
            <section>
              <h2 className="mb-4 text-lg font-semibold">{t('home.latestMembers.title')}</h2>
              <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
                {recentMembers.map((member) => {
                  const colors = avatarColorFor(member.id);
                  return (
                    <Link
                      key={member.id}
                      to={`/profile/${member.id}`}
                      className="flex w-40 shrink-0 flex-col items-center gap-2 rounded-xl border border-ink-border p-4 text-center transition-colors hover:border-violet-500/50 light:border-paper-border"
                    >
                      <span className={`flex h-12 w-12 items-center justify-center rounded-full font-mono text-lg font-semibold ${colors.bg} ${colors.text}`}>
                        {member.name?.charAt(0)}
                      </span>
                      <span className="flex items-center gap-1 truncate text-sm font-medium">
                        {member.name}
                        {member.verified && <span className="shrink-0 text-violet-400">✓</span>}
                      </span>
                      <span className="text-xs text-ink-muted light:text-paper-muted">
                        {t('home.latestMembers.joined', { time: formatRelativeTime(member.createdAt) })}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
