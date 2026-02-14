import { Shield, Calendar, FileSearch, Sparkles } from 'lucide-react';
import PageLoader from './PageLoader';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className = '' }: SkeletonProps) {
  return <div className={`skeleton ${className}`} />;
}

const TIMELINE_STEPS = [
  { icon: FileSearch, text: 'Analyzing your visa status...' },
  { icon: Calendar, text: 'Calculating key deadlines...' },
  { icon: Shield, text: 'Evaluating risk factors...' },
  { icon: Sparkles, text: 'Building your personalized timeline...' },
];

export function TimelineSkeleton() {
  return (
    <PageLoader
      title="Generating Your Timeline"
      subtitle="Our AI is crafting your personalized immigration roadmap"
      steps={TIMELINE_STEPS}
      icon={Sparkles}
    />
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
