import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Avatar from './Avatar';
import { formatCompact } from '../utils/formatNumber';

const CATEGORY_KEYS = {
  'training-code': 'categories.trainingCode',
  'model-architecture': 'categories.modelArchitecture',
  dataset: 'categories.dataset',
  'data-cleaning': 'categories.dataCleaning',
  other: 'categories.other',
};

function StarIcon() {
  return (
    <svg className="h-3.5 w-3.5 fill-gold text-gold" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8-6.2 3.8 1.6-7L2 9.2l7.1-.6L12 2z" />
    </svg>
  );
}

function FileIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M14 3v4h4" />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 4v10m0 0 4-4m-4 4-4-4" />
      <path d="M5 17v1.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V17" />
    </svg>
  );
}

/**
 * بطاقة المشروع.
 *
 * ملاحظة مهمة بالبنية: قبل هيك كان في رابط صاحب المشروع *جوّا* رابط المشروع —
 * وهاد HTML غير صالح (رابط داخل رابط)، وبالمتصفح بيطلع سلوك غريب بالضغط وبالكيبورد.
 * الحل: البطاقة صارت article عادي، ورابط المشروع بيتمدد على كل البطاقة بـ
 * (after:absolute after:inset-0)، ورابط صاحب المشروع فوقه بـ z-10. النتيجة: كل
 * البطاقة قابلة للضغط، بس رابط الصاحب بيشتغل لحاله، وما عاد في تداخل روابط.
 */
export default function ProjectCard({ project, index = 0 }) {
  const { t } = useTranslation();
  const fileCount = project.files?.length || 0;
  const ownerId = project.owner?._id || project.owner?.id;
  const categoryKey = CATEGORY_KEYS[project.category];

  return (
    <article
      style={{ '--card-delay': `${Math.min(index, 8) * 50}ms` }}
      className="group animate-card-in card card-hover relative flex flex-col gap-3.5 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className="badge badge-brand">
          {categoryKey ? t(categoryKey) : project.category}
        </span>
        <span className="flex shrink-0 items-center gap-1 text-xs font-medium text-muted tnum">
          <StarIcon />
          {formatCompact(project.starsCount ?? 0)}
        </span>
      </div>

      <h3 className="text-[17px] font-semibold leading-snug">
        <Link
          to={`/project/${project.slug}`}
          className="transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-brand-light"
        >
          {project.name}
        </Link>
      </h3>

      <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted">
        {project.description}
      </p>

      <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
        <span className="rounded-md border border-line px-2 py-0.5 font-display">
          {project.language}
        </span>
        {project.license?.type && (
          <span className="rounded-md border border-line px-2 py-0.5">{project.license.type}</span>
        )}
      </div>

      <div className="mt-1 flex items-center justify-between gap-3 border-t border-line-soft pt-3.5">
        <Link
          to={`/profile/${ownerId}`}
          className="relative z-10 flex min-w-0 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <Avatar name={project.owner?.name} id={ownerId} size="sm" />
          <span className="truncate">{project.owner?.name}</span>
        </Link>

        <div className="flex shrink-0 items-center gap-3 text-xs text-muted tnum">
          <span className="flex items-center gap-1" title={t('common.fileCount', { count: fileCount })}>
            <FileIcon />
            {fileCount}
          </span>
          <span className="flex items-center gap-1" title={t('projectCard.downloads')}>
            <DownloadIcon />
            {formatCompact(project.downloadsCount ?? 0)}
          </span>
        </div>
      </div>
    </article>
  );
}
