import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import FileTree from '../components/FileTree';
import { formatBytes } from '../utils/format';

const CATEGORIES = [
  { value: 'training-code', labelKey: 'categories.trainingCode' },
  { value: 'model-architecture', labelKey: 'categories.modelArchitecture' },
  { value: 'dataset', labelKey: 'categories.dataset' },
  { value: 'data-cleaning', labelKey: 'categories.dataCleaning' },
  { value: 'other', labelKey: 'categories.other' },
];

export default function Upload() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState({ types: [], details: {} });
  const [files, setFiles] = useState([]); // مصفوفة File عادية (من input files أو input folder)
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);

  const [form, setForm] = useState({
    name: '',
    description: '',
    readme: '',
    category: 'training-code',
    language: '',
    tags: '',
    licenseType: 'MIT',
    licenseCustomText: '',
  });

  useEffect(() => {
    apiClient.get('/projects/meta/licenses').then((res) => {
      setLicenses({ types: res.data.types, details: res.data.details });
    });
  }, []);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  // من input الملفات المفردة أو من input المجلد - بكلا الحالتين منحول FileList لمصفوفة
  // ونضيفها لللي already مختار (بدل ما نستبدلها) حتى تقدر تمزج ملفات مفردة + مجلد
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    setFiles((prev) => [...prev, ...incoming]);
  };

  const clearFiles = () => setFiles([]);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.description.trim() || !form.language.trim()) {
      setError(t('upload.requiredFields'));
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    files.forEach((file) => {
      formData.append('files', file);
      // webkitRelativePath موجودة تلقائياً لو الملف جاي من رفع مجلد كامل (input فيه
      // خاصية webkitdirectory)، وبتكون فاضية لملف مفرد عادي - فيرجع الباك اند لاسم
      // الملف الأصلي بهاي الحالة
      formData.append('filePaths', file.webkitRelativePath || '');
    });

    setLoading(true);
    setProgress(0);
    try {
      const res = await apiClient.post('/projects', formData, {
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      navigate(`/project/${res.data.project.slug}`);
    } catch (err) {
      setError(err.response?.data?.message || t('upload.uploadError'));
      setLoading(false);
    }
  };

  const activeLicense = licenses.details[form.licenseType];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-semibold">{t('upload.title')}</h1>
      <p className="mb-6 text-sm text-ink-muted light:text-paper-muted">{t('upload.subtitle')}</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">
            {t('upload.projectName')}
          </label>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
            placeholder={t('upload.projectNamePlaceholder')}
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('upload.description')}</label>
          <textarea
            value={form.description}
            onChange={(e) => update('description', e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">
            {t('upload.readme')} <span className="font-normal text-ink-muted light:text-paper-muted">{t('upload.readmeFormat')}</span>
          </label>
          <textarea
            value={form.readme}
            onChange={(e) => update('readme', e.target.value)}
            rows={5}
            placeholder={t('upload.readmePlaceholder')}
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 font-mono text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('upload.category')}</label>
            <select
              value={form.category}
              onChange={(e) => update('category', e.target.value)}
              className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {t(c.labelKey)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('upload.language')}</label>
            <input
              value={form.language}
              onChange={(e) => update('language', e.target.value)}
              placeholder="Python"
              className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('upload.tags')}</label>
          <input
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
            placeholder={t('upload.tagsPlaceholder')}
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          />
        </div>

        {/* الترخيص */}
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('upload.license')}</label>
          <select
            value={form.licenseType}
            onChange={(e) => update('licenseType', e.target.value)}
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          >
            {licenses.types.map((t2) => (
              <option key={t2} value={t2}>
                {licenses.details[t2]?.name || t2}
              </option>
            ))}
          </select>
          {activeLicense && (
            <p className="mt-2 rounded-lg bg-ink-surface p-3 text-xs leading-relaxed text-ink-muted light:bg-paper-surface light:text-paper-muted">
              {activeLicense.summary}
            </p>
          )}
          {form.licenseType === 'Custom' && (
            <textarea
              value={form.licenseCustomText}
              onChange={(e) => update('licenseCustomText', e.target.value)}
              rows={4}
              placeholder={t('upload.licenseCustomPlaceholder')}
              className="mt-2 w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
            />
          )}
        </div>

        {/* الملفات */}
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('upload.files')}</label>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-border bg-ink-surface px-3 py-4 text-center text-xs text-ink-muted hover:border-violet-500/50 light:border-paper-border light:bg-paper-surface light:text-paper-muted">
              <span className="text-sm font-medium text-ink-text light:text-paper-text">{t('upload.singleFiles')}</span>
              {t('upload.singleFilesHint')}
              <input
                type="file"
                multiple
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = ''; // يسمح تختار نفس الملف مرة تانية لو حذفته غلط
                }}
                className="hidden"
              />
            </label>

            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-border bg-ink-surface px-3 py-4 text-center text-xs text-ink-muted hover:border-violet-500/50 light:border-paper-border light:bg-paper-surface light:text-paper-muted">
              <span className="text-sm font-medium text-ink-text light:text-paper-text">{t('upload.wholeFolder')}</span>
              {t('upload.wholeFolderHint')}
              <input
                type="file"
                multiple
                // webkitdirectory مو خاصية React قياسية، فبنحطها مباشرة على عنصر الـ
                // DOM عن طريق ref حتى تشتغل بثبات بغض النظر عن نسخة React (متصفحات
                // Chromium وSafari بتدعمها؛ فايرفوكس بيتجاهلها ويرجع لاختيار ملفات عادي)
                ref={(el) => {
                  if (el) {
                    el.setAttribute('webkitdirectory', 'true');
                    el.setAttribute('directory', 'true');
                  }
                }}
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
          </div>

          {files.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-lg border border-ink-border light:border-paper-border">
              <div className="flex items-center justify-between border-b border-ink-border bg-ink-surface px-3 py-2 text-xs text-ink-muted light:border-paper-border light:bg-paper-surface light:text-paper-muted">
                <span>
                  {t('common.fileCount', { count: files.length })} · {formatBytes(totalSize)}
                </span>
                <button type="button" onClick={clearFiles} className="text-red-400 hover:underline">
                  {t('upload.clearAll')}
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto">
                <FileTree
                  files={files.map((f) => ({ relativePath: f.webkitRelativePath || f.name, size: f.size }))}
                  renderLeaf={(file, depth) => (
                    <div
                      style={{ paddingRight: `${depth * 18 + 16}px` }}
                      className="flex items-center justify-between gap-2 py-1.5 pl-4 text-xs"
                    >
                      <span className="truncate font-mono text-ink-muted light:text-paper-muted">
                        {file.relativePath.split('/').pop()}
                      </span>
                      <span className="shrink-0 text-ink-muted light:text-paper-muted">{formatBytes(file.size)}</span>
                    </div>
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        {loading && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-ink-muted light:text-paper-muted">
              <span>{t('upload.uploading')}</span>
              <span className="font-mono">{progress}%</span>
            </div>
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-ink-surface light:bg-paper-surface">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-violet-500 py-2.5 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-60"
        >
          {loading ? `${t('upload.uploading')} ${progress}%` : t('upload.submit')}
        </button>
      </form>
    </div>
  );
}
