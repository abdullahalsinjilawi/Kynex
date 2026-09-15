// أيقونات بسيطة بخطوط هندسية (نفس أسلوب شعار K وزخرفة شبكة العُقد بالـ hero) - نستخدمها
// بكل حالة "ما فيه شي لسه" بالموقع بدل الاعتماد على نص بس داخل صندوق متقطّع
const ICONS = {
  projects: (
    <>
      <rect x="14" y="18" width="36" height="28" rx="4" />
      <path d="M14 26h36" />
      <circle cx="20" cy="22" r="1.4" fill="currentColor" stroke="none" />
      <circle cx="25" cy="22" r="1.4" fill="currentColor" stroke="none" />
    </>
  ),
  comments: (
    <>
      <path d="M14 16h36v22H30l-8 8v-8h-8z" />
      <path d="M22 25h20M22 32h13" />
    </>
  ),
  messages: (
    <>
      <circle cx="24" cy="32" r="10" />
      <circle cx="42" cy="24" r="7" />
      <path d="M18 38l-3 6 7-3" />
    </>
  ),
  notifications: (
    <>
      <path d="M22 26a10 10 0 0 1 20 0c0 11.7 5 15 5 15H17s5-3.3 5-15" />
      <path d="M28.3 46a3.9 3.9 0 0 0 7.4 0" />
    </>
  ),
  search: (
    <>
      <circle cx="27" cy="27" r="13" />
      <path d="m37 37 9 9" />
    </>
  ),
  files: (
    <>
      <path d="M18 14h16l8 8v24H18z" />
      <path d="M34 14v8h8M24 30h12M24 36h12" />
    </>
  ),
};

// title/description نصوص جاهزة (مترجمة already من الصفحة اللي بتستدعيها)
// icon: أحد مفاتيح ICONS بالأعلى
export default function EmptyState({ icon = 'search', title, description }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-ink-border px-6 py-14 text-center light:border-paper-border">
      <svg
        viewBox="0 0 64 64"
        className="h-14 w-14 text-ink-border light:text-paper-border"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {ICONS[icon] || ICONS.search}
      </svg>
      {title && <p className="text-sm font-medium text-ink-text light:text-paper-text">{title}</p>}
      {description && (
        <p className="max-w-xs text-sm text-ink-muted light:text-paper-muted">{description}</p>
      )}
    </div>
  );
}
