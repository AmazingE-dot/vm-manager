import { Server } from 'lucide-react';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';

export function VmListPage() {
  return (
    <>
      <PageHeader
        title="Máquinas virtuales"
        description="Listado de VMs con búsqueda y filtro por estado."
      />
      <Card>
        <EmptyState
          icon={<Server size={22} strokeWidth={1.75} />}
          title="En construcción"
          description="El listado con skeletons, búsqueda y filtros llega en la Fase 4."
        />
      </Card>
    </>
  );
}
