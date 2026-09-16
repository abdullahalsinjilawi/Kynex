import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import apiClient from '../api/client';
import PageHeader from '../components/PageHeader';
import MarkdownEditor from '../components/MarkdownEditor';
import FormError from '../components/FormError';
import Spinner from '../components/Spinner';
import { POST_TYPES } from '../utils/postMeta';

const EMPTY = {
  title: '',
  type: 'news',
  content: '',
  excerpt: '',
  tags: '',
  sourceUrl: '',
  coverUrl: '',
};

/**
 * محرّر المنشور — نفس الصفحة للنشر الجديد وللتعديل (بتفرّق حسب وجود :slug بالرابط).
 * تكرار الصفحتين كان بيعني نسخة ثانية من نفس الفورم لازم تتحدّث مرتين كل مرة.
 */
export default function PostEditor() {
  const { slug } = useParams();
  const isEdit = Boolean(slug);
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [form, setForm] = useState(EMPTY);
  const [postId, setPostId] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    setLoading(true);
    apiClient
      .get(`/posts/${slug}`)
      .then((res) => {
        const post = res.data.post;
        setPostId(post._id);
        setForm({
          title: post.title || '',
          type: post.type || 'news',
          content: post.content || '',
          excerpt: post.excerpt || '',
          tags: (post.tags || []).join(', '),
          sourceUrl: post.sourceUrl || '',
          coverUrl: post.coverUrl || '',
        });
      })
      .catch(() => setError(t('forum.postNotFound')))
      .finally(() => setLoading(false));
  }, [slug, isEdit, t]);

  const set = (key) => (event) => setForm((prev) => ({ ...prev, [key]: event.target.value }));

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (!form.title.trim() || !form.content.trim()) {
      setError(t('forum.validation.required'));
      return;
    }

    setSaving(true);
    const payload = {
      title: form.title.trim(),
      type: form.type,
      content: form.content.trim(),
      excerpt: form.excerpt.trim(),
      tags: form.tags,
      sourceUrl: form.sourceUrl.trim(),
      coverUrl: form.coverUrl.trim(),
    };

    try {
      const res = isEdit
        ? await apiClient.put(`/posts/${postId}`, payload)
        : await apiClient.post('/posts', payload);
      navigate(`/forum/${res.data.post.slug}`);
    } catch (err) {
      setError(err.response?.data?.message || t('forum.validation.failed'));
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner className="h-6 w-6" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={isEdit ? t('forum.editPost') : t('forum.newPost')}
        description={t('forum.editorSubtitle')}
        actions={
          <Link to={isEdit ? `/forum/${slug}` : '/forum'} className="btn btn-ghost">
            {t('common.cancel')}
          </Link>
        }
      />

      <form onSubmit={submit} className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="flex flex-col gap-6">
          {/* النوع أول شي — بيحدّد توقّع القارئ، وبيغيّر شكل البطاقة بالمنتدى */}
          <div>
            <span className="field-label">{t('forum.form.type')}</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {POST_TYPES.map((type) => (
                <button
                  key={type.key}
                  type="button"
                  onClick={() => setForm((prev) => ({ ...prev, type: type.key }))}
                  data-active={form.type === type.key}
                  className="chip gap-1.5"
                >
                  <type.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  {t(type.labelKey)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="post-title" className="field-label">
              {t('forum.form.title')}
            </label>
            <input
              id="post-title"
              dir="auto"
              value={form.title}
              onChange={set('title')}
              maxLength={180}
              placeholder={t('forum.form.titlePlaceholder')}
              className="input mt-1.5"
              required
            />
          </div>

          <div>
            <span className="field-label">{t('forum.form.content')}</span>
            <div className="mt-1.5">
              <MarkdownEditor
                id="post-content"
                value={form.content}
                onChange={(value) => setForm((prev) => ({ ...prev, content: value }))}
                placeholder={t('forum.form.contentPlaceholder')}
              />
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="post-tags" className="field-label">
                {t('forum.form.tags')}
              </label>
              <input
                id="post-tags"
                dir="auto"
                value={form.tags}
                onChange={set('tags')}
                placeholder={t('forum.form.tagsPlaceholder')}
                className="input mt-1.5"
              />
              <p className="mt-1.5 text-xs text-muted">{t('forum.form.tagsHint')}</p>
            </div>

            <div>
              <label htmlFor="post-source" className="field-label">
                {t('forum.form.sourceUrl')}
              </label>
              <input
                id="post-source"
                type="url"
                dir="ltr"
                value={form.sourceUrl}
                onChange={set('sourceUrl')}
                placeholder="https://..."
                className="input mt-1.5 text-start"
              />
              <p className="mt-1.5 text-xs text-muted">{t('forum.form.sourceHint')}</p>
            </div>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="post-cover" className="field-label">
                {t('forum.form.coverUrl')}
              </label>
              <input
                id="post-cover"
                type="url"
                dir="ltr"
                value={form.coverUrl}
                onChange={set('coverUrl')}
                placeholder="https://..."
                className="input mt-1.5 text-start"
              />
            </div>

            <div>
              <label htmlFor="post-excerpt" className="field-label">
                {t('forum.form.excerpt')}
              </label>
              <input
                id="post-excerpt"
                dir="auto"
                value={form.excerpt}
                onChange={set('excerpt')}
                maxLength={320}
                placeholder={t('forum.form.excerptPlaceholder')}
                className="input mt-1.5"
              />
            </div>
          </div>

          {form.coverUrl && /^https?:\/\//i.test(form.coverUrl) && (
            <img
              src={form.coverUrl}
              alt=""
              className="max-h-64 w-full rounded-xl border border-line object-cover"
              onError={(event) => {
                event.currentTarget.style.display = 'none';
              }}
            />
          )}

          <FormError>{error}</FormError>

          <div className="flex flex-wrap items-center justify-end gap-3 border-t border-line pt-6">
            <Link to={isEdit ? `/forum/${slug}` : '/forum'} className="btn btn-ghost">
              {t('common.cancel')}
            </Link>
            <button type="submit" disabled={saving} className="btn btn-primary">
              {saving && <Spinner />}
              {isEdit ? t('common.save') : t('forum.publish')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
