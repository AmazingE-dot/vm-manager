import { LayoutDashboard } from 'lucide-react';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';

export function DashboardPage() {
  return (
    <>
      <PageHeader title="Dashboard" description="Resumen de recursos de tus máquinas virtuales." />
      <Card>
        <EmptyState
          icon={<LayoutDashboard size={22} strokeWidth={1.75} />}
          title="En construcción"
          description="Las tarjetas de resumen y los gráficos llegan en la Fase 5."
        />
      </Card>
    </>
  );
}
