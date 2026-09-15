import i18n from '../i18n';

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return `0 ${i18n.t('common.units.bytes')}`;
  const units = [
    i18n.t('common.units.bytes'),
    i18n.t('common.units.kb'),
    i18n.t('common.units.mb'),
    i18n.t('common.units.gb'),
  ];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / Math.pow(1024, i);
  return `${value.toFixed(i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatRelativeTime(dateString) {
  if (!dateString) return '';
  const date = new Date(dateString);
  const diffMs = Date.now() - date.getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return i18n.t('common.time.now');
  if (diffMin < 60) return i18n.t('common.time.minutesAgo', { count: diffMin });

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return i18n.t('common.time.hoursAgo', { count: diffHours });

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return i18n.t('common.time.daysAgo', { count: diffDays });

  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return i18n.t('common.time.monthsAgo', { count: diffMonths });

  return i18n.t('common.time.yearsAgo', { count: Math.floor(diffMonths / 12) });
}
