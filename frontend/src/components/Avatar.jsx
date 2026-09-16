import { avatarColorFor } from '../utils/avatarColor';

const SIZES = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-20 w-20 text-2xl',
};

/**
 * أفاتار موحّد بكل الموقع: نفس المستخدم = نفس اللون دايماً (اللون محسوب من المعرّف).
 * أول ما يصير في صور بروفايل، بيتغيّر هون بس وبينعكس على كل مكان.
 */
export default function Avatar({ name, id, size = 'md', className = '' }) {
  const colors = avatarColorFor(id);
  const letter = (name || '?').trim().charAt(0).toUpperCase();

  return (
    <span
      aria-hidden="true"
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-display font-semibold ${colors.bg} ${colors.text} ${SIZES[size] || SIZES.md} ${className}`}
    >
      {letter}
    </span>
  );
}

/** علامة التوثيق — نفس الشكل بكل مكان بدل ما نكتب ✓ نص عادي مرة ورمز مرة. */
export function VerifiedMark({ className = '', title }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={`h-4 w-4 shrink-0 text-brand ${className}`}
      fill="currentColor"
      role="img"
      aria-label={title}
    >
      <path d="M10 1.5l2.1 1.6 2.6-.2.8 2.5 2.2 1.4-1 2.4 1 2.4-2.2 1.4-.8 2.5-2.6-.2L10 18.5l-2.1-1.6-2.6.2-.8-2.5-2.2-1.4 1-2.4-1-2.4 2.2-1.4.8-2.5 2.6.2L10 1.5z" />
      <path d="M8.9 12.6L6.3 10l1.1-1.1 1.5 1.5 3.7-3.7L13.7 7.8l-4.8 4.8z" fill="#fff" />
    </svg>
  );
}
