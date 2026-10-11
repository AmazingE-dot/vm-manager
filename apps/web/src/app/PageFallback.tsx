import { Card } from '../components/Card';
import { Skeleton } from '../components/Skeleton';

/** Fallback de Suspense para páginas cargadas con `React.lazy`. */
export function PageFallback() {
  return (
    <div aria-busy="true" aria-label="Cargando la página">
      <div className="mb-6 flex flex-col gap-2">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <Card key={index} className="flex flex-col gap-4 p-5">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-24 w-full" />
          </Card>
        ))}
      </div>
    </div>
  );
}
