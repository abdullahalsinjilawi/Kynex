import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import Spinner from './Spinner';

// لو تغيّر دور المستخدم بقاعدة البيانات وهو already مسجّل دخول، بيانات الجلسة
// المحفوظة بالواجهة ما بتعرف بالتغيير. هون منتأكد من الصلاحية الحالية من السيرفر
// قبل ما نعرض اللوحة، بدل ما نعتمد على بيانات ممكن تكون قديمة.
export default function AdminRoute({ children }) {
  const { user, setUser, loading: authLoading } = useAuth();
  const { t } = useTranslation();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!user) {
      setChecking(false);
      return;
    }
    apiClient
      .get('/auth/me')
      .then((res) => setUser(res.data.user))
      .finally(() => setChecking(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  if (authLoading || checking) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3 text-muted">
        <Spinner className="h-6 w-6 text-brand" />
        <p className="text-sm">{t('protectedRoute.checking')}</p>
      </div>
    );
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
