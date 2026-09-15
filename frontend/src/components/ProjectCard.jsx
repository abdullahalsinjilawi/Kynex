import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { avatarColorFor } from '../utils/avatarColor';

const CATEGORY_KEYS = {
  'training-code': 'categories.trainingCode',
  'model-architecture': 'categories.modelArchitecture',
  dataset: 'categories.dataset',
  'data-cleaning': 'categories.dataCleaning',
  other: 'categories.other',
};

export default function ProjectCard({ project, index = 0 }) {
  const { t } = useTranslation();
  const fileCount = project.files?.length || 0;

  return (
    <Link
      to={`/project/${project.slug}`}
      style={{ '--card-delay': `${Math.min(index, 8) * 60}ms` }}
      className="group animate-card-in relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-ink-border bg-ink-surface p-6 shadow-sm transition-all duration-300 ease-out hover:-translate-y-1 hover:border-violet-500/50 hover:shadow-xl hover:shadow-violet-500/10 light:border-paper-border light:bg-paper-surface"
    >
      {/* خط توهج علوي يبين بس عند hover - لمسة رقي بدون ما يكون صارخ. منخليه يتمدد من
          النص للطرفين (origin-center) بدل ما يعتمد على اتجاه ثابت، حتى يبقى صحيح
          بصرياً بغض النظر عن اتجاه الصفحة (عربي RTL أو إنجليزي LTR) */}
      <span className="absolute inset-x-0 top-0 h-0.5 origin-center scale-x-0 bg-gradient-to-r from-transparent via-violet-400 to-transparent transition-transform duration-500 ease-out group-hover:scale-x-100" />

      {/* فئة المشروع - سياق سريع قبل حتى قراءة الاسم */}
      <span className="w-fit rounded-md bg-violet-500/10 px-2.5 py-1 font-mono text-xs font-medium text-violet-400">
        {CATEGORY_KEYS[project.category] ? t(CATEGORY_KEYS[project.category]) : project.category}
      </span>

      <h3 className="text-lg font-semibold leading-snug text-ink-text transition-colors group-hover:text-violet-400 light:text-paper-text">
        {project.name}
      </h3>

      <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-ink-muted light:text-paper-muted">
        {project.description}
      </p>

      <div className="flex flex-wrap items-center gap-2 font-mono text-xs text-ink-muted light:text-paper-muted">
        <span className="rounded-lg border border-ink-border px-2 py-1 light:border-paper-border">
          {project.language}
        </span>
        <span className="rounded-lg border border-ink-border px-2 py-1 light:border-paper-border">
          {project.license?.type}
        </span>
      </div>

      <div className="flex items-center justify-between border-t border-ink-border pt-4 text-sm text-ink-muted light:border-paper-border light:text-paper-muted">
        <Link
          to={`/profile/${project.owner?._id || project.owner?.id}`}
          onClick={(e) => e.stopPropagation()}
          className="flex items-center gap-2 transition-colors hover:text-violet-400"
        >
          <span className={`flex h-6 w-6 items-center justify-center rounded-full font-mono text-xs font-semibold ${avatarColorFor(project.owner?._id).bg} ${avatarColorFor(project.owner?._id).text}`}>
            {project.owner?.name?.charAt(0)}
          </span>
          {project.owner?.name}
        </Link>

        <div className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4 fill-gold text-gold" viewBox="0 0 24 24">
              <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6L12 2z" />
            </svg>
            {project.starsCount ?? 0}
          </span>
          <span className="flex items-center gap-1" title={t('common.viewCount', { count: project.viewsCount ?? 0 })}>
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            {project.viewsCount ?? 0}
          </span>
          <span>{t('common.fileCount', { count: fileCount })}</span>
        </div>
      </div>
    </Link>
  );
}
