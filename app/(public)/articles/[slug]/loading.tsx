import { Skeleton } from "@/components/ui/skeleton";

export default function ArticleLoading() {
  return (
    <article className="max-w-4xl mx-auto space-y-8">
      {/* Cover Image Skeleton */}
      <Skeleton className="w-full h-[400px] rounded-lg" />

      {/* Header Skeleton */}
      <header className="space-y-6">
        {/* Categories */}
        <div className="flex gap-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-5 w-24" />
        </div>

        {/* Title */}
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-3/4" />

        {/* Excerpt */}
        <Skeleton className="h-6 w-full" />

        {/* Meta */}
        <div className="flex items-center gap-3 py-4 border-y">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </header>

      {/* Content Skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-4/5" />
        <div className="py-4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>

      {/* Comments Section Skeleton */}
      <div className="space-y-6 pt-8 border-t">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />

        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-4">
            <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}
