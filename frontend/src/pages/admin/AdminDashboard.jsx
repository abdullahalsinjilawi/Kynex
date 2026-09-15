import { useTranslation } from 'react-i18next';
import Tabs from '../../components/Tabs';
import AdminUsers from './AdminUsers';
import AdminProjects from './AdminProjects';
import AdminReports from './AdminReports';

export default function AdminDashboard() {
  const { t } = useTranslation();
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-semibold">{t('admin.dashboard.title')}</h1>
      <p className="mb-6 text-sm text-ink-muted light:text-paper-muted">
        {t('admin.dashboard.subtitle')}
      </p>

      <Tabs
        tabs={[
          { label: t('admin.tabs.users'), content: <AdminUsers /> },
          { label: t('admin.tabs.projects'), content: <AdminProjects /> },
          { label: t('admin.tabs.reports'), content: <AdminReports /> },
        ]}
      />
    </div>
  );
}
