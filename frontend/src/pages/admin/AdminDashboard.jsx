import { useTranslation } from 'react-i18next';
import Tabs from '../../components/Tabs';
import PageHeader from '../../components/PageHeader';
import AdminUsers from './AdminUsers';
import AdminProjects from './AdminProjects';
import AdminPosts from './AdminPosts';
import AdminReports from './AdminReports';

export default function AdminDashboard() {
  const { t } = useTranslation();
  return (
    <div className="animate-page-in">
      <PageHeader title={t('admin.dashboard.title')} description={t('admin.dashboard.subtitle')} />

      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <Tabs
        tabs={[
          { label: t('admin.tabs.users'), content: <AdminUsers /> },
          { label: t('admin.tabs.projects'), content: <AdminProjects /> },
          { label: t('admin.tabs.posts'), content: <AdminPosts /> },
          { label: t('admin.tabs.reports'), content: <AdminReports /> },
        ]}
      />
      </div>
    </div>
  );
}
