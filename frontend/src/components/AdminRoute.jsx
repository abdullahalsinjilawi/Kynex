import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

// لو غيّرت role المستخدم بقاعدة البيانات يدوياً وهو already مسجل دخول بالمتصفح،
// بيانات الجلسة المحفوظة بالـ React state ما بتنعرف تلقائياً بالتغيير. هون منتأكد
// من صلاحيات المستخدم *الحقيقية والحالية* مباشرة من السيرفر قبل ما نقرر نعرض الصفحة أو لأ،
// بدل ما نعتمد بس على بيانات ممكن تكون قديمة من وقت آخر تسجيل دخول
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
    return <div className="p-10 text-center text-sm text-ink-muted light:text-paper-muted">{t('protectedRoute.checking')}</div>;
  }

  if (!user || user.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return children;
}
