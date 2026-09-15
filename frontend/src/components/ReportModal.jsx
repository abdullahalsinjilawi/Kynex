import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';

export default function ReportModal({ targetType, targetId, onClose, onSubmitted }) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/reports/categories').then((res) => setCategories(res.data.categories));
  }, []);

  const handleSubmit = async () => {
    setError('');
    if (!selected) {
      setError(t('report.chooseReason'));
      return;
    }
    if (selected === 'other' && !detail.trim()) {
      setError(t('report.explainOther'));
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/reports', {
        targetType,
        targetId,
        category: selected,
        reason: detail.trim(),
      });
      onSubmitted?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || t('auth.genericError'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-ink-border bg-ink-surface-raised p-5 light:border-paper-border light:bg-paper-surface"
      >
        <h3 className="mb-1 text-base font-semibold">{t('report.title')}</h3>
        <p className="mb-4 text-xs text-ink-muted light:text-paper-muted">{t('report.subtitle')}</p>

        <div className="mb-4 flex flex-col gap-2">
          {categories.map((cat) => (
            <label
              key={cat}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                selected === cat
                  ? 'border-violet-500 bg-violet-500/10'
                  : 'border-ink-border hover:bg-ink-surface light:border-paper-border light:hover:bg-paper'
              }`}
            >
              <input
                type="radio"
                name="report-category"
                value={cat}
                checked={selected === cat}
                onChange={() => setSelected(cat)}
                className="accent-violet-500"
              />
              {t(`report.categories.${cat}`, { defaultValue: cat })}
            </label>
          ))}
        </div>

        {selected === 'other' && (
          <textarea
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            placeholder={t('report.explainPlaceholder')}
            rows={2}
            className="mb-3 w-full rounded-lg border border-ink-border bg-ink-surface p-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper"
          />
        )}

        {error && <p className="mb-3 text-xs text-red-400">{error}</p>}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-3 py-1.5 text-sm text-ink-muted hover:bg-ink-surface light:text-paper-muted light:hover:bg-paper"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="rounded-lg bg-red-500/10 px-3 py-1.5 text-sm font-medium text-red-400 hover:bg-red-500/20 disabled:opacity-60"
          >
            {loading ? t('report.submitting') : t('report.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
