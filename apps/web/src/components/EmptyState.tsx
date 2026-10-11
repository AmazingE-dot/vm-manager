import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
      {icon ? (
        <div className="flex size-12 items-center justify-center rounded-full bg-surface-2 text-text-secondary">
          {icon}
        </div>
      ) : null}
      <div className="flex flex-col gap-1">
        <h2 className="text-heading">{title}</h2>
        {description ? (
          <p className="max-w-md text-sub text-text-secondary">{description}</p>
        ) : null}
      </div>
      {action ? <div className="mt-2">{action}</div> : null}
    </div>
  );
}
