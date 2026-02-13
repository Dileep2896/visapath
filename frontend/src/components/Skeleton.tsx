interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

export function TimelineSkeleton() {
  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Status badge skeleton */}
      <div className="bg-navy-900 rounded-xl border border-navy-700 p-5">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-48" />
          </div>
          <div className="text-right space-y-2">
            <Skeleton className="h-8 w-12 ml-auto" />
            <Skeleton className="h-3 w-20 ml-auto" />
          </div>
        </div>
      </div>

      {/* Timeline skeleton */}
      <div className="space-y-0">
        <Skeleton className="h-5 w-32 mb-4" />
        <div className="relative">
          <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-navy-700" />
          {[...Array(5)].map((_, i) => (
            <div key={i} className="relative pl-12 pb-6 animate-fade-in-up" style={{ animationDelay: `${i * 100}ms` }}>
              <div className="absolute left-2.5 top-3 w-4 h-4 rounded-full bg-navy-700" />
              <div className="rounded-xl border border-navy-700 bg-navy-800 p-4 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function DocumentSkeleton() {
  return (
    <div className="divide-y divide-navy-700">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="flex items-start gap-4 p-4">
          <Skeleton className="w-5 h-5 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}
