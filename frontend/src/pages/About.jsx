import { useTranslation } from 'react-i18next';

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="mx-auto max-w-2xl px-4 py-12 sm:px-6">
      <h1 className="mb-2 text-2xl font-semibold">{t('about.title')}</h1>
      <p className="mb-10 text-sm text-ink-muted light:text-paper-muted">{t('about.subtitle')}</p>

      <div className="flex flex-col gap-8 text-sm leading-relaxed text-ink-text light:text-paper-text">
        <section>
          <h2 className="mb-2 text-base font-semibold text-violet-400">{t('about.whyTitle')}</h2>
          <p>{t('about.whyBody1')}</p>
          <p className="mt-3">{t('about.whyBody2')}</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-violet-400">{t('about.whatTitle')}</h2>
          <p>{t('about.whatBody')}</p>
        </section>

        <section>
          <h2 className="mb-2 text-base font-semibold text-violet-400">{t('about.whoTitle')}</h2>
          <p>
            {t('about.whoBodyPrefix')} <strong>Abdullah Alsinjilawi</strong>
            {t('about.whoBodySuffix')}
          </p>
        </section>
      </div>
    </div>
  );
}
