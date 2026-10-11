import type { Vm } from '@vm-manager/shared';
import { Server } from 'lucide-react';
import { Link } from 'react-router';
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { buttonClasses } from '../../components/Button';
import { Card } from '../../components/Card';
import { EmptyState } from '../../components/EmptyState';
import { Skeleton } from '../../components/Skeleton';

interface ResourceChartsProps {
  activeVms: Vm[];
  totalCount: number;
}

const CHART_CONFIG = [
  { key: 'cores', title: 'vCPU por VM', unit: 'vCPU', color: 'var(--accent)' },
  { key: 'ram', title: 'RAM por VM', unit: 'GB', color: 'var(--success)' },
  { key: 'disk', title: 'Disco por VM', unit: 'GB', color: 'var(--warning)' },
] as const;

export function ResourceCharts({ activeVms, totalCount }: ResourceChartsProps) {
  if (activeVms.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={<Server size={22} strokeWidth={1.75} />}
          title={totalCount === 0 ? 'Aún no hay máquinas virtuales' : 'No hay VMs encendidas'}
          description={
            totalCount === 0
              ? 'Crea una VM desde el listado para ver aquí sus recursos asignados.'
              : 'Enciende una VM desde el listado para ver aquí sus recursos asignados.'
          }
          action={
            <Link to="/vms" className={buttonClasses('secondary')}>
              Ver máquinas virtuales
            </Link>
          }
        />
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {CHART_CONFIG.map((chart) => (
        <ResourceBarChart key={chart.key} chart={chart} activeVms={activeVms} />
      ))}
    </div>
  );
}

interface ResourceBarChartProps {
  chart: (typeof CHART_CONFIG)[number];
  activeVms: Vm[];
}

function ResourceBarChart({ chart, activeVms }: ResourceBarChartProps) {
  const data = [...activeVms]
    .sort((a, b) => b[chart.key] - a[chart.key])
    .map((vm) => ({ name: vm.name, value: vm[chart.key] }));

  return (
    <Card className="p-5">
      <h2 className="text-sub font-semibold">{chart.title}</h2>
      <div className="mt-4 h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 16, bottom: 4, left: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              width={96}
              tickLine={false}
              axisLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 13 }}
              tickFormatter={(value: string) =>
                value.length > 12 ? `${value.slice(0, 11)}…` : value
              }
            />
            <Tooltip
              cursor={{ fill: 'var(--surface-2)' }}
              contentStyle={{
                background: 'var(--surface)',
                border: '1px solid var(--separator)',
                borderRadius: 12,
                fontSize: 13,
              }}
              labelStyle={{ color: 'var(--text)' }}
              itemStyle={{ color: 'var(--text)' }}
              formatter={(value) => `${String(value)} ${chart.unit}`}
            />
            <Bar dataKey="value" fill={chart.color} radius={[0, 6, 6, 0]} maxBarSize={22} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function ResourceChartsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
      {Array.from({ length: 3 }, (_, index) => (
        <Card key={index} className="p-5">
          <Skeleton className="h-4 w-28" />
          <Skeleton className="mt-4 h-56 w-full" />
        </Card>
      ))}
    </div>
  );
}
