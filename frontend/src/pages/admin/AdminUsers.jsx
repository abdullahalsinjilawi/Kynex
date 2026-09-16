import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { formatRelativeTime } from '../../utils/format';
import { ListSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';
import Avatar from '../../components/Avatar';

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
        className="input input-sm mb-5 max-w-sm"
      />

      {loading ? (
        <ListSkeleton count={6} />
      ) : users.length === 0 ? (
        <EmptyState icon="search" title={t('admin.users.noResults')} />
      ) : (
        <div className="overflow-hidden rounded-xl border border-line">
          {users.map((u, i) => (
            <div
              key={u._id}
              className={`flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm transition-colors hover:bg-fg/[0.03] ${
                i !== 0 ? 'border-t border-line' : ''
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <Avatar name={u.name} id={u._id} size="md" />
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-1.5 font-medium">
                    <span className="truncate">{u.name}</span>
                    {u.verified && <span className="badge badge-accent">{t('admin.users.verified')}</span>}
                    {u.isBanned && <span className="badge badge-danger">{t('admin.users.banned')}</span>}
                    {u.role === 'admin' && <span className="badge badge-brand">{t('admin.users.adminRole')}</span>}
                  </p>
                  <p className="truncate text-xs text-muted">
                    {u.email} · {t('admin.users.joinedPrefix')} {formatRelativeTime(u.createdAt)}
                  </p>
                </div>
              </div>

              {u.role !== 'admin' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleToggleVerify(u)}
                    className="btn btn-secondary btn-sm"
                  >
                    {u.verified ? t('admin.users.revokeVerification') : t('admin.users.grantVerification')}
                  </button>
                  <button
                    onClick={() => handleToggleBan(u)}
                    className={`btn btn-sm ${u.isBanned ? 'btn-secondary' : 'btn-danger'}`}
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
