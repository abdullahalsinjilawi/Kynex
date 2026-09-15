import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { formatRelativeTime } from '../../utils/format';

export default function AdminUsers() {
  const { t } = useTranslation();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    apiClient
      .get('/admin/users', { params: { search, limit: 50 } })
      .then((res) => setUsers(res.data.users))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    const timeout = setTimeout(load, 300); // debounce بسيط للبحث
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleToggleBan = async (user) => {
    const ban = !user.isBanned;
    const reason = ban ? window.prompt(t('admin.users.banReasonPrompt')) || '' : '';
    await apiClient.put(`/admin/users/${user._id}/ban`, { ban, reason });
    load();
  };

  const handleToggleVerify = async (user) => {
    await apiClient.put(`/admin/users/${user._id}/verify`);
    load();
  };

  return (
    <div>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder={t('admin.users.searchPlaceholder')}
        className="mb-4 w-full max-w-sm rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
      />

      {loading ? (
        <p className="text-sm text-ink-muted light:text-paper-muted">{t('common.loading')}</p>
      ) : (
        <div className="overflow-hidden rounded-xl border border-ink-border light:border-paper-border">
          {users.map((u, i) => (
            <div
              key={u._id}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm ${
                i !== 0 ? 'border-t border-ink-border light:border-paper-border' : ''
              }`}
            >
              <div>
                <p className="flex items-center gap-2 font-medium">
                  {u.name}
                  {u.verified && <span className="text-xs text-violet-400">{t('admin.users.verified')}</span>}
                  {u.isBanned && <span className="text-xs text-red-400">{t('admin.users.banned')}</span>}
                  {u.role === 'admin' && (
                    <span className="text-xs text-ink-muted light:text-paper-muted">{t('admin.users.adminRole')}</span>
                  )}
                </p>
                <p className="text-xs text-ink-muted light:text-paper-muted">
                  {u.email} · {t('admin.users.joinedPrefix')} {formatRelativeTime(u.createdAt)}
                </p>
              </div>

              {u.role !== 'admin' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleVerify(u)}
                    className="rounded-lg border border-ink-border px-2.5 py-1 text-xs hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
                  >
                    {u.verified ? t('admin.users.revokeVerification') : t('admin.users.grantVerification')}
                  </button>
                  <button
                    onClick={() => handleToggleBan(u)}
                    className={`rounded-lg px-2.5 py-1 text-xs ${
                      u.isBanned
                        ? 'bg-violet-500/10 text-violet-400 hover:bg-violet-500/20'
                        : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                    }`}
                  >
                    {u.isBanned ? t('admin.users.unban') : t('admin.users.ban')}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
