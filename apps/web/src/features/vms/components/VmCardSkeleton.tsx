import { Card } from '../../../components/Card';
import { Skeleton } from '../../../components/Skeleton';

export function VmCardSkeleton() {
  return (
    <Card className="flex flex-col gap-4 p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-20" />
        </div>
        <Skeleton className="h-6 w-24 rounded-full" />
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <div className="border-t border-separator pt-4">
        <Skeleton className="h-8 w-full" />
      </div>
    </Card>
  );
}
