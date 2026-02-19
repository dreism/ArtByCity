export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-zinc-200 rounded-lg ${className}`} />
  );
}

export function GalleryCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-zinc-100">
      <Skeleton className="aspect-square w-full rounded-none" />
      <div className="p-3 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
    </div>
  );
}

export function GalleryGridSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 9 }).map((_, i) => (
        <GalleryCardSkeleton key={i} />
      ))}
    </div>
  );
}
