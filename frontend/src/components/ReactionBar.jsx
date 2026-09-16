import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { REACTIONS, REACTION_MAP } from '../utils/postMeta';

/**
 * شريط التفاعلات.
 *
 * تفاعل واحد لكل مستخدم: نفس النوع = إلغاء، نوع تاني = تبديل (نفس منطق الباك اند).
 * العرض متفائل (optimistic): بنحدّث الواجهة فوراً وبنرجّع الحالة السابقة لو فشل الطلب،
 * لأنو زر تفاعل بستنى رد سيرفر بيحسّ ميت.
 *
 * بشكله المختصر (compact) بيعرض الزر الأساسي بس + العدد، وبينفتح باقي الأنواع
 * بالضغط على زر "+" — هيك ما بياكل مساحة بالبطاقات وبالتعليقات.
 */
export default function ReactionBar({
  myReaction,
  count = 0,
  breakdown,
  onReact,
  disabled = false,
  compact = false,
  size = 'md',
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onPointerDown = (event) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target)) setOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  const handle = (type) => {
    setOpen(false);
    if (disabled) return;
    onReact?.(type);
  };

  const active = myReaction ? REACTION_MAP[myReaction] : null;
  const pad = size === 'sm' ? 'h-7 px-2 text-xs' : 'h-9 px-3 text-sm';

  // الشكل الكامل: كل الأنواع ظاهرة (صفحة المنشور)
  if (!compact) {
    return (
      <div className="flex flex-wrap items-center gap-1.5">
        {REACTIONS.map((reaction) => {
          const isActive = myReaction === reaction.key;
          const reactionCount = breakdown?.[reaction.key] || 0;
          return (
            <button
              key={reaction.key}
              type="button"
              onClick={() => handle(reaction.key)}
              disabled={disabled}
              title={t(reaction.labelKey)}
              aria-pressed={isActive}
              className={[
                'inline-flex items-center gap-1.5 rounded-full border transition-all duration-150',
                pad,
                'disabled:cursor-not-allowed disabled:opacity-50',
                isActive
                  ? 'border-brand/50 bg-brand/12 text-fg'
                  : 'border-line bg-surface text-muted hover:border-line hover:bg-elevated hover:text-fg',
              ].join(' ')}
            >
              <span aria-hidden="true" className="text-base leading-none">
                {reaction.emoji}
              </span>
              {reactionCount > 0 && <span className="tnum font-medium">{reactionCount}</span>}
            </button>
          );
        })}
      </div>
    );
  }

  // الشكل المختصر: زر واحد + منتقي ينفتح فوقه
  return (
    <div ref={wrapRef} className="relative inline-flex items-center gap-1">
      <button
        type="button"
        onClick={() => handle(myReaction || 'like')}
        disabled={disabled}
        aria-pressed={!!myReaction}
        title={active ? t(active.labelKey) : t('forum.reactions.like')}
        className={[
          'inline-flex items-center gap-1.5 rounded-full border transition-colors',
          pad,
          'disabled:cursor-not-allowed disabled:opacity-50',
          myReaction
            ? 'border-brand/50 bg-brand/12 text-fg'
            : 'border-line bg-surface text-muted hover:bg-elevated hover:text-fg',
        ].join(' ')}
      >
        <span aria-hidden="true" className="text-sm leading-none">
          {active ? active.emoji : '👍'}
        </span>
        <span className="tnum font-medium">{count}</span>
      </button>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-label={t('forum.reactions.more')}
        aria-expanded={open}
        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-line text-muted transition-colors hover:bg-elevated hover:text-fg disabled:cursor-not-allowed disabled:opacity-50"
      >
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 6v12M6 12h12" />
        </svg>
      </button>

      {open && (
        <div className="absolute bottom-full z-20 mb-2 flex gap-1 rounded-full border border-line bg-elevated p-1 shadow-lg">
          {REACTIONS.map((reaction) => (
            <button
              key={reaction.key}
              type="button"
              onClick={() => handle(reaction.key)}
              title={t(reaction.labelKey)}
              className={[
                'inline-flex h-8 w-8 items-center justify-center rounded-full text-base transition-transform hover:scale-115',
                myReaction === reaction.key ? 'bg-brand/15' : 'hover:bg-surface',
              ].join(' ')}
            >
              <span aria-hidden="true">{reaction.emoji}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
