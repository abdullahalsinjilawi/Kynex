/**
 * مصدر واحد لكل ما يخص أنواع المنشورات والتفاعلات بالمنتدى: المفتاح، الأيقونة،
 * ولون البادج. أي تعديل هون بينعكس على البطاقة والفلاتر وصفحة المنشور والمحرّر —
 * بدل ما نكرّر نفس الجدول بأربع أماكن وننسى نحدّث وحدة منهم.
 *
 * ملاحظة: مفاتيح الأنواع لازم تطابق enum بالباك اند (models/Post.js).
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
};

function NewsIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M4 6.5A1.5 1.5 0 0 1 5.5 5h10A1.5 1.5 0 0 1 17 6.5V18a1.5 1.5 0 0 0 1.5 1.5H6a2 2 0 0 1-2-2Z" />
      <path d="M17 9h1.5A1.5 1.5 0 0 1 20 10.5V18" />
      <path d="M7.5 8.5h6M7.5 12h6M7.5 15.5h3.5" />
    </svg>
  );
}

function ArticleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M6 3.5h8.5L19 8v12.5H6Z" />
      <path d="M14 3.5V8h5" />
      <path d="M9 12h6M9 15.5h6" />
    </svg>
  );
}

function ResearchIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <circle cx="10.5" cy="10.5" r="6" />
      <path d="m15.2 15.2 4.3 4.3" />
      <path d="M8 10.5h5M10.5 8v5" />
    </svg>
  );
}

function StoryIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M4.5 5.5A1.5 1.5 0 0 1 6 4h5v16H6a1.5 1.5 0 0 1-1.5-1.5Z" />
      <path d="M19.5 5.5A1.5 1.5 0 0 0 18 4h-5v16h5a1.5 1.5 0 0 0 1.5-1.5Z" />
    </svg>
  );
}

function DiscussionIcon(props) {
  return (
    <svg viewBox="0 0 24 24" {...stroke} {...props}>
      <path d="M20 13.5a2.5 2.5 0 0 1-2.5 2.5H9l-4 3.5V6.5A2.5 2.5 0 0 1 7.5 4h10A2.5 2.5 0 0 1 20 6.5Z" />
      <path d="M9 9h7M9 12h4.5" />
    </svg>
  );
}

/**
 * كل نوع إله لونه الخاص، بس كلهم من نفس عائلة هوية المنصة (بنفسجي/سماوي/ذهبي)
 * حتى ما تصير الصفحة قوس قزح. الألوان مكتوبة بـ rgb/ mix عبر التوكنز نفسها.
 */
export const POST_TYPES = [
  {
    key: 'news',
    labelKey: 'forum.types.news',
    Icon: NewsIcon,
    chip: 'bg-brand/12 text-brand-light border-brand/25',
    dot: 'bg-brand',
  },
  {
    key: 'article',
    labelKey: 'forum.types.article',
    Icon: ArticleIcon,
    chip: 'bg-accent/12 text-accent border-accent/25',
    dot: 'bg-accent',
  },
  {
    key: 'research',
    labelKey: 'forum.types.research',
    Icon: ResearchIcon,
    chip: 'bg-success/12 text-success border-success/25',
    dot: 'bg-success',
  },
  {
    key: 'story',
    labelKey: 'forum.types.story',
    Icon: StoryIcon,
    chip: 'bg-gold/12 text-gold border-gold/25',
    dot: 'bg-gold',
  },
  {
    key: 'discussion',
    labelKey: 'forum.types.discussion',
    Icon: DiscussionIcon,
    chip: 'bg-elevated text-muted border-line',
    dot: 'bg-muted',
  },
];

export const POST_TYPE_MAP = POST_TYPES.reduce((acc, type) => {
  acc[type.key] = type;
  return acc;
}, {});

export function postTypeOf(key) {
  return POST_TYPE_MAP[key] || POST_TYPE_MAP.discussion;
}

/** التفاعلات: رموز تعبيرية مقصودة — أسرع للقراءة من أيقونات خطية متشابهة. */
export const REACTIONS = [
  { key: 'like', emoji: '👍', labelKey: 'forum.reactions.like' },
  { key: 'insightful', emoji: '💡', labelKey: 'forum.reactions.insightful' },
  { key: 'fire', emoji: '🔥', labelKey: 'forum.reactions.fire' },
  { key: 'celebrate', emoji: '🎉', labelKey: 'forum.reactions.celebrate' },
  { key: 'curious', emoji: '🤔', labelKey: 'forum.reactions.curious' },
];

export const REACTION_MAP = REACTIONS.reduce((acc, r) => {
  acc[r.key] = r;
  return acc;
}, {});
