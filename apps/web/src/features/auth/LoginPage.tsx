import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@vm-manager/shared';
import { Server } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextInput } from '../../components/TextInput';
import { ApiError } from '../../lib/httpClient';
import { useAuth } from './useAuth';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isValid },
    setError,
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    mode: 'onChange',
    defaultValues: { email: '', password: '' },
  });

  // Si ya hay sesión (p. ej. tras el login), se redirige al destino original.
  if (isAuthenticated) {
    const state = location.state as LocationState | null;
    return <Navigate to={state?.from ?? '/'} replace />;
  }

  const onSubmit = handleSubmit(async (values) => {
    try {
      const user = await login(values.email, values.password);
      toast.success(`Bienvenido, ${user.name}`);
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'No se pudo iniciar sesión. Inténtalo de nuevo.';
      setError('root', { message });
    }
  });

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <div className="flex size-14 items-center justify-center rounded-card bg-surface-2">
            <Server className="text-accent" size={28} strokeWidth={1.5} />
          </div>
          <div className="flex flex-col gap-1">
            <h1 className="text-title">VM Manager</h1>
            <p className="text-sub text-text-secondary">Gestiona tus máquinas virtuales</p>
          </div>
        </div>

        <Card className="p-6">
          <form
            className="flex flex-col gap-4"
            noValidate
            onSubmit={(event) => {
              void onSubmit(event);
            }}
          >
            <TextInput
              label="Email"
              type="email"
              autoComplete="email"
              placeholder="tu@email.com"
              error={errors.email?.message}
              {...register('email')}
            />
            <TextInput
              label="Contraseña"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />

            {errors.root?.message ? (
              <p
                role="alert"
                className="rounded-control bg-danger/10 px-3.5 py-2.5 text-sub text-danger"
              >
                {errors.root.message}
              </p>
            ) : null}

            <Button type="submit" className="mt-1 w-full" disabled={!isValid || isSubmitting}>
              {isSubmitting ? 'Entrando…' : 'Iniciar sesión'}
            </Button>
          </form>
        </Card>

        <p className="mt-6 text-center text-caption text-text-secondary">
          Demo: admin@ifx.test · Admin123! — client@ifx.test · Client123!
        </p>
      </div>
    </div>
  );
}
