import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ComingSoon({ title }) {
  const { t } = useTranslation();

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      {/* الرقم نفسه هو العنصر البصري — أوضح وأسرع فهماً من أيقونة عامة */}
      <p
        className="font-display text-[clamp(5rem,18vw,9rem)] font-bold leading-none tracking-tight text-transparent"
        style={{
          backgroundImage:
            'linear-gradient(160deg, var(--color-brand) 0%, color-mix(in oklab, var(--color-brand) 20%, transparent) 100%)',
          WebkitBackgroundClip: 'text',
          backgroundClip: 'text',
        }}
        aria-hidden="true"
      >
        404
      </p>

      <h1 className="mt-4 font-display text-xl font-bold tracking-tight">{title}</h1>
      <p className="mt-3 text-sm leading-relaxed text-muted">{t('comingSoon.body')}</p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link to="/" className="btn btn-primary">
          {t('comingSoon.backHome')}
        </Link>
        <Link to="/explore" className="btn btn-secondary">
          {t('nav.explore')}
        </Link>
      </div>
    </div>
  );
}
