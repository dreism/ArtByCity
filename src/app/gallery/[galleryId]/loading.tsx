import { Skeleton } from '@/components/ui/Skeleton';

export default function GalleryLoading() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 mb-6">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-4" />
        <Skeleton className="h-4 w-24" />
      </div>

      <div className="flex gap-6 pb-6 border-b border-zinc-100">
        <Skeleton className="w-20 h-20 rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-3">
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-32" />
          <div className="flex gap-6">
            <Skeleton className="h-10 w-16" />
            <Skeleton className="h-10 w-16" />
          </div>
        </div>
      </div>

      <div className="mt-8 grid gap-1" style={{ columns: 'auto 160px' }}>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="mb-1 break-inside-avoid animate-pulse bg-zinc-200 rounded-lg" style={{ height: `${140 + (i % 3) * 60}px` }} />
        ))}
      </div>
    </div>
  );
}
