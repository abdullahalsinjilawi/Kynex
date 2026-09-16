import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../../api/client';
import { formatRelativeTime } from '../../utils/format';
import { ListSkeleton } from '../../components/Skeleton';
import EmptyState from '../../components/EmptyState';

const STATUSES = ['pending', 'reviewed', 'actioned', 'dismissed', ''];
const TARGET_KEYS = {
  comment: 'admin.reports.target.comment',
  project: 'admin.reports.target.project',
  user: 'admin.reports.target.user',
  post: 'admin.reports.target.post',
};

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
      <div className="no-scrollbar mb-5 flex gap-2 overflow-x-auto">
        {STATUSES.map((s) => (
          <button
            key={s || 'all'}
            onClick={() => setStatusFilter(s)}
            className="chip"
            data-active={statusFilter === s}
          >
            {s ? t(`admin.reports.status.${s}`) : t('admin.reports.status.all')}
          </button>
        ))}
      </div>

      {loading ? (
        <ListSkeleton count={4} />
      ) : reports.length === 0 ? (
        <EmptyState icon="notifications" title={t('admin.reports.empty')} />
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => (
            <div key={report._id} className="card p-4 text-sm">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-elevated px-2 py-0.5 font-mono text-xs text-muted">
                    {TARGET_KEYS[report.targetType] ? t(TARGET_KEYS[report.targetType]) : report.targetType} · {report.targetId}
                  </span>
                  <span className="badge badge-danger">
                    {t(`report.categories.${report.category}`, { defaultValue: report.category })}
                  </span>
                </div>
                <span className="text-xs text-muted">
                  {formatRelativeTime(report.createdAt)}
                </span>
              </div>
              <p className="mb-2">
                <span className="text-muted">{t('admin.reports.reportedBy')} </span>
                {report.reporter?.name} ({report.reporter?.email})
              </p>
              {report.reason && (
                <p className="mb-3 rounded-xl border border-line-soft bg-elevated px-3 py-2.5 text-xs leading-relaxed">
                  {report.reason}
                </p>
              )}

              <textarea
                defaultValue={report.adminNote}
                onChange={(e) => setNotes({ ...notes, [report._id]: e.target.value })}
                placeholder={t('admin.reports.notePlaceholder')}
                rows={2}
                className="input input-sm mb-2"
              />

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleUpdate(report, 'reviewed', false)}
                  className="btn btn-secondary btn-sm"
                >
                  {t('admin.reports.markReviewed')}
                </button>
                <button
                  onClick={() => handleUpdate(report, 'dismissed', false)}
                  className="btn btn-secondary btn-sm"
                >
                  {t('admin.reports.dismiss')}
                </button>
                <button
                  onClick={() => handleUpdate(report, 'actioned', true)}
                  className="btn btn-danger btn-sm"
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
