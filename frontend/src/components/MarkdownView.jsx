import { useMemo } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import hljs from 'highlight.js/lib/core';
import javascript from 'highlight.js/lib/languages/javascript';
import typescript from 'highlight.js/lib/languages/typescript';
import python from 'highlight.js/lib/languages/python';
import bash from 'highlight.js/lib/languages/bash';
import json from 'highlight.js/lib/languages/json';
import yaml from 'highlight.js/lib/languages/yaml';
import xml from 'highlight.js/lib/languages/xml';
import css from 'highlight.js/lib/languages/css';
import cpp from 'highlight.js/lib/languages/cpp';
import java from 'highlight.js/lib/languages/java';
import sql from 'highlight.js/lib/languages/sql';

// نسجّل بس أشيع اللغات اللي متوقع تظهر بمشاريع الذكاء الاصطناعي (بايثون، جافاسكريبت،
// C++...) بدل تحميل كل لغات highlight.js (~190 لغة) وتثقيل حجم الباندل بلا داعي
hljs.registerLanguage('javascript', javascript);
hljs.registerLanguage('typescript', typescript);
hljs.registerLanguage('python', python);
hljs.registerLanguage('bash', bash);
hljs.registerLanguage('shell', bash);
hljs.registerLanguage('json', json);
hljs.registerLanguage('yaml', yaml);
hljs.registerLanguage('xml', xml);
hljs.registerLanguage('html', xml);
hljs.registerLanguage('css', css);
hljs.registerLanguage('cpp', cpp);
hljs.registerLanguage('c', cpp);
hljs.registerLanguage('java', java);
hljs.registerLanguage('sql', sql);

const renderer = new marked.Renderer();
renderer.code = ({ text, lang }) => {
  const language = hljs.getLanguage(lang) ? lang : undefined;
  const highlighted = language
    ? hljs.highlight(text, { language }).value
    : hljs.highlightAuto(text).value;
  return `<pre><code class="hljs${language ? ` language-${language}` : ''}">${highlighted}</code></pre>`;
};

marked.setOptions({ breaks: true, gfm: true, renderer });

// بيحوّل Markdown (زي README المشروع) لـ HTML، مع تلوين أكواد فعلي (highlight.js)،
// ودايماً بينظفه عبر DOMPurify قبل العرض. هاد التنظيف إجباري مش تحسين اختياري: المحتوى
// مكتوب من مستخدم آخر (صاحب المشروع)، فلو عرضناه كـ HTML خام بدون تنظيف كان ممكن يحقن
// <script> أو onerror= أو أي كود تنفيذي جوا صفحة أي زائر تاني (XSS مخزّن) - DOMPurify
// بيشيل أي شي تنفيذي ويسيب بس عناصر التنسيق الآمنة (عناوين، قوائم، كود، روابط...)
export default function MarkdownView({ content, className = '' }) {
  const html = useMemo(() => {
    if (!content) return '';
    const raw = marked.parse(content);
    // نسمح لـ DOMPurify بإبقاء class على <span>/<code>/<pre> حتى تنحفظ ألوان highlight.js
    // (افتراضياً DOMPurify بيشيل خاصية class من العناصر لأنها مو من ملفه الافتراضي الآمن)
    return DOMPurify.sanitize(raw, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ['class'],
    });
  }, [content]);

  if (!content) return null;

  return (
    <div className={`markdown-body ${className}`} dangerouslySetInnerHTML={{ __html: html }} />
  );
}
