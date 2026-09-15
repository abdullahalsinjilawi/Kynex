import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { formatRelativeTime } from '../../utils/format';

const STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed', ''];
const TARGET_KEYS = { comment: 'admin.reports.target.comment', project: 'admin.reports.target.project', user: 'admin.reports.target.user' };

export default function AdminReports() {
  const { t } = useTranslation();
  const [reports, setReports] = useState([]);
  const [statusFilter, setStatusFilter] = useState('pending');
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState({});

  const load = () => {
    setLoading(true);
    apiClient
      .get('/admin/reports', { params: statusFilter ? { status: statusFilter } : {} })
      .then((res) => setReports(res.data.reports))
      .finally(() => setLoading(false));
  };

  useEffect(load, [statusFilter]);

  const handleUpdate = async (report, status, banReportedUser) => {
    await apiClient.put(`/admin/reports/${report._id}`, {
      status,
      adminNote: notes[report._id] || report.adminNote,
      banReportedUser,
    });
    load();
  };

  return (
    <div>
      <div className="mb-4 flex gap-2">
        {STATUSES.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
              statusFilter === s
                ? 'bg-violet-500 text-white'
                : 'border border-ink-border text-ink-muted hover:bg-ink-surface light:border-paper-border light:text-paper-muted'
            }`}
          >
            {s ? t(`admin.reports.status.${s}`) : t('admin.reports.status.all')}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-sm text-ink-muted light:text-paper-muted">{t('common.loading')}</p>
      ) : reports.length === 0 ? (
        <div className="rounded-xl border border-dashed border-ink-border p-10 text-center text-sm text-ink-muted light:border-paper-border light:text-paper-muted">
          {t('admin.reports.empty')}
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <div key={report._id} className="rounded-xl border border-ink-border p-4 text-sm light:border-paper-border">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-ink-surface px-2 py-0.5 font-mono text-xs light:bg-paper-surface">
                    {t(TARGET_KEYS[report.targetType])} · {report.targetId}
                  </span>
                  <span className="rounded-md bg-red-500/10 px-2 py-0.5 text-xs font-medium text-red-400">
                    {t(`report.categories.${report.category}`, { defaultValue: report.category })}
                  </span>
                </div>
                <span className="text-xs text-ink-muted light:text-paper-muted">
                  {formatRelativeTime(report.createdAt)}
                </span>
              </div>
              <p className="mb-2">
                <span className="text-ink-muted light:text-paper-muted">{t('admin.reports.reportedBy')} </span>
                {report.reporter?.name} ({report.reporter?.email})
              </p>
              {report.reason && (
                <p className="mb-3 rounded-lg bg-ink-surface p-2 text-xs leading-relaxed light:bg-paper-surface">
                  {report.reason}
                </p>
              )}

              <textarea
                defaultValue={report.adminNote}
                onChange={(e) => setNotes({ ...notes, [report._id]: e.target.value })}
                placeholder={t('admin.reports.notePlaceholder')}
                rows={2}
                className="mb-2 w-full rounded-lg border border-ink-border bg-ink-surface p-2 text-xs outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdate(report, 'reviewed', false)}
                  className="rounded-lg border border-ink-border px-3 py-1.5 text-xs hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
                >
                  {t('admin.reports.markReviewed')}
                </button>
                <button
                  onClick={() => handleUpdate(report, 'dismissed', false)}
                  className="rounded-lg border border-ink-border px-3 py-1.5 text-xs hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
                >
                  {t('admin.reports.dismiss')}
                </button>
                <button
                  onClick={() => handleUpdate(report, 'actioned', true)}
                  className="rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20"
                >
                  {t('admin.reports.banOffender')}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
