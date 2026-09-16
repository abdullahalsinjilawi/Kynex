import { useId } from 'react';

/**
 * شعار Kynex: حرف K مبني من عمود وشعاعين، مع عقدة سماوية على طرف الشعاع العلوي —
 * نفس فكرة حقل العُقد بالصفحة الرئيسية (عقدة + وصلات)، فالهوية بتضل متسقة من
 * الأيقونة الصغيرة لخلفية الـ hero.
 *
 * useId ضروري: بدونه كل نسخة من الشعار بالصفحة بتستخدم نفس معرّف التدرّج،
 * وبتصير النسخة التانية بتاخد تدرّج الأولى (باگ بيصير بالهيدر + الفوتر سوا).
 */
export default function Logo({ size = 32, withWordmark = false, className = '' }) {
  const id = useId();
  const bgId = `kynex-bg-${id}`;
  const markId = `kynex-mark-${id}`;

  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        viewBox="0 0 32 32"
        width={size}
        height={size}
        className="shrink-0"
        role="img"
        aria-label="Kynex"
      >
        <defs>
          <linearGradient id={bgId} x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#8b6bff" />
            <stop offset="100%" stopColor="#5b3fd9" />
          </linearGradient>
          <linearGradient id={markId} x1="9" y1="6" x2="25" y2="26" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="100%" stopColor="#eae6ff" />
          </linearGradient>
        </defs>
        <rect width="32" height="32" rx="9" fill={`url(#${bgId})`} />
        <rect x="9" y="6.5" width="3.4" height="19" rx="1.2" fill={`url(#${markId})`} />
        <polygon points="12.4,15 15.6,15 24,6.5 19.4,6.5" fill={`url(#${markId})`} />
        <polygon points="12.4,17 15.6,17 24,25.5 19.4,25.5" fill={`url(#${markId})`} />
        <circle cx="25.3" cy="6.5" r="2.1" fill="#2dd9c7" />
      </svg>

      {withWordmark && (
        <span className="font-display text-lg font-bold tracking-tight">Kynex</span>
      )}
    </span>
  );
}
