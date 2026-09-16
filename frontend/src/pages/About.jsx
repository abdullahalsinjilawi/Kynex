import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import NeuralField from '../components/NeuralField';

export default function About() {
  const { t } = useTranslation();

  return (
    <div>
      <section className="relative overflow-hidden border-b border-line">
        <div
          className="absolute inset-0 -z-10"
          style={{
            maskImage: 'radial-gradient(100% 80% at 60% 30%, #000 20%, transparent 75%)',
            WebkitMaskImage: 'radial-gradient(100% 80% at 60% 30%, #000 20%, transparent 75%)',
          }}
        >
          <NeuralField density={0.6} pointer={false} />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <h1 className="max-w-3xl font-display text-[clamp(1.9rem,4.5vw,2.9rem)] font-bold leading-[1.2] tracking-tight">
            {t('about.title')}
          </h1>
          <p className="mt-4 max-w-[54ch] text-base leading-loose text-muted">{t('about.subtitle')}</p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
        <div className="flex flex-col gap-12">
          <section>
            <h2 className="section-title mb-4">{t('about.whyTitle')}</h2>
            <p className="leading-loose text-muted">{t('about.whyBody1')}</p>
            <p className="mt-4 leading-loose text-muted">{t('about.whyBody2')}</p>
          </section>

          <section>
            <h2 className="section-title mb-4">{t('about.whatTitle')}</h2>
            <p className="leading-loose text-muted">{t('about.whatBody')}</p>
          </section>

          <section className="panel p-6">
            <h2 className="section-title mb-4">{t('about.whoTitle')}</h2>
            <p className="leading-loose text-muted">
              {t('about.whoBodyPrefix')}{' '}
              <strong className="font-semibold text-fg">Abdullah Alsinjilawi</strong>
              {t('about.whoBodySuffix')}
            </p>
          </section>
        </div>

        <div className="mt-14 flex flex-wrap gap-3 border-t border-line pt-10">
          <Link to="/explore" className="btn btn-primary">
            {t('nav.explore')}
          </Link>
          <Link to="/terms" className="btn btn-secondary">
            {t('footer.terms')}
          </Link>
        </div>
      </div>
    </div>
  );
}
