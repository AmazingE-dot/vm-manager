import { Cpu, HardDrive, MemoryStick, Power, type LucideIcon } from 'lucide-react';
import { Card } from '../../components/Card';
import { Skeleton } from '../../components/Skeleton';
import type { VmSummary } from './stats';

interface StatItem {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
  semanticColor?: string;
}

export function StatCards({ summary }: { summary: VmSummary }) {
  const items: StatItem[] = [
    {
      icon: Power,
      label: 'VMs encendidas',
      value: String(summary.activeCount),
      hint: `de ${summary.totalCount} en total`,
      semanticColor: 'text-success',
    },
    {
      icon: Cpu,
      label: 'vCPU en uso',
      value: String(summary.totals.cores),
      hint: 'núcleos asignados',
    },
    {
      icon: MemoryStick,
      label: 'RAM en uso',
      value: String(summary.totals.ram),
      hint: 'GB asignados',
    },
    {
      icon: HardDrive,
      label: 'Disco en uso',
      value: String(summary.totals.disk),
      hint: 'GB asignados',
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {items.map((item) => (
        <Card key={item.label} className="flex flex-col gap-3 p-5">
          <div className="flex items-center gap-2 text-text-secondary">
            <item.icon
              size={18}
              strokeWidth={1.75}
              aria-hidden="true"
              className={item.semanticColor}
            />
            <span className="text-caption">{item.label}</span>
          </div>
          <div>
            <p className="text-title">{item.value}</p>
            <p className="mt-0.5 text-caption text-text-secondary">{item.hint}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      {Array.from({ length: 4 }, (_, index) => (
        <Card key={index} className="flex flex-col gap-3 p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-16" />
          <Skeleton className="h-3.5 w-20" />
        </Card>
      ))}
    </div>
  );
}
