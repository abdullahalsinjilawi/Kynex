import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import { useAuth } from '../context/AuthContext';
import FileTree from '../components/FileTree';
import { formatBytes } from '../utils/format';

const CATEGORIES = [
  { value: 'training-code', labelKey: 'categories.trainingCode' },
  { value: 'model-architecture', labelKey: 'categories.modelArchitecture' },
  { value: 'dataset', labelKey: 'categories.dataset' },
  { value: 'data-cleaning', labelKey: 'categories.dataCleaning' },
  { value: 'other', labelKey: 'categories.other' },
];

export default function EditProject() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [licenses, setLicenses] = useState({ types: [], details: {} });
  const [originalProject, setOriginalProject] = useState(null);
  const [newFiles, setNewFiles] = useState([]);
  const [loadingProject, setLoadingProject] = useState(true);
  const [notFoundOrForbidden, setNotFoundOrForbidden] = useState(false);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
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

  useEffect(() => {
    setLoadingProject(true);
    apiClient
      .get(`/projects/${slug}`)
      .then((res) => {
        const p = res.data.project;
        // بس صاحب المشروع يقدر يعدّله - الباك اند بيتحقق برضه، هاد بس لتجربة مستخدم أوضح
        if (!user || user.id !== p.owner._id) {
          setNotFoundOrForbidden(true);
          return;
        }
        setOriginalProject(p);
        setForm({
          name: p.name,
          description: p.description,
          readme: p.readme || '',
          category: p.category,
          language: p.language,
          tags: (p.tags || []).join(', '),
          licenseType: p.license.type,
          licenseCustomText: p.license.customText || '',
        });
      })
      .catch(() => setNotFoundOrForbidden(true))
      .finally(() => setLoadingProject(false));
  }, [slug, user]);

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const addFiles = (fileList) => {
    setNewFiles((prev) => [...prev, ...Array.from(fileList)]);
  };
  const clearNewFiles = () => setNewFiles([]);
  const newFilesTotalSize = newFiles.reduce((sum, f) => sum + f.size, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.description.trim() || !form.language.trim()) {
      setError(t('upload.requiredFields'));
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    newFiles.forEach((file) => {
      formData.append('files', file);
      formData.append('filePaths', file.webkitRelativePath || '');
    });

    setSaving(true);
    setProgress(0);
    try {
      const res = await apiClient.put(`/projects/${slug}`, formData, {
        onUploadProgress: (evt) => {
          if (evt.total) setProgress(Math.round((evt.loaded / evt.total) * 100));
        },
      });
      navigate(`/project/${res.data.project.slug}`);
    } catch (err) {
      setError(err.response?.data?.message || t('editProject.saveError'));
      setSaving(false);
    }
  };

  if (loadingProject) {
    return <div className="p-10 text-center text-sm text-ink-muted light:text-paper-muted">{t('common.loading')}</div>;
  }

  if (notFoundOrForbidden || !originalProject) {
    return (
      <div className="p-10 text-center text-sm text-ink-muted light:text-paper-muted">
        {t('editProject.forbidden')}
      </div>
    );
  }

  const activeLicense = licenses.details[form.licenseType];

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 sm:px-6">
      <h1 className="mb-1 text-xl font-semibold">{t('editProject.title')}</h1>
      <p className="mb-6 text-sm text-ink-muted light:text-paper-muted">
        <Link to={`/project/${slug}`} className="text-violet-400 hover:underline">
          {originalProject.name}
        </Link>
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('upload.projectName')}</label>
          <input
            value={form.name}
            onChange={(e) => update('name', e.target.value)}
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
              className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">{t('upload.tags')}</label>
          <input
            value={form.tags}
            onChange={(e) => update('tags', e.target.value)}
            className="w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
          />
        </div>

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
              className="mt-2 w-full rounded-lg border border-ink-border bg-ink-surface px-3 py-2 text-sm outline-none focus:border-violet-500 light:border-paper-border light:bg-paper-surface"
            />
          )}
        </div>

        {/* الملفات الحالية (للعرض بس) */}
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">
            {t('editProject.currentFiles', { count: originalProject.files?.length || 0 })}
          </label>
          <div className="max-h-48 overflow-y-auto rounded-lg border border-ink-border light:border-paper-border">
            <FileTree
              files={originalProject.files || []}
              renderLeaf={(file, depth) => (
                <div
                  style={{ paddingRight: `${depth * 18 + 16}px` }}
                  className="flex items-center justify-between gap-2 py-1.5 pl-4 text-xs"
                >
                  <span className="truncate font-mono text-ink-muted light:text-paper-muted">{file.filename}</span>
                  <span className="shrink-0 text-ink-muted light:text-paper-muted">{formatBytes(file.size)}</span>
                </div>
              )}
            />
          </div>
        </div>

        {/* رفع ملفات جديدة (اختياري - بتستبدل كل الملفات الحالية) */}
        <div>
          <label className="mb-1.5 block text-sm text-ink-muted light:text-paper-muted">
            {t('editProject.replaceFiles')} <span className="font-normal">{t('editProject.optional')}</span>
          </label>
          <p className="mb-2 text-xs leading-relaxed text-ink-muted light:text-paper-muted">
            {t('editProject.replaceFilesHint')}
          </p>

          <div className="grid grid-cols-2 gap-2">
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-border bg-ink-surface px-3 py-4 text-center text-xs text-ink-muted hover:border-violet-500/50 light:border-paper-border light:bg-paper-surface light:text-paper-muted">
              <span className="text-sm font-medium text-ink-text light:text-paper-text">{t('upload.singleFiles')}</span>
              <input
                type="file"
                multiple
                onChange={(e) => {
                  addFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
              />
            </label>
            <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-ink-border bg-ink-surface px-3 py-4 text-center text-xs text-ink-muted hover:border-violet-500/50 light:border-paper-border light:bg-paper-surface light:text-paper-muted">
              <span className="text-sm font-medium text-ink-text light:text-paper-text">{t('upload.wholeFolder')}</span>
              <input
                type="file"
                multiple
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

          {newFiles.length > 0 && (
            <div className="mt-3 overflow-hidden rounded-lg border border-violet-500/30">
              <div className="flex items-center justify-between border-b border-violet-500/30 bg-violet-500/5 px-3 py-2 text-xs text-violet-400">
                <span>{t('editProject.newFilesSummary', { count: newFiles.length, size: formatBytes(newFilesTotalSize) })}</span>
                <button type="button" onClick={clearNewFiles} className="text-red-400 hover:underline">
                  {t('common.cancel')}
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto">
                <FileTree
                  files={newFiles.map((f) => ({ relativePath: f.webkitRelativePath || f.name, size: f.size }))}
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

        {saving && (
          <div>
            <div className="mb-1 flex justify-between text-xs text-ink-muted light:text-paper-muted">
              <span>{t('editProject.saving')}</span>
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

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={saving}
            className="flex-1 rounded-lg bg-violet-500 py-2.5 text-sm font-medium text-white hover:bg-violet-600 disabled:opacity-60"
          >
            {saving ? `${t('editProject.saving')} ${progress}%` : t('editProject.saveChanges')}
          </button>
          <button
            type="button"
            onClick={() => navigate(`/project/${slug}`)}
            className="rounded-lg border border-ink-border px-4 py-2.5 text-sm hover:bg-ink-surface light:border-paper-border light:hover:bg-paper-surface"
          >
            {t('common.cancel')}
          </button>
        </div>
      </form>
    </div>
  );
}
