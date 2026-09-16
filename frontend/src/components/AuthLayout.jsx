import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';
import NeuralField from './NeuralField';

function CheckIcon() {
  return (
    <svg className="mt-0.5 h-4 w-4 shrink-0 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m5 12.5 4.5 4.5L19 7" />
    </svg>
  );
}

/**
 * شاشة تسجيل الدخول/الحساب الجديد بتنقسم نصين:
 *  - نص فيه الفورم (هو الأساس، وهو الوحيد اللي بيبان على الموبايل)
 *  - نص فيه هوية المنصة: حقل العُقد + شو بتاخد لما تسجّل
 * الفكرة إنو صفحة الدخول تحس إنها جزء من منتج، مش فورم معلّق بنص صفحة بيضا.
 */
export default function AuthLayout({ title, subtitle, children, footer }) {
  const { t } = useTranslation();

  const points = [t('auth.side.point1'), t('auth.side.point2'), t('auth.side.point3')];

  return (
    <div className="grid min-h-[calc(100vh-4rem)] lg:grid-cols-2">
      {/* ------------------------------ الفورم ------------------------------ */}
      <div className="flex items-center justify-center px-4 py-12 sm:px-8">
        <div className="w-full max-w-sm">
          <Link to="/" className="mb-8 inline-flex lg:hidden">
            <Logo size={34} withWordmark />
          </Link>

          <h1 className="font-display text-2xl font-bold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-2 text-sm leading-relaxed text-muted">{subtitle}</p>}

          <div className="mt-8">{children}</div>

          {footer && <div className="mt-8 text-center text-sm text-muted">{footer}</div>}
        </div>
      </div>

      {/* --------------------------- لوحة الهوية --------------------------- */}
      <div className="relative hidden overflow-hidden border-s border-line bg-surface/40 lg:block">
        <div
          className="absolute inset-0"
          style={{
            maskImage: 'radial-gradient(85% 75% at 50% 45%, #000 30%, transparent 80%)',
            WebkitMaskImage: 'radial-gradient(85% 75% at 50% 45%, #000 30%, transparent 80%)',
          }}
        >
          <NeuralField density={0.7} pointer={false} />
        </div>

        <div className="relative flex h-full flex-col justify-center px-14 py-16">
          <Logo size={40} withWordmark />

          <p className="mt-8 max-w-[28ch] font-display text-3xl font-bold leading-snug tracking-tight">
            {t('auth.side.headline')}
          </p>

          <ul className="mt-10 flex max-w-sm flex-col gap-4">
            {points.map((point) => (
              <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted">
                <CheckIcon />
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
