/**
 * رسالة خطأ الفورم. role="alert" ضروري: بدونه قارئ الشاشة ما بيعرف إنو طلع خطأ،
 * والمستخدم بيضل يضغط "دخول" بدون ما يفهم ليش ما صار شي.
 */
export default function FormError({ children }) {
  if (!children) return null;

  return (
    <p
      role="alert"
      className="flex items-start gap-2 rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-danger"
    >
      <svg className="mt-0.5 h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7.5v5M12 16h.01" />
      </svg>
      <span>{children}</span>
    </p>
  );
}
