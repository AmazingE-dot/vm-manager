import { useMemo } from 'react';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useVms } from '../vms/hooks/useVms';
import { ResourceCharts, ResourceChartsSkeleton } from './ResourceCharts';
import { StatCards, StatCardsSkeleton } from './StatCards';
import { summarizeVms } from './stats';

export function DashboardPage() {
  useDocumentTitle('Dashboard');
  const { data: vms, isPending, isError, refetch } = useVms();
  const summary = useMemo(() => summarizeVms(vms ?? []), [vms]);

  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Recursos asignados a tus máquinas virtuales encendidas."
      />

      {isPending ? (
        <>
          <StatCardsSkeleton />
          <div className="mt-6">
            <ResourceChartsSkeleton />
          </div>
        </>
      ) : isError ? (
        <Card>
          <EmptyState
            title="No se pudieron cargar los datos"
            description="Revisa tu conexión e inténtalo de nuevo."
            action={
              <Button
                variant="secondary"
                onClick={() => {
                  void refetch();
                }}
              >
                Reintentar
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <StatCards summary={summary} />
          <div className="mt-6">
            <ResourceCharts activeVms={summary.activeVms} totalCount={summary.totalCount} />
          </div>
        </>
      )}
    </>
  );
}
