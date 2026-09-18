import axios from 'axios';
import i18n from '../i18n';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // ضروري حتى ينبعت الكوكي (اللي فيه الـ JWT) تلقائياً مع كل طلب، حتى لو الباك اند
  // على دومين مختلف بالإنتاج (Render بيحط الفرونت والباك اند على دومينين منفصلين)
  withCredentials: true,
});

// fallback: بعض المتصفحات (Safari ITP، وبشكل متزايد Chrome/Firefox) بترفض تخزين
// أو إرسال كوكي cross-site حتى لو مضبوط صح (sameSite=none + secure)، لأنو
// *.onrender.com معتبر "public suffix" فبيعتبروا الفرونت والباك اند مواقع منفصلة.
// فبنخزن نفس التوكن هون كمان ونبعته كـ Authorization header - الباك اند (middleware
// protect) أصلاً بيقبل الاثنين. sessionStorage عشان يضل موجود بعد refresh للصفحة.
let authToken = sessionStorage.getItem('authToken') || null;

export const setAuthToken = (token) => {
  authToken = token || null;
  if (token) {
    sessionStorage.setItem('authToken', token);
  } else {
    sessionStorage.removeItem('authToken');
  }
};

// نبعت لغة الواجهة الحالية مع كل طلب (X-Lang) حتى رسائل الباك اند (أخطاء، إشعارات)
// ترجع بنفس لغة المستخدم بدل ما تضل عربي دايماً بغض النظر عن اللغة المختارة بالواجهة
apiClient.interceptors.request.use((config) => {
  config.headers['X-Lang'] = i18n.language?.startsWith('en') ? 'en' : 'ar';
  if (authToken) {
    config.headers['Authorization'] = `Bearer ${authToken}`;
  }
  return config;
});

export default apiClient;
