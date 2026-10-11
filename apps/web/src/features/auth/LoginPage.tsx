import { zodResolver } from '@hookform/resolvers/zod';
import { loginSchema, type LoginInput } from '@vm-manager/shared';
import { useForm } from 'react-hook-form';
import { Navigate, useLocation } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { TextInput } from '../../components/TextInput';
import { ApiError } from '../../lib/httpClient';
import { useDocumentTitle } from '../../lib/useDocumentTitle';
import { useAuth } from './useAuth';

interface LocationState {
  from?: string;
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  useDocumentTitle('Iniciar sesión');

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
    <main className="relative flex min-h-dvh items-center justify-center overflow-hidden px-4 py-10">
      <div
        aria-hidden="true"
        className="brand-halo absolute -top-32 left-1/2 h-96 w-96 -translate-x-1/2 rounded-full"
      />
      <div className="relative w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <img
            src="/brand/ifx-logo.webp"
            alt="IFX VM Manager"
            className="h-10 w-auto dark:hidden"
          />
          <img
            src="/brand/ifx-logo-dark.webp"
            alt="IFX VM Manager"
            className="hidden h-10 w-auto dark:block"
          />
          <p className="text-sub text-text-secondary">Gestiona tus máquinas virtuales</p>
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
    </main>
  );
}
