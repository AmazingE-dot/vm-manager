import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate } from 'react-router';
import { AppLayout } from './AppLayout';
import { AdminRoute, ProtectedRoute, SessionSplash } from './guards';
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
const VmFormPage = lazy(() =>
  import('../features/vms/VmFormPage').then((module) => ({ default: module.VmFormPage })),
);

function Page({ children }: { children: ReactNode }) {
  return <Suspense fallback={<PageFallback />}>{children}</Suspense>;
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: (
      <Suspense fallback={<SessionSplash />}>
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
              <VmFormPage />
            </AdminRoute>
          </Page>
        ),
      },
      {
        path: 'vms/:id/edit',
        element: (
          <Page>
            <AdminRoute>
              <VmFormPage />
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
