import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Logo from './Logo';

export default function Footer() {
  const { t } = useTranslation();
  const year = new Date().getFullYear();

  const columns = [
    {
      title: t('footer.platform'),
      links: [
        { to: '/explore', label: t('nav.explore') },
        { to: '/forum', label: t('nav.forum') },
        { to: '/upload', label: t('nav.upload') },
        { to: '/explore?sort=most-starred', label: t('footer.topProjects') },
      ],
    },
    {
      title: t('footer.categories'),
      links: [
        { to: '/explore?category=dataset', label: t('categories.dataset') },
        { to: '/explore?category=training-code', label: t('categories.trainingCode') },
        { to: '/explore?category=model-architecture', label: t('categories.modelArchitecture') },
      ],
    },
    {
      title: t('footer.platformInfo'),
      links: [
        { to: '/about', label: t('footer.about') },
        { to: '/terms', label: t('footer.terms') },
      ],
    },
  ];

  return (
    <footer className="mt-24 border-t border-line bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div className="max-w-xs">
            <Link to="/" className="inline-block">
              <Logo size={30} withWordmark />
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-muted">{t('footer.blurb')}</p>
          </div>

          {columns.map((column) => (
            <div key={column.title}>
              <h2 className="mb-3 text-sm font-semibold">{column.title}</h2>
              <ul className="flex flex-col gap-2.5 text-sm text-muted">
                {column.links.map((link) => (
                  <li key={link.to + link.label}>
                    <Link to={link.to} className="transition-colors hover:text-fg">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line-soft pt-6 text-xs text-muted">
          <p className="tnum">© {year} Kynex</p>
          <p>{t('footer.builtBy')}</p>
        </div>
      </div>
    </footer>
  );
}
