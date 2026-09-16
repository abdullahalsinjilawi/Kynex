import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import MarkdownView from './MarkdownView';

/**
 * محرّر Markdown بسيط بتبويبين (كتابة / معاينة) + شريط أدوات بيلفّ النص المحدّد.
 *
 * ملاحظة RTL: المحرّر نفسه بيضل LTR (dir="auto" على textarea) لأنو Markdown فيه
 * رموز بداية سطر (#، -، >) بتنعكس بشكل مربك لو أجبرنا الاتجاه. dir="auto" بيخلي
 * المتصفح يقرر حسب أول حرف فعلي بالسطر، وهاد أدق شي للمحتوى المختلط عربي/إنجليزي.
 */
export default function MarkdownEditor({
  value,
  onChange,
  placeholder,
  rows = 14,
  maxLength = 50000,
  id = 'markdown-editor',
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState('write');
  const textareaRef = useRef(null);

  // بتلفّ النص المحدّد برموز Markdown، وبترجّع المؤشر مكانه المنطقي بعد التعديل
  const wrap = (before, after = before, fallback = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = value.slice(start, end) || fallback;
    const next = `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`;

    onChange(next.slice(0, maxLength));

    // نرجّع الفوكس والتحديد بعد ما React يعيد الرسم
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(start + before.length, start + before.length + selected.length);
    });
  };

  const tools = [
    { label: 'B', title: t('forum.editor.bold'), action: () => wrap('**'), className: 'font-bold' },
    { label: 'I', title: t('forum.editor.italic'), action: () => wrap('*'), className: 'italic' },
    { label: 'H', title: t('forum.editor.heading'), action: () => wrap('## ', ''), className: 'font-bold' },
    { label: '"', title: t('forum.editor.quote'), action: () => wrap('> ', '') },
    { label: '</>', title: t('forum.editor.code'), action: () => wrap('`'), className: 'font-mono text-[11px]' },
    { label: '{ }', title: t('forum.editor.codeBlock'), action: () => wrap('\n```\n', '\n```\n'), className: 'font-mono text-[11px]' },
    { label: '•', title: t('forum.editor.list'), action: () => wrap('- ', '') },
    { label: '🔗', title: t('forum.editor.link'), action: () => wrap('[', '](https://)', t('forum.editor.linkText')) },
  ];

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line bg-elevated/60 px-2 py-1.5">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab('write')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'write' ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            {t('forum.editor.write')}
          </button>
          <button
            type="button"
            onClick={() => setTab('preview')}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              tab === 'preview' ? 'bg-surface text-fg shadow-sm' : 'text-muted hover:text-fg'
            }`}
          >
            {t('forum.editor.preview')}
          </button>
        </div>

        {tab === 'write' && (
          <div className="flex flex-wrap items-center gap-0.5">
            {tools.map((tool) => (
              <button
                key={tool.title}
                type="button"
                onClick={tool.action}
                title={tool.title}
                aria-label={tool.title}
                className={`inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-1.5 text-sm text-muted transition-colors hover:bg-surface hover:text-fg ${tool.className || ''}`}
              >
                {tool.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {tab === 'write' ? (
        <textarea
          id={id}
          ref={textareaRef}
          dir="auto"
          rows={rows}
          maxLength={maxLength}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="block w-full resize-y border-0 bg-transparent px-4 py-3.5 font-body text-[15px] leading-relaxed text-fg placeholder:text-muted/70 focus:outline-none"
        />
      ) : (
        <div className="min-h-50 px-4 py-3.5">
          {value.trim() ? (
            <MarkdownView content={value} />
          ) : (
            <p className="text-sm text-muted">{t('forum.editor.nothingToPreview')}</p>
          )}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-line-soft px-4 py-2 text-xs text-muted">
        <span>{t('forum.editor.markdownSupported')}</span>
        <span className="tnum">
          {value.length} / {maxLength}
        </span>
      </div>
    </div>
  );
}
