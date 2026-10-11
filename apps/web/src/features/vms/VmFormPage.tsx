import { zodResolver } from '@hookform/resolvers/zod';
import {
  OPERATING_SYSTEMS,
  vmCreateSchema,
  type Vm,
  type VmCreateFormInput,
  type VmCreateInput,
  type VmUpdateInput,
} from '@vm-manager/shared';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { Link, useNavigate, useParams } from 'react-router';
import { Button, buttonClasses } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { PageHeader } from '../../components/PageHeader';
import { Select } from '../../components/Select';
import { Skeleton } from '../../components/Skeleton';
import { TextInput } from '../../components/TextInput';
import { Toggle } from '../../components/Toggle';
import { ApiError } from '../../lib/httpClient';
import { OS_LABELS, VM_STATUS_LABELS } from './labels';
import { useVmMutations } from './hooks/useVmMutations';
import { useVms } from './hooks/useVms';

const OS_OPTIONS = OPERATING_SYSTEMS.map((os) => ({ value: os, label: OS_LABELS[os] }));

export function VmFormPage() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const { data: vms, isPending } = useVms();

  if (isEdit && isPending) {
    return (
      <>
        <PageHeader title="Editar VM" />
        <Card className="max-w-2xl p-6">
          <div className="flex flex-col gap-5">
            <Skeleton className="h-16 w-full" />
            <div className="grid gap-5 sm:grid-cols-3">
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
              <Skeleton className="h-16 w-full" />
            </div>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-14 w-full" />
          </div>
        </Card>
      </>
    );
  }

  const vm = isEdit ? vms?.find((item) => item.id === id) : undefined;

  if (isEdit && !vm) {
    return (
      <>
        <PageHeader title="Editar VM" />
        <Card className="max-w-2xl">
          <EmptyState
            title="La VM no existe"
            description="Puede que se haya eliminado o que el enlace no sea válido."
            action={
              <Link to="/vms" className={buttonClasses('secondary')}>
                Volver al listado
              </Link>
            }
          />
        </Card>
      </>
    );
  }

  // La `key` fuerza un formulario nuevo al cambiar entre crear y editar.
  return <VmForm key={vm?.id ?? 'new'} vm={vm} />;
}

function VmForm({ vm }: { vm?: Vm }) {
  const isEdit = vm !== undefined;
  const navigate = useNavigate();
  const { createVm, updateVm } = useVmMutations();

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting, isValid },
  } = useForm<VmCreateFormInput, unknown, VmCreateInput>({
    resolver: zodResolver(vmCreateSchema),
    mode: 'onChange',
    defaultValues: vm
      ? { name: vm.name, cores: vm.cores, ram: vm.ram, disk: vm.disk, os: vm.os, status: vm.status }
      : { name: '', os: 'UBUNTU', status: 'STOPPED' },
  });

  const status = useWatch({ control, name: 'status' }) ?? 'STOPPED';

  const onSubmit = handleSubmit(async (values) => {
    try {
      if (isEdit && vm) {
        const input: VmUpdateInput = { ...values };
        await updateVm.mutateAsync({ id: vm.id, input });
      } else {
        await createVm.mutateAsync(values);
      }
      await navigate('/vms');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'CONFLICT') {
        setError('name', { message: error.message });
        return;
      }
      if (error instanceof ApiError && error.details && error.details.length > 0) {
        for (const detail of error.details) {
          if (detail.path in values) {
            setError(detail.path as keyof VmCreateInput, { message: detail.message });
          }
        }
        return;
      }
      setError('root', {
        message: error instanceof ApiError ? error.message : 'No se pudo guardar la VM',
      });
    }
  });

  return (
    <>
      <PageHeader
        title={isEdit ? 'Editar VM' : 'Nueva VM'}
        description={
          isEdit
            ? `Modifica la configuración de "${vm.name}".`
            : 'Define los recursos de la nueva máquina virtual.'
        }
      />

      <Card className="max-w-2xl p-6">
        <form
          noValidate
          className="flex flex-col gap-5"
          onSubmit={(event) => {
            void onSubmit(event);
          }}
        >
          <TextInput
            label="Nombre"
            placeholder="web-server-01"
            autoComplete="off"
            error={errors.name?.message}
            {...register('name')}
          />

          <div className="grid gap-5 sm:grid-cols-3">
            <TextInput
              label="vCPU"
              type="number"
              min={1}
              max={64}
              step={1}
              error={errors.cores?.message}
              {...register('cores', { valueAsNumber: true })}
            />
            <TextInput
              label="RAM (GB)"
              type="number"
              min={1}
              max={512}
              step={1}
              error={errors.ram?.message}
              {...register('ram', { valueAsNumber: true })}
            />
            <TextInput
              label="Disco (GB)"
              type="number"
              min={10}
              max={4096}
              step={1}
              error={errors.disk?.message}
              {...register('disk', { valueAsNumber: true })}
            />
          </div>

          <Select
            label="Sistema operativo"
            options={OS_OPTIONS}
            error={errors.os?.message}
            {...register('os')}
          />

          <div className="flex items-center justify-between gap-4 rounded-control bg-surface-2 px-4 py-3">
            <div>
              <p className="text-sub font-medium">{VM_STATUS_LABELS[status]}</p>
              <p className="text-caption text-text-secondary">
                {status === 'RUNNING' ? 'La VM quedará encendida.' : 'La VM quedará apagada.'}
              </p>
            </div>
            <Controller
              control={control}
              name="status"
              render={({ field }) => (
                <Toggle
                  checked={field.value === 'RUNNING'}
                  ariaLabel="Estado de la VM"
                  onChange={(checked) => {
                    field.onChange(checked ? 'RUNNING' : 'STOPPED');
                  }}
                />
              )}
            />
          </div>

          {errors.root?.message ? (
            <p
              role="alert"
              className="rounded-control bg-danger/10 px-3.5 py-2.5 text-sub text-danger"
            >
              {errors.root.message}
            </p>
          ) : null}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <Link to="/vms" className={buttonClasses('secondary')}>
              Cancelar
            </Link>
            <Button type="submit" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear VM'}
            </Button>
          </div>
        </form>
      </Card>
    </>
  );
}
