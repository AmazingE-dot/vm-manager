import type { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="flex flex-col gap-1">
        <h1 className="text-title">{title}</h1>
        {description ? <p className="text-sub text-text-secondary">{description}</p> : null}
      </div>
      {actions}
    </div>
  );
}
