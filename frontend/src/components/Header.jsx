import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../api/client';
import usePolling from '../hooks/usePolling';
import Logo from './Logo';
import Avatar from './Avatar';

/* أيقونات خطية بنفس السماكة (1.8) — مصدر واحد بدل ما كل زر يرسم أيقونته بطريقته */
const icon = 'h-[18px] w-[18px]';

function SearchIcon({ className = icon }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="7" />
      <path d="m20.5 20.5-4-4" />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 9a6 6 0 1 1 12 0c0 5.2 2 7 2 7H4s2-1.8 2-7Z" />
      <path d="M10.2 20a2 2 0 0 0 3.6 0" />
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 14.5a2.5 2.5 0 0 1-2.5 2.5H8l-4 3.5v-15A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5Z" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4.2" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M20.5 13.4A8.5 8.5 0 1 1 10.6 3.5a7 7 0 0 0 9.9 9.9Z" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5" />
      <path d="M4 16.5V18a2.5 2.5 0 0 0 2.5 2.5h11A2.5 2.5 0 0 0 20 18v-1.5" />
    </svg>
  );
}

function navClass({ isActive }) {
  return [
    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive ? 'text-fg' : 'text-muted hover:text-fg',
  ].join(' ');
}

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();

  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);       // قائمة الحساب
  const [mobileOpen, setMobileOpen] = useState(false);   // قائمة الموبايل
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const accountRef = useRef(null);

  const loadCounts = () => {
    if (!user) return;
    apiClient.get('/messages/unread-count').then((res) => setUnreadMessages(res.data.unreadCount)).catch(() => {});
    apiClient.get('/notifications/unread-count').then((res) => setUnreadNotifs(res.data.unreadCount)).catch(() => {});
  };

  usePolling(loadCounts, 15000);

  // إغلاق القوائم عند تغيّر الصفحة — بدون هيك بتضل القائمة مفتوحة فوق الصفحة الجديدة
  useEffect(() => {
    setMenuOpen(false);
    setMobileOpen(false);
  }, [location.pathname]);

  // إغلاق قائمة الحساب بالضغط برّاها أو بزر Escape
  useEffect(() => {
    if (!menuOpen) return undefined;
    const onPointerDown = (event) => {
      if (accountRef.current && !accountRef.current.contains(event.target)) setMenuOpen(false);
    };
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('pointerdown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [menuOpen]);

  // منع تمرير الخلفية وقت ما تكون قائمة الموبايل مفتوحة
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileOpen]);

  const handleSearch = (event) => {
    event.preventDefault();
    if (search.trim()) navigate(`/explore?search=${encodeURIComponent(search.trim())}`);
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language?.startsWith('ar') ? 'en' : 'ar');
  };

  const handleLogout = async () => {
    await logout();
    setMenuOpen(false);
    navigate('/');
  };

  const navLinks = (
    <>
      <NavLink to="/explore" className={navClass}>
        {t('nav.explore')}
      </NavLink>
      <NavLink to="/forum" className={navClass}>
        {t('nav.forum')}
      </NavLink>
      <NavLink to="/upload" className={navClass}>
        {t('nav.upload')}
      </NavLink>
      <NavLink to="/about" className={navClass}>
        {t('nav.about')}
      </NavLink>
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-line glass">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-2 px-4 sm:px-6">
        <Link to="/" className="shrink-0" aria-label="Kynex">
          <Logo size={32} withWordmark />
        </Link>

        <nav className="ms-4 hidden items-center gap-0.5 lg:flex">{navLinks}</nav>

        {/* البحث — بياخد المساحة الفاضية بالنص على الشاشات المتوسطة وفوق */}
        <form onSubmit={handleSearch} className="relative mx-auto hidden w-full max-w-sm md:block" role="search">
          <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            type="search"
            aria-label={t('header.searchPlaceholder')}
            placeholder={t('header.searchPlaceholder')}
            className="input input-sm ps-9 pe-3"
          />
        </form>

        <div className="ms-auto flex items-center gap-1 md:ms-0">
          <button
            onClick={toggleLanguage}
            className="btn btn-ghost btn-sm font-display"
            aria-label={t('header.switchLanguage')}
          >
            {t('header.language')}
          </button>

          <button onClick={toggleTheme} aria-label={t('header.toggleTheme')} className="icon-btn">
            {theme === 'dark' ? <SunIcon /> : <MoonIcon />}
          </button>

          {user ? (
            <>
              <Link to="/messages" className="icon-btn relative hidden sm:inline-flex" aria-label={t('header.messages')}>
                <MessageIcon />
                {unreadMessages > 0 && <Badge value={unreadMessages} />}
              </Link>

              <Link to="/notifications" className="icon-btn relative hidden sm:inline-flex" aria-label={t('header.notifications')}>
                <BellIcon />
                {unreadNotifs > 0 && <Badge value={unreadNotifs} />}
              </Link>

              <Link to="/upload" className="btn btn-primary btn-sm ms-1 hidden lg:inline-flex">
                <UploadIcon />
                {t('nav.upload')}
              </Link>

              <div className="relative ms-1" ref={accountRef}>
                <button
                  onClick={() => setMenuOpen((open) => !open)}
                  className="flex items-center rounded-full ring-offset-2 ring-offset-canvas transition-shadow hover:ring-2 hover:ring-brand/60"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                  aria-label={t('header.accountMenu')}
                >
                  <Avatar name={user.name} id={user.id} size="md" />
                </button>

                {menuOpen && (
                  <div
                    role="menu"
                    className="absolute end-0 top-12 w-56 overflow-hidden rounded-2xl border border-line bg-elevated shadow-[var(--shadow-pop)]"
                  >
                    <div className="border-b border-line-soft px-4 py-3">
                      <p className="truncate text-sm font-semibold">{user.name}</p>
                      <p className="truncate text-xs text-muted">{user.email}</p>
                    </div>
                    <div className="py-1 text-sm">
                      <MenuLink to={`/profile/${user.id}`}>{t('header.myProfile')}</MenuLink>
                      <MenuLink to="/messages">
                        <span className="flex w-full items-center justify-between gap-2">
                          {t('header.messages')}
                          {unreadMessages > 0 && <span className="badge badge-brand tnum">{unreadMessages}</span>}
                        </span>
                      </MenuLink>
                      <MenuLink to="/notifications">
                        <span className="flex w-full items-center justify-between gap-2">
                          {t('header.notifications')}
                          {unreadNotifs > 0 && <span className="badge badge-brand tnum">{unreadNotifs}</span>}
                        </span>
                      </MenuLink>
                      <MenuLink to="/settings">{t('header.settings')}</MenuLink>
                      {user.role === 'admin' && (
                        <MenuLink to="/admin" className="text-brand-light">
                          {t('header.adminPanel')}
                        </MenuLink>
                      )}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="block w-full border-t border-line-soft px-4 py-2.5 text-start text-sm text-danger transition-colors hover:bg-danger/10"
                    >
                      {t('header.logout')}
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="hidden items-center gap-2 sm:flex">
              <Link to="/login" className="btn btn-ghost btn-sm">
                {t('header.login')}
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                {t('header.register')}
              </Link>
            </div>
          )}

          {/* زر قائمة الموبايل */}
          <button
            onClick={() => setMobileOpen((open) => !open)}
            className="icon-btn lg:hidden"
            aria-label={mobileOpen ? t('header.closeMenu') : t('header.openMenu')}
            aria-expanded={mobileOpen}
          >
            <svg className={icon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {mobileOpen ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {/* قائمة الموبايل */}
      {mobileOpen && (
        <div className="border-t border-line bg-canvas lg:hidden">
          <div className="mx-auto max-w-6xl px-4 py-4 sm:px-6">
            <form onSubmit={handleSearch} className="relative mb-4 md:hidden" role="search">
              <SearchIcon className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                type="search"
                aria-label={t('header.searchPlaceholder')}
                placeholder={t('header.searchPlaceholder')}
                className="input ps-9"
              />
            </form>

            <nav className="flex flex-col gap-1">
              <NavLink to="/" end className={navClass}>
                {t('nav.home')}
              </NavLink>
              {navLinks}
            </nav>

            {user ? (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line-soft pt-4">
                <Link to="/messages" className="btn btn-secondary btn-sm">
                  {t('header.messages')}
                  {unreadMessages > 0 && <span className="badge badge-brand tnum">{unreadMessages}</span>}
                </Link>
                <Link to="/notifications" className="btn btn-secondary btn-sm">
                  {t('header.notifications')}
                  {unreadNotifs > 0 && <span className="badge badge-brand tnum">{unreadNotifs}</span>}
                </Link>
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-2 gap-2 border-t border-line-soft pt-4">
                <Link to="/login" className="btn btn-secondary">
                  {t('header.login')}
                </Link>
                <Link to="/register" className="btn btn-primary">
                  {t('header.register')}
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function Badge({ value }) {
  return (
    <span className="absolute -top-0.5 -end-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-brand px-1 font-display text-[10px] font-bold text-white tnum">
      {value > 9 ? '9+' : value}
    </span>
  );
}

function MenuLink({ to, children, className = '' }) {
  return (
    <Link
      to={to}
      role="menuitem"
      className={`block px-4 py-2.5 transition-colors hover:bg-brand/10 ${className}`}
    >
      {children}
    </Link>
  );
}
