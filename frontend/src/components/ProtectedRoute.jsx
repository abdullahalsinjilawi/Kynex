import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const { t } = useTranslation();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted">
        <Spinner className="h-6 w-6 text-brand" />
        <p className="text-sm">{t('common.loading')}</p>
      </div>
    );
  }

  // منبعت المسار الحالي مع التحويل حتى بعد تسجيل الدخول يرجع لنفس الصفحة
  // اللي كان رايح عليها، مش للرئيسية
  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }

  return children;
}
