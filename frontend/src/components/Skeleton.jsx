// هياكل تحميل بنفس أبعاد المحتوى الحقيقي — هيك ما بتصير قفزة بالتخطيط (layout shift)
// لما توصل البيانات.

function Block({ className = '' }) {
  return <div className={`skeleton ${className}`} />;
}

export function ProjectCardSkeleton() {
  return (
    <div className="card flex flex-col gap-4 p-5">
      <div className="flex items-center justify-between">
        <Block className="h-5 w-24" />
        <Block className="h-4 w-10" />
      </div>
      <Block className="h-5 w-3/4" />
      <div className="flex flex-col gap-2">
        <Block className="h-3.5 w-full" />
        <Block className="h-3.5 w-2/3" />
      </div>
      <div className="mt-2 flex items-center justify-between border-t border-line-soft pt-4">
        <Block className="h-7 w-28 rounded-full" />
        <Block className="h-4 w-20" />
      </div>
    </div>
  );
}

export function ProjectGridSkeleton({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <ProjectCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function ListRowSkeleton() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-line p-4">
      <Block className="h-10 w-10 shrink-0 rounded-full" />
      <div className="flex-1 space-y-2">
        <Block className="h-4 w-1/3" />
        <Block className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 4 }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: count }).map((_, index) => (
        <ListRowSkeleton key={index} />
      ))}
    </div>
  );
}

export function ProjectDetailSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div className="flex-1 space-y-3">
          <Block className="h-4 w-24" />
          <Block className="h-8 w-2/3" />
          <Block className="h-4 w-1/3" />
        </div>
        <div className="flex gap-2">
          <Block className="h-10 w-24 rounded-xl" />
          <Block className="h-10 w-32 rounded-xl" />
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Block className="h-80 w-full rounded-2xl" />
        <Block className="hidden h-64 w-full rounded-2xl lg:block" />
      </div>
    </div>
  );
}

export default Block;
