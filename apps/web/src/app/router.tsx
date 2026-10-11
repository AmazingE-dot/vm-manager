import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { SplashScreen } from '../components/SplashScreen';
import { AppLayout } from './AppLayout';
import { AdminRoute, ProtectedRoute } from './guards';
import { PageFallback } from './PageFallback';

// Cada página se carga en su propio chunk (ver `codeSplitting` en vite.config).
const LoginPage = lazy(() =>
  import('../features/auth/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const DashboardPage = lazy(() =>
  import('../features/dashboard/DashboardPage').then((module) => ({
    default: module.DashboardPage,
  })),
);
const VmListPage = lazy(() =>
  import('../features/vms/VmListPage').then((module) => ({ default: module.VmListPage })),
);
const VmFormModal = lazy(() =>
  import('../features/vms/VmFormModal').then((module) => ({ default: module.VmFormModal })),
);

function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

/** El formulario de VM se abre como modal sobre el listado (la URL se mantiene). */
function VmFormRoute() {
  return (
    <>
      <VmListPage />
      <Suspense fallback={null}>
        <VmFormModal />
      </Suspense>
    </>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<SplashScreen />}>
        <LoginPage />
      </Suspense>
    ),
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Page>
            <DashboardPage />
          </Page>
        ),
      },
      {
        path: 'vms',
        element: (
          <Page>
            <VmListPage />
          </Page>
        ),
      },
      {
        path: 'vms/new',
        element: (
          <Page>
            <AdminRoute>
              <VmFormRoute />
            </AdminRoute>
          </Page>
        ),
      },
      {
        path: 'vms/:id/edit',
        element: (
          <Page>
            <AdminRoute>
              <VmFormRoute />
            </AdminRoute>
          </Page>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
