import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { formatRelativeTime } from '../utils/format';
import EmptyState from '../components/EmptyState';
import PageHeader from '../components/PageHeader';
import { ListSkeleton } from '../components/Skeleton';

export default function Notifications() {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/notifications')
      .then((res) => setNotifications(res.data.notifications))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const unreadCount = notifications.filter((item) => !item.isRead).length;

  const handleMarkAllRead = async () => {
    await apiClient.put('/notifications/read-all');
    setNotifications(notifications.map((item) => ({ ...item, isRead: true })));
  };

  const handleClick = async (notification) => {
    if (notification.isRead) return;
    await apiClient.put(`/notifications/${notification._id}/read`);
    setNotifications(
      notifications.map((item) => (item._id === notification._id ? { ...item, isRead: true } : item))
    );
  };

  return (
    <div>
      <PageHeader
        title={t('notifications.title')}
        description={
          unreadCount > 0 ? t('notifications.unreadCount', { n: unreadCount }) : t('notifications.allRead')
        }
        actions={
          unreadCount > 0 && (
            <button onClick={handleMarkAllRead} className="btn btn-secondary btn-sm">
              {t('notifications.markAllRead')}
            </button>
          )
        }
      />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        {loading ? (
          <ListSkeleton count={5} />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon="notifications"
            title={t('notifications.empty')}
            description={t('notifications.emptyHint')}
            action={{ to: '/explore', label: t('nav.explore') }}
          />
        ) : (
          <ul className="flex flex-col gap-2">
            {notifications.map((notification) => {
              // الإشعار ممكن يكون مربوط بمشروع أو بمنشور منتدى — أو بلا هدف إطلاقاً
              // (زي شارة التحقق). بهاي الحالة منعرضه كعنصر عادي مش كرابط، لأنو رابط
              // بيودّي على "#" بيلخبط قارئ الشاشة وبيضيف تاريخ تنقّل بلا فايدة
              const target = notification.relatedPost?.slug
                ? `/forum/${notification.relatedPost.slug}`
                : notification.relatedProject?.slug
                  ? `/project/${notification.relatedProject.slug}`
                  : null;

              const body = (
                <>
                  <span
                    className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                      notification.isRead ? 'bg-line' : 'bg-brand'
                    }`}
                    aria-hidden="true"
                  />
                  <span className="flex-1">
                    {/* الرسالة بترجع مترجمة من الباك اند حسب لغة الطلب */}
                    <span className="block leading-relaxed">{notification.message}</span>
                    <span className="mt-1 block text-xs text-muted">
                      {formatRelativeTime(notification.createdAt)}
                    </span>
                  </span>
                </>
              );

              const shell = `flex w-full items-start gap-3 rounded-xl border p-4 text-start text-sm transition-colors ${
                notification.isRead ? 'border-line hover:border-brand/40' : 'border-brand/35 bg-brand/5'
              }`;

              return (
                <li key={notification._id}>
                  {target ? (
                    <Link to={target} onClick={() => handleClick(notification)} className={shell}>
                      {body}
                    </Link>
                  ) : (
                    <button type="button" onClick={() => handleClick(notification)} className={shell}>
                      {body}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
