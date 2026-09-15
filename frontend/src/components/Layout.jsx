import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      {/* key={pathname} بيخلي React يعيد تركيب المحتوى عند تغيّر الصفحة، فتشتغل حركة الدخول من جديد كل مرة */}
      <main key={location.pathname} className="animate-page-in flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
