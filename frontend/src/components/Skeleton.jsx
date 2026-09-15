// قطع بناء بسيطة لعرض "هيكل" الصفحة وهي عم تتحمّل، بدل نص ثابت بيقفز فجأة لمحتوى
// كامل. كل قطعة عبارة عن مستطيل/دائرة رمادية نابضة (animate-pulse من Tailwind).

function Block({ className = '' }) {
  return <div className={`animate-pulse rounded-md bg-ink-surface light:bg-paper-surface ${className}`} />;
}

// شكل بطاقة مشروع (لمعاينة قائمة المشاريع وهي عم تتحمّل - نفس أبعاد ProjectCard تقريباً)
export function ProjectCardSkeleton() {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ink-border bg-ink-surface p-6 light:border-paper-border light:bg-paper-surface">
      <Block className="h-5 w-24" />
      <Block className="h-5 w-3/4" />
      <Block className="h-4 w-full" />
      <Block className="h-4 w-2/3" />
      <div className="flex gap-2">
        <Block className="h-6 w-16" />
        <Block className="h-6 w-16" />
      </div>
      <div className="flex items-center justify-between border-t border-ink-border pt-4 light:border-paper-border">
        <Block className="h-6 w-24" />
        <Block className="h-6 w-16" />
      </div>
    </div>
  );
}

// شبكة من بطاقات المشاريع الوهمية - نمررها count للتحكم بعددها حسب مكان الاستخدام
export function ProjectGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}

// سطر قائمة بسيط (محادثة، إشعار، تعليق...) - أفاتار دائرية + سطرين نص
export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 p-3">
      <Block className="h-9 w-9 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Block className="h-4 w-1/3" />
        <Block className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="flex flex-col gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <ListRowSkeleton key={i} />
      ))}
    </div>
  );
}

// هيكل صفحة تفاصيل مشروع (عنوان + وصف + تابات)
export function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Block className="h-7 w-2/3" />
          <Block className="h-4 w-1/3" />
        </div>
        <div className="flex gap-2">
          <Block className="h-9 w-20" />
          <Block className="h-9 w-28" />
        </div>
      </div>
      <Block className="mb-2 h-4 w-full" />
      <Block className="mb-6 h-4 w-2/3" />
      <Block className="h-64 w-full" />
    </div>
  );
}

export default Block;
