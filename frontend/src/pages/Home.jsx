import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import ProjectCard from '../components/ProjectCard';
import EmptyState from '../components/EmptyState';
import NeuralField from '../components/NeuralField';
import PostCard from '../components/PostCard';
import Reveal from '../components/Reveal';
import { ProjectGridSkeleton } from '../components/Skeleton';
import { formatNumber } from '../utils/formatNumber';

/* ------------------------------ أيقونات الفئات ----------------------------- */
/* كل فئة إلها أيقونة بتوصف شو فيها فعلياً (جدول بيانات، سطر أوامر، طبقات نموذج،
   فلتر تنظيف) — مش نفس الأيقونة بأربع ألوان. */

const CATEGORY_ICONS = {
  dataset: (
    <>
      <ellipse cx="12" cy="6" rx="7" ry="3" />
      <path d="M5 6v6c0 1.7 3.1 3 7 3s7-1.3 7-3V6" />
      <path d="M5 12v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6" />
    </>
  ),
  'training-code': (
    <>
      <rect x="3" y="4" width="18" height="16" rx="3" />
      <path d="m7.5 10 2.5 2.5-2.5 2.5M12.5 15h4" />
    </>
  ),
  'model-architecture': (
    <>
      <circle cx="5.5" cy="12" r="2" />
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="18.5" cy="12" r="2" />
      <path d="m7.3 11 3-3.6M7.3 13l3 3.6M13.8 7.4l3 3.2M13.8 16.6l3-3.2" />
    </>
  ),
  'data-cleaning': (
    <>
      <path d="M4 5h16l-6.2 7.3V19l-3.6-2v-4.7z" />
      <path d="M18 17.5h3M19.5 16v3" />
    </>
  ),
};

const CATEGORIES = [
  { key: 'dataset', labelKey: 'categories.dataset', descKey: 'home.categoryCards.dataset' },
  { key: 'training-code', labelKey: 'categories.trainingCode', descKey: 'home.categoryCards.trainingCode' },
  { key: 'model-architecture', labelKey: 'categories.modelArchitecture', descKey: 'home.categoryCards.modelArchitecture' },
  { key: 'data-cleaning', labelKey: 'categories.dataCleaning', descKey: 'home.categoryCards.dataCleaning' },
];

/* -------------------------------- الصفحة -------------------------------- */

export default function Home() {
  const { t } = useTranslation();
  const { user } = useAuth();

  const [trending, setTrending] = useState([]);
  const [latestProjects, setLatestProjects] = useState([]);
  const [stats, setStats] = useState(null);
  const [forumPosts, setForumPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    Promise.all([
      apiClient.get('/projects/featured'),
      apiClient.get('/projects?limit=6&sort=newest'),
      apiClient.get('/projects/stats'),
      apiClient.get('/posts/highlights'),
    ])
      .then(([featuredRes, latestRes, statsRes, forumRes]) => {
        if (cancelled) return;
        // لو الإدارة مميّزة مشاريع يدوياً منعرضها، وإلا منرجع للأكثر نجوماً
        const highlighted = featuredRes.data?.featured?.length
          ? featuredRes.data.featured
          : featuredRes.data?.trending || [];
        setTrending(highlighted.slice(0, 6));
        setLatestProjects(latestRes.data.projects);
        setStats(statsRes.data.stats);
        // الأكثر تفاعلاً أولاً، وبنكمّل بالأحدث لو المنتدى لسه جديد وما فيه تفاعل
        const highlights = [...(forumRes.data.top || []), ...(forumRes.data.latest || [])];
        const unique = highlights.filter(
          (post, index) => highlights.findIndex((p) => p._id === post._id) === index
        );
        setForumPosts(unique.slice(0, 3));
      })
      .catch(() => {})
      .finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  const hasStats = stats && (stats.projectsCount > 0 || stats.membersCount > 0);

  return (
    <div>
      {/* ==================== 1) البطل ==================== */}
      <section className="relative overflow-hidden border-b border-line">
        {/* حقل العُقد: هو نفسه موضوع المنصة (نماذج مترابطة + مجتمع)، مش زخرفة عامة.
            محطوط ورا المحتوى وبيتلاشى من الأطراف حتى ما يزاحم النص. */}
        <div
          className="absolute inset-0 -z-10"
          style={{
            maskImage:
              'radial-gradient(120% 90% at 50% 40%, #000 35%, transparent 78%)',
            WebkitMaskImage:
              'radial-gradient(120% 90% at 50% 40%, #000 35%, transparent 78%)',
          }}
        >
          <NeuralField />
        </div>

        {/* توهج خفيف ورا النص حتى يضل مقروء فوق الحقل */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 -z-10"
          style={{
            background:
              'radial-gradient(70% 55% at 22% 45%, color-mix(in oklab, var(--color-canvas) 88%, transparent) 0%, transparent 70%)',
          }}
        />

        <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 sm:px-6 sm:pb-20 sm:pt-28">
          <div className="max-w-[46rem]">
            <h1 className="font-display text-[clamp(2rem,5.2vw,3.4rem)] font-bold leading-[1.15] tracking-tight">
              {t('home.heroTitle')}
            </h1>

            <p className="mt-5 max-w-[54ch] text-base leading-loose text-muted sm:text-lg">
              {t('home.heroSubtitle')}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/explore" className="btn btn-primary btn-lg">
                {t('home.exploreProjects')}
              </Link>
              <Link to={user ? '/upload' : '/register'} className="btn btn-secondary btn-lg">
                {user ? t('home.uploadYours') : t('home.joinNow')}
              </Link>
            </div>

            {/* أرقام المجتمع — دليل إنو في ناس وشغل هون فعلاً، من أول شاشة */}
            {hasStats && (
              <dl className="mt-12 flex flex-wrap items-center gap-x-10 gap-y-6">
                <Stat value={stats.projectsCount} label={t('home.stats.projects')} />
                <Stat value={stats.membersCount} label={t('home.stats.members')} />
                <Stat value={stats.starsCount} label={t('home.stats.stars')} />
              </dl>
            )}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        {/* ==================== 2) الفئات ==================== */}
        <section className="py-16">
          <SectionHead title={t('home.browseByCategory')} description={t('home.categoryHint')} />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIES.map((category) => (
              <Link
                key={category.key}
                to={`/explore?category=${category.key}`}
                className="card card-hover group flex flex-col gap-3 p-5"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand/10 text-brand-light transition-colors group-hover:bg-brand/20">
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {CATEGORY_ICONS[category.key]}
                  </svg>
                </span>
                <h3 className="font-semibold">{t(category.labelKey)}</h3>
                <p className="text-sm leading-relaxed text-muted">{t(category.descKey)}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* ==================== 3) الأكثر تميزاً ==================== */}
        {loading ? (
          <section className="pb-16">
            <SectionHead title={t('home.trending')} />
            <ProjectGridSkeleton count={3} />
          </section>
        ) : (
          trending.length > 0 && (
            <section className="pb-16">
              <SectionHead title={t('home.trending')} description={t('home.trendingHint')} to="/explore?sort=most-starred" linkLabel={t('home.viewAll')} />
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {trending.slice(0, 3).map((project, index) => (
                  <ProjectCard key={project._id} project={project} index={index} />
                ))}
              </div>
            </section>
          )
        )}

        {/* ==================== 4) أحدث المشاريع ==================== */}
        {!loading && (
          <section className="pb-16">
            <SectionHead title={t('home.latest')} to="/explore" linkLabel={t('home.viewAll')} />

            {latestProjects.length === 0 ? (
              <EmptyState
                icon="projects"
                title={t('home.empty')}
                description={t('home.emptyHint')}
                action={{ to: user ? '/upload' : '/register', label: t('home.uploadYours') }}
              />
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {latestProjects.map((project, index) => (
                  <ProjectCard key={project._id} project={project} index={index} />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ==================== 5) كيف بتشتغل ==================== */}
        {/* هون الترقيم منطقي لأنو فعلاً تسلسل خطوات، مش تزيين */}
        <Reveal>
          <section className="border-t border-line py-16">
            <SectionHead title={t('home.how.title')} description={t('home.how.subtitle')} />

            <ol className="grid gap-5 md:grid-cols-3">
              {[1, 2, 3].map((step, index) => (
                <li key={step} className="relative panel p-6">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand/15 font-display text-sm font-bold text-brand-light tnum">
                    {step}
                  </span>
                  <h3 className="mt-4 font-semibold">{t(`home.how.step${step}Title`)}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {t(`home.how.step${step}Body`)}
                  </p>

                  {/* خط بيوصل الخطوة بالخطوة اللي بعدها — بيبان بس على الشاشات الكبيرة */}
                  {index < 2 && (
                    <span
                      aria-hidden="true"
                      className="absolute top-10 -start-3 hidden h-px w-6 bg-line md:block"
                    />
                  )}
                </li>
              ))}
            </ol>
          </section>
        </Reveal>

        {/* ==================== 6) من المنتدى ==================== */}
        {forumPosts.length > 0 && (
          <section className="border-t border-line py-16">
            <SectionHead
              title={t('home.forum.title')}
              description={t('home.forum.subtitle')}
              to="/forum"
              linkLabel={t('home.forum.link')}
            />

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {forumPosts.map((post, index) => (
                <PostCard key={post._id} post={post} index={index} />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* ==================== 7) دعوة للانضمام ==================== */}
      {!user && (
        <section className="mx-auto max-w-6xl px-4 pb-4 sm:px-6">
          <div className="relative overflow-hidden rounded-3xl border border-line bg-surface px-6 py-14 text-center sm:px-12">
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 opacity-70"
              style={{
                background:
                  'radial-gradient(60% 120% at 50% 0%, color-mix(in oklab, var(--color-brand) 22%, transparent), transparent 70%)',
              }}
            />
            <div className="relative">
              <h2 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
                {t('home.cta.title')}
              </h2>
              <p className="mx-auto mt-3 max-w-[46ch] text-sm leading-relaxed text-muted sm:text-base">
                {t('home.cta.body')}
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-3">
                <Link to="/register" className="btn btn-primary btn-lg">
                  {t('home.cta.primary')}
                </Link>
                <Link to="/about" className="btn btn-secondary btn-lg">
                  {t('home.cta.secondary')}
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}

/* ------------------------------- عناصر مساعدة ------------------------------ */

function Stat({ value, label }) {
  return (
    <div className="flex items-baseline gap-2.5">
      <dt className="sr-only">{label}</dt>
      <dd className="font-display text-3xl font-bold tracking-tight tnum">{formatNumber(value)}</dd>
      <span className="text-sm text-muted">{label}</span>
    </div>
  );
}

function SectionHead({ title, description, to, linkLabel }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="section-title">{title}</h2>
        {description && <p className="mt-1.5 text-sm text-muted">{description}</p>}
      </div>
      {to && (
        <Link to={to} className="link-brand shrink-0 text-sm font-medium">
          {linkLabel}
        </Link>
      )}
    </div>
  );
}
