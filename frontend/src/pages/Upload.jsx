import { useEffect, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import PageHeader from '../components/PageHeader';
import FormError from '../components/FormError';
import Spinner from '../components/Spinner';
import MarkdownEditor from '../components/MarkdownEditor';
import { formatBytes } from '../utils/format';

const CATEGORIES = [
  { value: 'training-code', labelKey: 'categories.trainingCode' },
  { value: 'model-architecture', labelKey: 'categories.modelArchitecture' },
  { value: 'dataset', labelKey: 'categories.dataset' },
  { value: 'data-cleaning', labelKey: 'categories.dataCleaning' },
  { value: 'other', labelKey: 'categories.other' },
];

/** قسم واحد من الفورم: عنوان + شرح سطر + محتواه داخل بطاقة. */
function Section({ title, description, children }) {
  return (
    <section className="panel p-5 sm:p-6">
      <h2 className="font-display text-base font-semibold">{title}</h2>
      {description && <p className="mt-1 text-sm leading-relaxed text-muted">{description}</p>}
      <div className="mt-5 flex flex-col gap-4">{children}</div>
    </section>
  );
}

export default function Upload() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [licenses, setLicenses] = useState({ types: [], details: {} });
  const [files, setFiles] = useState([]); // مصفوفة File عادية (من input files أو input folder أو السحب والإفلات)
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [createdSlug, setCreatedSlug] = useState(null); // لو انعمل إنشاء المشروع بس بعض ملفاته فشلت، منخزن الـ slug هون حتى إعادة الإرسال ما تنشئ مشروع تاني، بس ترفع الملفات المتبقية
  const dragDepth = useRef(0); // عدّاد: dragenter/dragleave بتضربوا مع كل عنصر ابن

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

  // من input الملفات المفردة أو من input المجلد أو من الإفلات - بكل الحالات منحوّل
  // FileList لمصفوفة ومنضيفها لللي مختار أصلاً (بدل ما نستبدلها) حتى تقدر تمزج
  const addFiles = (fileList) => {
    const incoming = Array.from(fileList);
    if (incoming.length) setFiles((prev) => [...prev, ...incoming]);
  };

  const removeFile = (index) => setFiles((prev) => prev.filter((_, i) => i !== index));
  const clearFiles = () => setFiles([]);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  // برفع كل ملف بطلب HTTP منفصل بدل ما نبعتهم كلهم بطلب واحد - بعض المزودين (زي
  // Render) بيرفضوا الطلب على مستوى الـ proxy لو فيه أجزاء (parts) كتير بنفس
  // الطلب، حتى لو الحجم الكلي صغير جداً. برجع مصفوفة الملفات اللي فشلت (لإعادة
  // المحاولة عليها بس لاحقاً) مع تحديث progress إجمالي حسب البايتات المرفوعة فعلياً
  const uploadFilesToProject = async (slug, filesToUpload) => {
    if (filesToUpload.length === 0) return [];

    const loadedBytes = new Array(filesToUpload.length).fill(0);
    const totalBytes = filesToUpload.reduce((sum, f) => sum + f.size, 0) || 1;
    const updateProgress = () => {
      const loaded = loadedBytes.reduce((sum, b) => sum + b, 0);
      setProgress(Math.round((loaded / totalBytes) * 100));
    };

    const CONCURRENCY = 4; // كم ملف يترفعوا بالتوازي بنفس الوقت
    const failed = [];
    let nextIndex = 0;

    const worker = async () => {
      while (nextIndex < filesToUpload.length) {
        const i = nextIndex++;
        const file = filesToUpload[i];
        const fileFormData = new FormData();
        fileFormData.append('file', file);
        fileFormData.append('filePath', file.webkitRelativePath || '');
        try {
          await apiClient.post(`/projects/${slug}/files`, fileFormData, {
            onUploadProgress: (evt) => {
              loadedBytes[i] = evt.loaded;
              updateProgress();
            },
          });
          loadedBytes[i] = file.size;
          updateProgress();
        } catch {
          failed.push(file);
        }
      }
    };

    await Promise.all(
      Array.from({ length: Math.min(CONCURRENCY, filesToUpload.length) }, worker)
    );
    return failed;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!form.name.trim() || !form.description.trim() || !form.language.trim()) {
      setError(t('upload.requiredFields'));
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setLoading(true);
    setProgress(0);
    try {
      // لو أول محاولة (أو لو محاولة سابقة فشلت بمرحلة إنشاء المشروع نفسها)، ننشئ
      // المشروع فاضي من الملفات أول شي. لو إعادة محاولة بعد فشل جزئي بالملفات،
      // بنستخدم نفس الـ slug المخزّن بدل ما ننشئ مشروع تاني من الصفر
      let slug = createdSlug;
      if (!slug) {
        const formData = new FormData();
        Object.entries(form).forEach(([key, value]) => formData.append(key, value));
        const res = await apiClient.post('/projects', formData);
        slug = res.data.project.slug;
        setCreatedSlug(slug);
      }

      const failed = await uploadFilesToProject(slug, files);

      if (failed.length === 0) {
        navigate(`/project/${slug}`);
        return;
      }

      setFiles(failed); // منخلي بس الملفات اللي فشلت جاهزة لإعادة المحاولة
      setError(t('upload.someFilesFailed', { count: failed.length }));
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || t('upload.uploadError'));
      setLoading(false);
    }
  };

  const activeLicense = licenses.details[form.licenseType];

  return (
    <div className="animate-page-in">
      <PageHeader title={t('upload.title')} description={t('upload.subtitle')} />

      <form onSubmit={handleSubmit} className="mx-auto flex max-w-3xl flex-col gap-5 px-4 py-8 sm:px-6">
        {error && (
          <FormError>
            {error}
            {createdSlug && (
              <>
                {' '}
                <Link to={`/project/${createdSlug}`} className="font-medium underline">
                  {t('upload.viewProjectAnyway')}
                </Link>
              </>
            )}
          </FormError>
        )}

        <Section title={t('upload.sectionInfo')} description={t('upload.sectionInfoDesc')}>
          <div>
            <label className="field-label" htmlFor="project-name">
              {t('upload.projectName')}
            </label>
            <input
              id="project-name"
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder={t('upload.projectNamePlaceholder')}
              className="input"
            />
          </div>

          <div>
            <label className="field-label" htmlFor="project-description">
              {t('upload.description')}
            </label>
            <textarea
              id="project-description"
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              rows={3}
              placeholder={t('upload.descriptionPlaceholder')}
              className="input"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label" htmlFor="project-category">
                {t('upload.category')}
              </label>
              <select
                id="project-category"
                value={form.category}
                onChange={(e) => update('category', e.target.value)}
                className="input"
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {t(c.labelKey)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="field-label" htmlFor="project-language">
                {t('upload.language')}
              </label>
              <input
                id="project-language"
                value={form.language}
                onChange={(e) => update('language', e.target.value)}
                placeholder="Python"
                className="input font-mono"
              />
            </div>
          </div>

          <div>
            <label className="field-label" htmlFor="project-tags">
              {t('upload.tags')}
            </label>
            <input
              id="project-tags"
              value={form.tags}
              onChange={(e) => update('tags', e.target.value)}
              placeholder={t('upload.tagsPlaceholder')}
              className="input font-mono"
            />
          </div>
        </Section>

        <Section title={t('upload.sectionDocs')} description={t('upload.sectionDocsDesc')}>
          <div>
            <span className="field-label">
              {t('upload.readme')}{' '}
              <span className="font-normal opacity-70">{t('upload.readmeFormat')}</span>
            </span>
            <div className="mt-1.5">
              <MarkdownEditor
                id="project-readme"
                value={form.readme}
                onChange={(value) => update('readme', value)}
                placeholder={t('upload.readmePlaceholder')}
                rows={9}
                maxLength={20000}
              />
            </div>
          </div>
        </Section>

        <Section title={t('upload.sectionLicense')} description={t('upload.sectionLicenseDesc')}>
          <div>
            <label className="field-label" htmlFor="project-license">
              {t('upload.license')}
            </label>
            <select
              id="project-license"
              value={form.licenseType}
              onChange={(e) => update('licenseType', e.target.value)}
              className="input"
            >
              {licenses.types.map((type) => (
                <option key={type} value={type}>
                  {licenses.details[type]?.name || type}
                </option>
              ))}
            </select>
            {activeLicense && (
              <p className="mt-2.5 rounded-xl border border-line-soft bg-elevated px-3.5 py-3 text-xs leading-relaxed text-muted">
                {activeLicense.summary}
              </p>
            )}
          </div>

          {form.licenseType === 'Custom' && (
            <textarea
              value={form.licenseCustomText}
              onChange={(e) => update('licenseCustomText', e.target.value)}
              rows={5}
              placeholder={t('upload.licenseCustomPlaceholder')}
              className="input font-mono text-[13px]"
            />
          )}
        </Section>

        <Section title={t('upload.sectionFiles')} description={t('upload.sectionFilesDesc')}>
          {/* منطقة السحب والإفلات: نفس الصندوق بيشتغل كـ drop target وكمان جواته زرّين */}
          <div
            onDragEnter={(e) => {
              e.preventDefault();
              dragDepth.current += 1;
              setDragging(true);
            }}
            onDragOver={(e) => e.preventDefault()}
            onDragLeave={() => {
              dragDepth.current -= 1;
              if (dragDepth.current <= 0) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              dragDepth.current = 0;
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            className={`rounded-2xl border border-dashed p-4 transition-colors ${
              dragging ? 'border-brand bg-brand/10' : 'border-line'
            }`}
          >
            {dragging ? (
              <p className="py-10 text-center text-sm font-medium text-brand-light">
                {t('upload.dropHere')}
              </p>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-elevated px-4 py-6 text-center transition-colors hover:border-brand/50">
                  <svg className="mb-1 h-6 w-6 text-brand" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M14 3v5h5M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('upload.singleFiles')}</span>
                  <span className="text-xs leading-relaxed text-muted">{t('upload.singleFilesHint')}</span>
                  <input
                    type="file"
                    multiple
                    onChange={(e) => {
                      addFiles(e.target.files);
                      e.target.value = ''; // يسمح تختار نفس الملف مرة تانية لو حذفته غلط
                    }}
                    className="sr-only"
                  />
                </label>

                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-xl border border-line bg-elevated px-4 py-6 text-center transition-colors hover:border-brand/50">
                  <svg className="mb-1 h-6 w-6 text-accent" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                  </svg>
                  <span className="text-sm font-semibold">{t('upload.wholeFolder')}</span>
                  <span className="text-xs leading-relaxed text-muted">{t('upload.wholeFolderHint')}</span>
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
                    className="sr-only"
                  />
                </label>
              </div>
            )}
          </div>

          {files.length === 0 ? (
            <p className="text-xs text-muted">{t('upload.filesEmptyHint')}</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-line">
              <div className="flex items-center justify-between gap-3 border-b border-line bg-elevated px-3.5 py-2.5 text-xs text-muted">
                <span className="tnum">
                  {t('common.fileCount', { count: files.length })} · {formatBytes(totalSize)}
                </span>
                <button type="button" onClick={clearFiles} className="font-medium text-danger hover:underline">
                  {t('upload.clearAll')}
                </button>
              </div>
              <ul className="max-h-72 overflow-y-auto">
                {files.map((file, index) => (
                  <li
                    key={`${file.webkitRelativePath || file.name}-${index}`}
                    className="flex items-center justify-between gap-3 border-b border-line-soft px-3.5 py-2 text-xs last:border-b-0"
                  >
                    <span className="truncate font-mono text-muted" title={file.webkitRelativePath || file.name}>
                      {file.webkitRelativePath || file.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      <span className="tnum text-muted">{formatBytes(file.size)}</span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        aria-label={t('upload.removeFile')}
                        className="rounded-md p-1 text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Section>

        {loading && (
          <div className="panel p-4">
            <div className="mb-2 flex justify-between text-xs text-muted">
              <span>{t('upload.uploading')}</span>
              <span className="tnum font-display">{progress}%</span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full bg-elevated"
              role="progressbar"
              aria-valuenow={progress}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand to-accent transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <button type="submit" disabled={loading} className="btn btn-primary btn-lg">
          {loading ? (
            <>
              <Spinner />
              {`${t('upload.uploading')} ${progress}%`}
            </>
          ) : (
            t('upload.submit')
          )}
        </button>
      </form>
    </div>
  );
}
