import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import useDismissable from '../hooks/useDismissable';

export default function ReportModal({ targetType, targetId, onClose, onSubmitted }) {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [selected, setSelected] = useState('');
  const [detail, setDetail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useDismissable(onClose);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="report-modal-title"
        onClick={(e) => e.stopPropagation()}
        className="panel animate-card-in w-full max-w-sm bg-elevated p-5 shadow-pop"
      >
        <h3 id="report-modal-title" className="mb-1 font-display text-base font-semibold">
          {t('report.title')}
        </h3>
        <p className="mb-4 text-xs text-muted">{t('report.subtitle')}</p>

        <div className="mb-4 flex flex-col gap-2">
          {categories.map((cat) => (
            <label
              key={cat}
              className={`flex cursor-pointer items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors ${
                selected === cat
                  ? 'border-brand bg-brand/12'
                  : 'border-line hover:border-brand/40'
              }`}
            >
              <input
                type="radio"
                name="report-category"
                value={cat}
                checked={selected === cat}
                onChange={() => setSelected(cat)}
                className="accent-[var(--color-brand)]"
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
            className="input mb-3"
          />
        )}

        {error && (
          <p role="alert" className="mb-3 text-xs text-danger">
            {error}
          </p>
        )}

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="btn btn-ghost btn-sm"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="btn btn-danger btn-sm"
          >
            {loading ? t('report.submitting') : t('report.submit')}
          </button>
        </div>
      </div>
    </div>
  );
}
