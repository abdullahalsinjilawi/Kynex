/**
 * ترويسة موحّدة لكل صفحة داخلية (تصفّح، إعدادات، إشعارات...).
 * قبل هيك كل صفحة كانت تبلّش بـ h1 صغير على خلفية فاضية، فالصفحات كلها بتحس
 * إنها نفس الصفحة. هون في شريط له خلفية خفيفة بيفصل الترويسة عن المحتوى.
 */
export default function PageHeader({ title, description, actions, children }) {
  return (
    <div className="border-b border-line bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-2xl">
            <h1 className="font-display text-2xl font-bold tracking-tight sm:text-[28px]">
              {title}
            </h1>
            {description && (
              <p className="mt-2 text-sm leading-relaxed text-muted sm:text-[15px]">{description}</p>
            )}
          </div>
          {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
        </div>
        {children}
      </div>
    </div>
  );
}
