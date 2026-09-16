import { createContext, useContext, useEffect, useState } from 'react';
import apiClient from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // عند فتح الموقع، الكوكي بينبعت تلقائياً لو موجود، فبس نتأكد من صحته
  useEffect(() => {
    let cancelled = false;
    const MAX_ATTEMPTS = 3;

    const loadUser = async () => {
      for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        try {
          const res = await apiClient.get('/auth/me');
          if (!cancelled) setUser(res.data.user);
          return;
        } catch (err) {
          const status = err.response?.status;

          // 401/403 يعني السيرفر رد فعلاً وقال صراحة "ما في جلسة صالحة" - هاد تسجيل
          // خروج حقيقي، ما في داعي نعيد المحاولة
          if (status === 401 || status === 403) break;

          // أي خطأ تاني (فشل نتورك، تايم اوت، 500/502/503) غالباً السيرفر عم "يصحى" من
          // نوم Render (cold start) أو عم يعمل redeploy بتلك اللحظة بالضبط. بدل ما نعتبر
          // المستخدم "طالع" فوراً، منعطيه كم ثانية ونعيد المحاولة قبل ما نستسلم
          if (attempt < MAX_ATTEMPTS && !cancelled) {
            await new Promise((r) => setTimeout(r, attempt * 1200));
          }
        }
      }
      if (!cancelled) setUser(null);
    };

    loadUser().finally(() => !cancelled && setLoading(false));

    return () => {
      cancelled = true;
    };
  }, []);

  // ما عاد في توكن نستقبله أو نخزّنه هون - السيرفر بيحطه بكوكي httpOnly تلقائياً
  const login = (userData) => setUser(userData);

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } finally {
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
