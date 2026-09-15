import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Settings() {
  const { user, setUser, logout } = useAuth();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [name, setName] = useState(user?.name || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [hfToken, setHfToken] = useState('');
  const [hasHfToken, setHasHfToken] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [message, setMessage] = useState('');

  const showRestoreBanner = user?.deletedAt || searchParams.get('restore') === '1';

  useEffect(() => {
    apiClient.get('/users/huggingface-token/status').then((res) => setHasHfToken(res.data.hasToken));
    apiClient.get('/users/api-key/status').then((res) => setHasApiKey(res.data.hasApiKey));
  }, []);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    const res = await apiClient.put('/users/profile', { name, bio });
    setUser(res.data.user);
    setMessage(t('settings.profileSaved'));
    setTimeout(() => setMessage(''), 2000);
  };

  const handleSaveToken = async (e) => {
    e.preventDefault();
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
  };

  const handleDeleteAccount = async (e) => {
    e.preventDefault();
    if (!window.confirm(t('settings.confirmDelete'))) return;
    await apiClient.delete('/users/me', { data: { password: deletePassword } });
    logout();
    navigate('/');
  };

  const handleRestoreAccount = async () => {
    await apiClient.post('/users/me/restore');
    setUser({ ...user, deletedAt: null });
  };

  return (
    <div className="mx-auto max-w-xl px-4 py-8 sm:px-6">
      <h1 className="mb-6 text-xl font-semibold">{t('settings.title')}</h1>

      {showRestoreBanner && (
        <div className="mb-6 flex items-center justify-between rounded-lg border border-red-500/30 bg-red-500/10 p-4 text-sm">
          <p>{t('settings.pendingDeletion')}</p>
          <button
            onClick={handleRestoreAccount}
            className="shrink-0 rounded-lg bg-red-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-red-600"
          >
            {t('settings.restoreAccount')}
          </button>
        </div>
      )}

      {/* البروفايل */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-muted light:text-paper-muted">{t('settings.profile')}</h2>
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-3 rounded-xl border border-ink-border p-4 light:border-paper-border">
          <div>
            <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('settings.name')}</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('settings.bio')}</label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
            />
          </div>
          <div className="flex items-center gap-3">
            <button className="self-start rounded-lg bg-violet-500 px-4 py-1.5 text-sm font-medium text-white hover:bg-violet-600">
              {t('common.save')}
            </button>
            {message && <span className="text-xs text-violet-400">{message}</span>}
          </div>
        </form>
      </section>

      {/* توكن HuggingFace */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-muted light:text-paper-muted">{t('settings.hfTokenTitle')}</h2>
        <div className="rounded-xl border border-ink-border p-4 light:border-paper-border">
          <p className="mb-3 text-xs leading-relaxed text-ink-muted light:text-paper-muted">
            {t('settings.hfTokenDesc')}
          </p>
          {hasHfToken ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-violet-400">{t('settings.hfTokenSaved')}</span>
              <button onClick={handleDeleteToken} className="text-xs text-red-400 hover:underline">
                {t('settings.deleteToken')}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSaveToken} className="flex gap-2">
              <input
                type="password"
                value={hfToken}
                onChange={(e) => setHfToken(e.target.value)}
                placeholder="hf_xxxxxxxxxxxx"
                className="flex-1 rounded-lg border border-ink-border bg-ink-surface px-3 py-2 font-mono text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
              />
              <button className="rounded-lg bg-violet-500 px-4 py-2 text-sm font-medium text-white hover:bg-violet-600">
                {t('common.save')}
              </button>
            </form>
          )}
        </div>
      </section>

      {/* API Key */}
      <section className="mb-8">
        <h2 className="mb-3 text-sm font-semibold text-ink-muted light:text-paper-muted">{t('settings.apiKeyTitle')}</h2>
        <div className="rounded-xl border border-ink-border p-4 light:border-paper-border">
          <p className="mb-3 text-xs leading-relaxed text-ink-muted light:text-paper-muted">
            {t('settings.apiKeyDesc')}
          </p>
          {apiKey ? (
            <div className="mb-2 rounded-lg bg-ink-surface p-3 font-mono text-xs light:bg-paper-surface">
              {apiKey}
              <p className="mt-1 text-[11px] text-red-400">{t('settings.apiKeySaveWarning')}</p>
            </div>
          ) : hasApiKey ? (
            <p className="mb-2 text-sm text-violet-400">{t('settings.apiKeyActive')}</p>
          ) : null}
          <button
            onClick={handleGenerateApiKey}
            className="rounded-lg border border-ink-border px-3 py-1.5 text-xs font-medium hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
          >
            {hasApiKey ? t('settings.regenerateApiKey') : t('settings.generateApiKey')}
          </button>
        </div>
      </section>

      {/* حذف الحساب */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-red-400">{t('settings.dangerZone')}</h2>
        <form onSubmit={handleDeleteAccount} className="rounded-xl border border-red-500/30 p-4">
          <p className="mb-3 text-xs leading-relaxed text-ink-muted light:text-paper-muted">
            {t('settings.deleteAccountDesc')}
          </p>
          <div className="flex gap-2">
            <input
              type="password"
              required
              value={deletePassword}
              onChange={(e) => setDeletePassword(e.target.value)}
              placeholder={t('settings.confirmPasswordPlaceholder')}
              className="flex-1 rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-red-500 light:border-paper-border light:bg-paper-surface"
            />
            <button className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 hover:bg-red-500/20">
              {t('settings.deleteAccount')}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}
