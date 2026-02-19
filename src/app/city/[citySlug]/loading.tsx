import { GalleryGridSkeleton } from '@/components/ui/Skeleton';

export default function CityLoading() {
  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="mb-8">
        <div className="h-4 w-32 bg-zinc-200 rounded animate-pulse mb-3" />
        <div className="h-8 w-64 bg-zinc-200 rounded animate-pulse" />
      </div>
      <GalleryGridSkeleton />
    </div>
  );
}
