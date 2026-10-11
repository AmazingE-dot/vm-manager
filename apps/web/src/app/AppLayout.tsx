import { LogOut } from 'lucide-react';
import { NavLink, Outlet } from 'react-router';
import { ThemeToggle } from '../components/ThemeToggle';
import { useAuth } from '../features/auth/useAuth';
import { useVmRealtime } from '../features/realtime/useVmRealtime';
import { cn } from '../lib/utils';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/vms', label: 'VMs', end: false },
];

export function AppLayout() {
  const { user, logout } = useAuth();
  useVmRealtime();

  return (
    <div className="min-h-dvh">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-4 focus:z-50 focus:rounded-control focus:bg-surface focus:px-4 focus:py-2 focus:text-body focus:shadow-card"
      >
        Saltar al contenido
      </a>
      <header className="glass sticky top-0 z-10 border-b border-separator">
        <div className="mx-auto flex min-h-16 w-full max-w-6xl items-center gap-3 px-4 sm:px-6">
          <NavLink to="/" className="flex items-center">
            <img
              src="/brand/ifx-logo.webp"
              alt="IFX VM Manager"
              className="h-7 w-auto dark:hidden"
            />
            <img
              src="/brand/ifx-logo-dark.webp"
              alt="IFX VM Manager"
              className="hidden h-7 w-auto dark:block"
            />
          </NavLink>

          <nav className="ml-2 flex items-center gap-1" aria-label="Principal">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    'rounded-control px-3 py-2 text-sub font-medium transition',
                    isActive
                      ? 'bg-surface-2 text-text'
                      : 'text-text-secondary hover:bg-surface-2/60 hover:text-text',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-1.5">
            <span className="hidden text-sub text-text-secondary sm:inline">{user?.name}</span>
            <ThemeToggle />
            <button
              type="button"
              aria-label="Cerrar sesión"
              onClick={() => {
                void logout();
              }}
              className="inline-flex size-11 items-center justify-center rounded-control text-text-secondary transition hover:bg-surface-2 hover:text-text"
            >
              <LogOut size={20} strokeWidth={1.75} />
            </button>
          </div>
        </div>
      </header>

      <main id="contenido" className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
