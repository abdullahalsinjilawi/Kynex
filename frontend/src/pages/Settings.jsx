import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import FormError from '../components/FormError';
import Spinner from '../components/Spinner';

const SECTIONS = [
  { id: 'profile', labelKey: 'settings.profile' },
  { id: 'username', labelKey: 'settings.usernameTitle' },
  { id: 'huggingface', labelKey: 'settings.hfTokenTitle' },
  { id: 'api-key', labelKey: 'settings.apiKeyTitle' },
  { id: 'danger', labelKey: 'settings.dangerZone' },
];

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState('');

  const [username, setUsername] = useState(user?.username || '');
  const [savingUsername, setSavingUsername] = useState(false);
  const [usernameMessage, setUsernameMessage] = useState('');
  const [usernameError, setUsernameError] = useState('');

  const [hfToken, setHfToken] = useState('');
  const [hasHfToken, setHasHfToken] = useState(false);

  const [apiKey, setApiKey] = useState(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [copied, setCopied] = useState(false);

  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const showRestoreBanner = user?.deletedAt || searchParams.get('restore') === '1';

  useEffect(() => {
    apiClient.get('/users/huggingface-token/status').then((res) => setHasHfToken(res.data.hasToken)).catch(() => {});
    apiClient.get('/users/api-key/status').then((res) => setHasApiKey(res.data.hasApiKey)).catch(() => {});
  }, []);

  const handleSaveProfile = async (event) => {
    event.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiClient.put('/users/profile', { name, bio });
      setUser(res.data.user);
      setProfileMessage(t('settings.profileSaved'));
      setTimeout(() => setProfileMessage(''), 2500);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveUsername = async (event) => {
    event.preventDefault();
    setUsernameError('');
    setSavingUsername(true);
    try {
      const res = await apiClient.put('/users/username', { username });
      setUser(res.data.user);
      setUsernameMessage(t('settings.usernameSaved'));
      setTimeout(() => setUsernameMessage(''), 2500);
    } catch (err) {
      setUsernameError(err.response?.data?.message || t('settings.usernameSaveError'));
    } finally {
      setSavingUsername(false);
    }
  };

  const handleSaveToken = async (event) => {
    event.preventDefault();
    if (!hfToken) return;
    await apiClient.put('/users/huggingface-token', { token: hfToken });
    setHasHfToken(true);
    setHfToken('');
  };

  const handleDeleteToken = async () => {
    await apiClient.delete('/users/huggingface-token');
    setHasHfToken(false);
  };

  const handleGenerateApiKey = async () => {
    const res = await apiClient.post('/users/api-key');
    setApiKey(res.data.apiKey);
    setHasApiKey(true);
    setCopied(false);
  };

  const handleCopyApiKey = async () => {
    try {
      await navigator.clipboard.writeText(apiKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* لو المتصفح رفض النسخ، المفتاح ظاهر قدامه وبيقدر ينسخه يدوياً */
    }
  };

  const handleDeleteAccount = async (event) => {
    event.preventDefault();
    setDeleteError('');
    if (!window.confirm(t('settings.confirmDelete'))) return;
    try {
      await apiClient.delete('/users/me', { data: { password: deletePassword } });
      logout();
      navigate('/');
    } catch (err) {
      setDeleteError(err.response?.data?.message || t('auth.genericError'));
    }
  };

  const handleRestoreAccount = async () => {
    await apiClient.post('/users/me/restore');
    setUser({ ...user, deletedAt: null });
  };

  return (
    <div>
      <PageHeader title={t('settings.title')} description={t('settings.subtitle')} />

      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[220px_1fr]">
        {/* فهرس الأقسام — الإعدادات صفحة طويلة، فمنخلي الأقسام واضحة من أول نظرة */}
        <nav className="hidden lg:sticky lg:top-24 lg:block lg:self-start">
          <ul className="flex flex-col gap-1 text-sm">
            {SECTIONS.map((section) => (
              <li key={section.id}>
                <a
                  href={`#${section.id}`}
                  className={`block rounded-lg px-3 py-2 transition-colors hover:bg-fg/5 ${
                    section.id === 'danger' ? 'text-danger' : 'text-muted hover:text-fg'
                  }`}
                >
                  {t(section.labelKey)}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex max-w-2xl flex-col gap-8">
          {showRestoreBanner && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-danger/30 bg-danger/10 p-4 text-sm">
              <p className="text-danger">{t('settings.pendingDeletion')}</p>
              <button onClick={handleRestoreAccount} className="btn btn-danger btn-sm">
                {t('settings.restoreAccount')}
              </button>
            </div>
          )}

          {/* ------------------------------ البروفايل ------------------------------ */}
          <section id="profile" className="panel scroll-mt-24 p-6">
            <h2 className="section-title mb-1">{t('settings.profile')}</h2>
            <p className="mb-6 text-sm text-muted">{t('settings.profileDesc')}</p>

            <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
              <div>
                <label className="field-label" htmlFor="settings-name">
                  {t('settings.name')}
                </label>
                <input
                  id="settings-name"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="field-label" htmlFor="settings-bio">
                  {t('settings.bio')}
                </label>
                <textarea
                  id="settings-bio"
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  rows={3}
                  maxLength={280}
                  className="input"
                />
                <p className="mt-1.5 text-xs text-muted tnum">{bio.length}/280</p>
              </div>

              <div className="flex items-center gap-3">
                <button disabled={savingProfile} className="btn btn-primary self-start">
                  {savingProfile && <Spinner />}
                  {t('common.save')}
                </button>
                {profileMessage && (
                  <span role="status" className="text-sm text-success">
                    {profileMessage}
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* --------------------------- اسم المستخدم --------------------------- */}
          <section id="username" className="panel scroll-mt-24 p-6">
            <h2 className="section-title mb-1">{t('settings.usernameTitle')}</h2>
            <p className="mb-6 text-sm leading-relaxed text-muted">{t('settings.usernameDesc')}</p>

            {!user?.username && (
              <p className="mb-4 rounded-xl border border-gold/40 bg-gold/10 px-4 py-3 text-sm text-gold">
                {t('settings.usernameMissingWarning')}
              </p>
            )}

            <form onSubmit={handleSaveUsername} className="flex flex-col gap-4">
              <div>
                <label className="field-label" htmlFor="settings-username">
                  {t('settings.usernameTitle')}
                </label>
                <input
                  id="settings-username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value.toLowerCase())}
                  dir="ltr"
                  pattern="[a-z0-9_-]{3,30}"
                  placeholder={t('auth.register.usernamePlaceholder')}
                  className="input"
                />
                <p className="mt-1.5 text-xs text-muted">{t('auth.register.usernameHint')}</p>
              </div>

              <FormError>{usernameError}</FormError>

              <div className="flex items-center gap-3">
                <button disabled={savingUsername} className="btn btn-primary self-start">
                  {savingUsername && <Spinner />}
                  {t('common.save')}
                </button>
                {usernameMessage && (
                  <span role="status" className="text-sm text-success">
                    {usernameMessage}
                  </span>
                )}
              </div>
            </form>
          </section>

          {/* --------------------------- توكن HuggingFace --------------------------- */}
          <section id="huggingface" className="panel scroll-mt-24 p-6">
            <h2 className="section-title mb-1">{t('settings.hfTokenTitle')}</h2>
            <p className="mb-6 text-sm leading-relaxed text-muted">{t('settings.hfTokenDesc')}</p>

            {hasHfToken ? (
              <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
                <span className="flex items-center gap-2 text-sm text-success">
                  <CheckCircle />
                  {t('settings.hfTokenSaved')}
                </span>
                <button onClick={handleDeleteToken} className="btn btn-ghost btn-sm text-danger">
                  {t('settings.deleteToken')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSaveToken} className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  value={hfToken}
                  onChange={(event) => setHfToken(event.target.value)}
                  placeholder="hf_xxxxxxxxxxxx"
                  aria-label={t('settings.hfTokenTitle')}
                  dir="ltr"
                  className="input flex-1 font-mono"
                />
                <button className="btn btn-primary">{t('common.save')}</button>
              </form>
            )}
          </section>

          {/* ------------------------------- API Key ------------------------------- */}
          <section id="api-key" className="panel scroll-mt-24 p-6">
            <h2 className="section-title mb-1">{t('settings.apiKeyTitle')}</h2>
            <p className="mb-6 text-sm leading-relaxed text-muted">{t('settings.apiKeyDesc')}</p>

            {apiKey && (
              <div className="mb-4 rounded-xl border border-gold/40 bg-gold/10 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <code dir="ltr" className="break-all font-mono text-xs">
                    {apiKey}
                  </code>
                  <button onClick={handleCopyApiKey} className="btn btn-secondary btn-sm">
                    {copied ? t('settings.copied') : t('settings.copy')}
                  </button>
                </div>
                <p className="mt-2 text-xs text-gold">{t('settings.apiKeySaveWarning')}</p>
              </div>
            )}

            {!apiKey && hasApiKey && (
              <p className="mb-4 flex items-center gap-2 text-sm text-success">
                <CheckCircle />
                {t('settings.apiKeyActive')}
              </p>
            )}

            <button onClick={handleGenerateApiKey} className="btn btn-secondary btn-sm">
              {hasApiKey ? t('settings.regenerateApiKey') : t('settings.generateApiKey')}
            </button>
          </section>

          {/* ---------------------------- منطقة الخطر ---------------------------- */}
          <section id="danger" className="scroll-mt-24 rounded-2xl border border-danger/30 p-6">
            <h2 className="section-title mb-1 text-danger">{t('settings.dangerZone')}</h2>
            <p className="mb-6 text-sm leading-relaxed text-muted">{t('settings.deleteAccountDesc')}</p>

            <form onSubmit={handleDeleteAccount} className="flex flex-col gap-3">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="password"
                  required
                  value={deletePassword}
                  onChange={(event) => setDeletePassword(event.target.value)}
                  placeholder={t('settings.confirmPasswordPlaceholder')}
                  aria-label={t('settings.confirmPasswordPlaceholder')}
                  autoComplete="current-password"
                  className="input flex-1"
                />
                <button className="btn btn-danger">{t('settings.deleteAccount')}</button>
              </div>
              <FormError>{deleteError}</FormError>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}

function CheckCircle() {
  return (
    <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12.2 2.4 2.4 4.6-4.9" />
    </svg>
  );
}
