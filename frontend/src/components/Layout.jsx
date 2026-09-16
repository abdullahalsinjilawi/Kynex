import { Outlet, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import Header from './Header';
import Footer from './Footer';

export default function Layout() {
  const location = useLocation();

  // كل ما تتغير الصفحة نرجّع التمرير لفوق — بدون هيك بتفتح الصفحة الجديدة من نص
  // المكان اللي كان واقف فيه المستخدم بالصفحة القديمة
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      {/* رابط تخطّي للكيبورد — أول عنصر بالصفحة، بيبان بس لما يوصله التركيز */}
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-brand focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        تخطّي للمحتوى
      </a>

      <Header />

      <main id="main" key={location.pathname} className="animate-page-in flex-1">
        <Outlet />
      </main>

      <Footer />
    </div>
  );
}
