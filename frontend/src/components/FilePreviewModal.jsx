import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import hljs from 'highlight.js/lib/core';
import apiClient from '../api/client';
import useDismissable from '../hooks/useDismissable';

const EXT_TO_LANG = {
  py: 'python',
  js: 'javascript',
  jsx: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  json: 'json',
  yml: 'yaml',
  yaml: 'yaml',
  sh: 'bash',
  bash: 'bash',
  zsh: 'bash',
  c: 'cpp',
  h: 'cpp',
  cpp: 'cpp',
  hpp: 'cpp',
  cc: 'cpp',
  java: 'java',
  sql: 'sql',
  css: 'css',
  scss: 'css',
  html: 'xml',
  htm: 'xml',
  xml: 'xml',
};

function detectLang(filename) {
  const ext = filename.split('.').pop()?.toLowerCase();
  return EXT_TO_LANG[ext];
}

// slug: سلاج المشروع، file: { _id, filename, relativePath } - نجيب محتواها من
// GET /api/projects/:slug/files/:fileId/content ونعرضها ملوّنة (highlight.js)
export default function FilePreviewModal({ slug, file, onClose }) {
  const { t } = useTranslation();
  const [state, setState] = useState({ loading: true, content: '', error: '' });

  useDismissable(onClose);

  useEffect(() => {
    let cancelled = false;
    setState({ loading: true, content: '', error: '' });

    apiClient
      .get(`/projects/${slug}/files/${file._id}/content`)
      .then((res) => {
        if (cancelled) return;
        setState({ loading: false, content: res.data.content, error: '' });
      })
      .catch((err) => {
        if (cancelled) return;
        setState({
          loading: false,
          content: '',
          error: err.response?.data?.message || t('filePreview.genericError'),
        });
      });

    return () => {
      cancelled = true;
    };
  }, [slug, file._id, t]);

  const lang = detectLang(file.filename);
  const highlighted = !state.loading && !state.error
    ? lang && hljs.getLanguage(lang)
      ? hljs.highlight(state.content, { language: lang }).value
      : hljs.highlightAuto(state.content).value
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-4 backdrop-blur-sm" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={file.relativePath || file.filename}
        onClick={(e) => e.stopPropagation()}
        className="animate-card-in flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-line bg-elevated shadow-pop"
      >
        <div className="flex items-center justify-between gap-3 border-b border-line bg-surface/60 px-4 py-3">
          <span className="truncate font-mono text-sm" dir="ltr">
            {file.relativePath || file.filename}
          </span>
          <button onClick={onClose} className="icon-btn" aria-label={t('common.close')}>
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-auto p-4">
          {state.loading ? (
            <p className="text-sm text-muted">{t('common.loading')}</p>
          ) : state.error ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-muted">{state.error}</p>
              <a
                href={`${apiClient.defaults.baseURL}/projects/${slug}/download`}
                className="text-sm text-brand-light hover:underline"
              >
                {t('filePreview.downloadInstead')}
              </a>
            </div>
          ) : (
            <pre className="markdown-body" dir="ltr">
              <code
                className="hljs"
                dangerouslySetInnerHTML={{ __html: highlighted }}
              />
            </pre>
          )}
        </div>
      </div>
    </div>
  );
}
