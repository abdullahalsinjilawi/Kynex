import { useTranslation } from 'react-i18next';
import PageHeader from '../components/PageHeader';

const SECTIONS = [1, 2, 3, 4, 5, 6, 7, 8];

export default function Terms() {
  const { t } = useTranslation();

  return (
    <div>
      <PageHeader title={t('terms.title')} description={t('terms.subtitle')} />

      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[220px_1fr]">
        {/* فهرس جانبي — الوثيقة طويلة، فبدون فهرس المستخدم بيضطر يقرأ كلشي ليلاقي بند */}
        <nav className="hidden lg:sticky lg:top-24 lg:block lg:self-start" aria-label={t('terms.tableOfContents')}>
          <p className="mb-3 text-sm font-semibold text-muted">{t('terms.tableOfContents')}</p>
          <ul className="flex flex-col gap-1 text-sm">
            {SECTIONS.map((number) => (
              <li key={number}>
                <a
                  href={`#term-${number}`}
                  className="block rounded-lg px-3 py-2 text-muted transition-colors hover:bg-fg/5 hover:text-fg"
                >
                  {t(`terms.s${number}Title`)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex max-w-2xl flex-col gap-8">
          {SECTIONS.map((number) => (
            <section key={number} id={`term-${number}`} className="scroll-mt-24">
              <h2 className="mb-2 font-display text-lg font-bold tracking-tight">
                {t(`terms.s${number}Title`)}
              </h2>
              <p className="leading-loose text-muted">{t(`terms.s${number}Body`)}</p>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
