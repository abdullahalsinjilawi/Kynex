import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import hljs from 'highlight.js/lib/core';
import apiClient from '../api/client';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full max-w-3xl flex-col overflow-hidden rounded-xl border border-ink-border bg-ink-surface-raised light:border-paper-border light:bg-paper-surface"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink-border px-4 py-3 light:border-paper-border">
          <span className="truncate font-mono text-sm">{file.relativePath || file.filename}</span>
          <button
            onClick={onClose}
            className="shrink-0 rounded-lg p-1 text-ink-muted hover:bg-ink-surface light:text-paper-muted light:hover:bg-paper"
            aria-label={t('common.close')}
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="overflow-auto p-4">
          {state.loading ? (
            <p className="text-sm text-ink-muted light:text-paper-muted">{t('common.loading')}</p>
          ) : state.error ? (
            <div className="flex flex-col items-start gap-3">
              <p className="text-sm text-ink-muted light:text-paper-muted">{state.error}</p>
              <a
                href={`${apiClient.defaults.baseURL}/projects/${slug}/download`}
                className="text-sm text-violet-400 hover:underline"
              >
                {t('filePreview.downloadInstead')}
              </a>
            </div>
          ) : (
            <pre className="markdown-body">
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
