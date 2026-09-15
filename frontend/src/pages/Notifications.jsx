import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { formatRelativeTime } from '../utils/format';
import EmptyState from '../components/EmptyState';
import { ListSkeleton } from '../components/Skeleton';

export default function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    apiClient
      .get('/notifications')
      .then((res) => setNotifications(res.data.notifications))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const handleMarkAllRead = async () => {
    await apiClient.put('/notifications/read-all');
    setNotifications(notifications.map((n) => ({ ...n, isRead: true })));
  };

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await apiClient.put(`/notifications/${notif._id}/read`);
      setNotifications(notifications.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n)));
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold">{t('notifications.title')}</h1>
        {notifications.some((n) => !n.isRead) && (
          <button onClick={handleMarkAllRead} className="text-sm text-violet-400 hover:underline">
            {t('notifications.markAllRead')}
          </button>
        )}
      </div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : notifications.length === 0 ? (
        <EmptyState icon="notifications" title={t('notifications.empty')} />
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notif) => (
            <Link
              key={notif._id}
              to={notif.relatedProject ? `/project/${notif.relatedProject.slug || ''}` : '#'}
              onClick={() => handleClick(notif)}
              className={`flex items-start gap-3 rounded-xl border p-4 text-sm transition-colors ${
                notif.isRead
                  ? 'border-ink-border light:border-paper-border'
                  : 'border-violet-500/30 bg-violet-500/5'
              }`}
            >
              {!notif.isRead && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-violet-500" />}
              <div className="flex-1">
                {/* notif.message بترجع مترجمة فعلياً من الباك اند حسب هيدر اللغة الحالي
                    (messageKey + messageParams تترجم وقت الطلب - أنظر notificationController.js) */}
                <p>{notif.message}</p>
                <p className="mt-1 text-xs text-ink-muted light:text-paper-muted">
                  {formatRelativeTime(notif.createdAt)}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
