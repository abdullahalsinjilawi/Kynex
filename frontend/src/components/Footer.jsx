import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-16 border-t border-ink-border light:border-paper-border">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-xs text-ink-muted sm:px-6 light:text-paper-muted">
        <p className="font-mono">Kynex — {t('footer.tagline')}</p>
        <div className="flex gap-4">
          <Link to="/about" className="hover:text-violet-400">
            {t('footer.about')}
          </Link>
          <Link to="/terms" className="hover:text-violet-400">
            {t('footer.terms')}
          </Link>
          <Link to="/explore" className="hover:text-violet-400">
            {t('footer.explore')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
