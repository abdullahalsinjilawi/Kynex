import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import apiClient from '../api/client';
import usePolling from '../hooks/usePolling';

export default function Header() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  const loadCounts = () => {
    if (!user) return;
    apiClient.get('/messages/unread-count').then((res) => setUnreadMessages(res.data.unreadCount)).catch(() => {});
    apiClient.get('/notifications/unread-count').then((res) => setUnreadNotifs(res.data.unreadCount)).catch(() => {});
  };

  // تحديث دوري لعدادات الرسائل والإشعارات - هيك بتبان فوراً بدون ما تحدّث الصفحة يدوياً
  usePolling(loadCounts, 15000);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) navigate(`/explore?search=${encodeURIComponent(search.trim())}`);
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar');
  };

  return (
    <header className="sticky top-0 z-40 border-b border-ink-border bg-ink/90 backdrop-blur light:border-paper-border light:bg-paper/90">
      <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-3 sm:px-6">
        {/* الشعار */}
        <Link to="/" className="flex shrink-0 items-center gap-2">
          <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden="true">
            <defs>
              <linearGradient id="headerLogoBg" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#8B6BFF" />
                <stop offset="100%" stopColor="#5B3FD9" />
              </linearGradient>
              <linearGradient id="headerLogoMark" x1="9" y1="6" x2="25" y2="26" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#EAE6FF" />
              </linearGradient>
            </defs>
            <rect width="32" height="32" rx="8" fill="url(#headerLogoBg)" />
            <rect x="9" y="6.5" width="3.4" height="19" rx="1" fill="url(#headerLogoMark)" />
            <polygon points="12.4,15 15.6,15 24,6.5 19.4,6.5" fill="url(#headerLogoMark)" />
            <polygon points="12.4,17 15.6,17 24,25.5 19.4,25.5" fill="url(#headerLogoMark)" />
            <circle cx="25.3" cy="6.5" r="2" fill="#2DD9C7" />
          </svg>
          <span className="hidden font-[Poppins] text-lg font-bold tracking-tight sm:inline">Kynex</span>
        </Link>

        {/* البحث */}
        <form onSubmit={handleSearch} className="relative flex-1">
          <svg
            className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-muted light:text-paper-muted"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            type="text"
            placeholder={t('header.searchPlaceholder')}
            className="w-full rounded-lg border border-ink-border bg-ink-surface py-2 ps-9 pe-3 text-sm outline-none placeholder:text-ink-muted focus:border-violet-500 light:border-paper-border light:bg-paper-surface light:placeholder:text-paper-muted"
          />
        </form>

        {/* تبديل اللغة */}
        <button
          onClick={toggleLanguage}
          className="shrink-0 rounded-lg px-2.5 py-2 text-sm font-medium text-ink-muted hover:bg-ink-surface light:text-paper-muted light:hover:bg-paper-surface"
        >
          {t('header.language')}
        </button>

        {/* تبديل الوضع الليلي/النهاري */}
        <button
          onClick={toggleTheme}
          aria-label={t('header.toggleTheme')}
          className="shrink-0 rounded-lg p-2 text-ink-muted hover:bg-ink-surface light:text-paper-muted light:hover:bg-paper-surface"
        >
          {theme === 'dark' ? (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="4" />
              <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
            </svg>
          ) : (
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />
            </svg>
          )}
        </button>

        {user ? (
          <>
            {/* الرسائل */}
            <Link
              to="/messages"
              className="relative shrink-0 rounded-lg p-2 text-ink-muted hover:bg-ink-surface light:text-paper-muted light:hover:bg-paper-surface"
              aria-label={t('header.messages')}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
              {unreadMessages > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] text-white">
                  {unreadMessages > 9 ? '9+' : unreadMessages}
                </span>
              )}
            </Link>

            {/* جرس الإشعارات */}
            <Link
              to="/notifications"
              className="relative shrink-0 rounded-lg p-2 text-ink-muted hover:bg-ink-surface light:text-paper-muted light:hover:bg-paper-surface"
              aria-label={t('header.notifications')}
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
                <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
              </svg>
              {unreadNotifs > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-violet-500 text-[10px] text-white">
                  {unreadNotifs > 9 ? '9+' : unreadNotifs}
                </span>
              )}
            </Link>

            {/* دائرة الحساب */}
            <div className="relative shrink-0">
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-500 font-mono text-sm font-semibold text-white"
              >
                {user.name?.charAt(0)}
              </button>
              {menuOpen && (
                <div className="absolute end-0 top-11 w-48 overflow-hidden rounded-lg border border-ink-border bg-ink-surface-raised py-1 text-sm shadow-lg light:border-paper-border light:bg-paper-surface">
                  <Link
                    to={`/profile/${user.id}`}
                    className="block px-4 py-2 hover:bg-ink/50 light:hover:bg-paper"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('header.myProfile')}
                  </Link>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 hover:bg-ink/50 light:hover:bg-paper"
                    onClick={() => setMenuOpen(false)}
                  >
                    {t('header.settings')}
                  </Link>
                  {user.role === 'admin' && (
                    <Link
                      to="/admin"
                      className="block px-4 py-2 text-violet-400 hover:bg-ink/50 light:hover:bg-paper"
                      onClick={() => setMenuOpen(false)}
                    >
                      {t('header.adminPanel')}
                    </Link>
                  )}
                  <button
                    onClick={async () => {
                      await logout();
                      setMenuOpen(false);
                      navigate('/');
                    }}
                    className="block w-full px-4 py-2 text-start text-red-500 hover:bg-ink/50 light:hover:bg-paper"
                  >
                    {t('header.logout')}
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/login"
              className="rounded-lg px-3 py-1.5 text-sm font-medium text-ink-muted hover:text-ink-text light:text-paper-muted light:hover:text-paper-text"
            >
              {t('header.login')}
            </Link>
            <Link
              to="/register"
              className="rounded-lg bg-gradient-to-l from-violet-500 to-violet-600 px-3 py-1.5 text-sm font-medium text-white shadow-[0_6px_18px_-6px_var(--color-violet-500)] hover:-translate-y-0.5 transition-transform"
            >
              {t('header.register')}
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}
