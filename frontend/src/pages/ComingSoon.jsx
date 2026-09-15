import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function ComingSoon({ title }) {
  const { t } = useTranslation();
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-violet-500/15 font-mono text-violet-400">
        …
      </span>
      <h1 className="mb-2 text-lg font-semibold">{title}</h1>
      <p className="text-sm text-ink-muted light:text-paper-muted">{t('comingSoon.body')}</p>
      <Link to="/" className="mt-6 text-sm text-violet-400 hover:underline">
        {t('comingSoon.backHome')}
      </Link>
    </div>
  );
}
