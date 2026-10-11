import { SquarePen } from 'lucide-react';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';

export function VmFormPage() {
  return (
    <>
      <PageHeader title="Formulario de VM" description="Crear o editar una máquina virtual." />
      <Card>
        <EmptyState
          icon={<SquarePen size={22} strokeWidth={1.75} />}
          title="En construcción"
          description="El formulario con validación en tiempo real llega en la Fase 4."
        />
      </Card>
    </>
  );
}
