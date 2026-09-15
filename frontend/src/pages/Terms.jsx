import { useTranslation } from 'react-i18next';

export default function Terms() {
  const { t } = useTranslation();
  const sections = [1, 2, 3, 4, 5, 6, 7, 8];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 text-2xl font-semibold">{t('terms.title')}</h1>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-ink-text light:text-paper-text">
        {sections.map((n) => (
          <section key={n}>
            <h2 className="mb-2 text-base font-semibold">{t(`terms.s${n}Title`)}</h2>
            <p className="text-ink-muted light:text-paper-muted">{t(`terms.s${n}Body`)}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
