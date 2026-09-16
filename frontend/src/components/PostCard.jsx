import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Avatar, { VerifiedMark } from './Avatar';
import { postTypeOf } from '../utils/postMeta';
import { formatCompact } from '../utils/formatNumber';
import { formatRelativeTime } from '../utils/format';

function CommentIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 13.5a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5V6.5A2.5 2.5 0 0 1 7.5 4h10A2.5 2.5 0 0 1 20 6.5Z" />
    </svg>
  );
}

function SparkIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 3.5 13.7 9l5.5 1.7-5.5 1.7L12 18l-1.7-5.6L4.8 10.7 10.3 9Z" />
    </svg>
  );
}

function PinIcon() {
  return (
    <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 3.5h6l-.8 5 3.3 3.2H6.5L9.8 8.5Z" />
      <path d="M12 11.7V20.5" />
    </svg>
  );
}

/**
 * بطاقة منشور بالمنتدى.
 *
 * نفس حل تداخل الروابط المستخدم ببطاقة المشروع: البطاقة article، ورابط العنوان
 * بيتمدد على كلها (after:inset-0)، ورابط الكاتب والوسوم فوقه بـ z-10 حتى يشتغلوا
 * لحالهم بدون رابط-جوّا-رابط (HTML غير صالح + سلوك كيبورد غريب).
 */
export default function PostCard({ post, index = 0, variant = 'default' }) {
  const { t } = useTranslation();
  const type = postTypeOf(post.type);
  const authorId = post.author?._id || post.author?.id;
  const compact = variant === 'compact';

  return (
    <article
      style={{ '--card-delay': `${Math.min(index, 8) * 50}ms` }}
      className="group animate-card-in card card-hover relative flex flex-col gap-3 p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <span className={`badge gap-1.5 border ${type.chip}`}>
          <type.Icon className="h-3.5 w-3.5" aria-hidden="true" />
          {t(type.labelKey)}
        </span>

        <div className="flex shrink-0 items-center gap-2 text-xs text-muted">
          {post.isPinned && (
            <span className="inline-flex items-center gap-1 text-brand-light" title={t('forum.pinned')}>
              <PinIcon />
            </span>
          )}
          <time dateTime={post.createdAt}>{formatRelativeTime(post.createdAt)}</time>
        </div>
      </div>

      <h3 className={compact ? 'text-[15px] font-semibold leading-snug' : 'text-[17px] font-semibold leading-snug'}>
        <Link
          to={`/forum/${post.slug}`}
          className="transition-colors after:absolute after:inset-0 after:content-[''] group-hover:text-brand-light"
        >
          {post.title}
        </Link>
      </h3>

      {!compact && post.excerpt && (
        <p className="line-clamp-2 flex-1 text-sm leading-relaxed text-muted">{post.excerpt}</p>
      )}

      {!compact && post.tags?.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5">
          {post.tags.slice(0, 3).map((tag) => (
            <Link
              key={tag}
              to={`/forum?tag=${encodeURIComponent(tag)}`}
              className="relative z-10 rounded-md border border-line px-2 py-0.5 font-display text-xs text-muted transition-colors hover:border-brand/40 hover:text-fg"
            >
              #{tag}
            </Link>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between gap-3 border-t border-line-soft pt-3.5">
        <Link
          to={`/profile/${authorId}`}
          className="relative z-10 flex min-w-0 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"
        >
          <Avatar name={post.author?.name} id={authorId} size="sm" />
          <span className="truncate">{post.author?.name}</span>
          {post.author?.verified && <VerifiedMark className="h-3.5 w-3.5" title={t('common.verified')} />}
        </Link>

        <div className="flex shrink-0 items-center gap-3 text-xs text-muted tnum">
          <span className="flex items-center gap-1" title={t('forum.reactionsCount')}>
            <SparkIcon />
            {formatCompact(post.reactionsCount ?? 0)}
          </span>
          <span className="flex items-center gap-1" title={t('forum.commentsCount')}>
            <CommentIcon />
            {formatCompact(post.commentsCount ?? 0)}
          </span>
        </div>
      </div>
    </article>
  );
}
