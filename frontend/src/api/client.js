import axios from 'axios';
import i18n from '../i18n';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  // ضروري حتى ينبعت الكوكي (اللي فيه الـ JWT) تلقائياً مع كل طلب، حتى لو الباك اند
  // على دومين مختلف بالإنتاج (Render بيحط الفرونت والباك اند على دومينين منفصلين)
  withCredentials: true,
});

// نبعت لغة الواجهة الحالية مع كل طلب (X-Lang) حتى رسائل الباك اند (أخطاء، إشعارات)
// ترجع بنفس لغة المستخدم بدل ما تضل عربي دايماً بغض النظر عن اللغة المختارة بالواجهة
apiClient.interceptors.request.use((config) => {
  config.headers['X-Lang'] = i18n.language?.startsWith('en') ? 'en' : 'ar';
  return config;
});

export default apiClient;
