import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from '../features/auth/LoginPage';
import { DashboardPage } from '../features/dashboard/DashboardPage';
import { VmFormPage } from '../features/vms/VmFormPage';
import { VmListPage } from '../features/vms/VmListPage';
import { AppLayout } from './AppLayout';
import { AdminRoute, ProtectedRoute } from './guards';

export const router = createBrowserRouter([
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    element: (
      <ProtectedRoute>
        <AppLayout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'vms', element: <VmListPage /> },
      {
        path: 'vms/new',
        element: (
          <AdminRoute>
            <VmFormPage />
          </AdminRoute>
        ),
      },
      {
        path: 'vms/:id/edit',
        element: (
          <AdminRoute>
            <VmFormPage />
          </AdminRoute>
        ),
      },
    ],
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
