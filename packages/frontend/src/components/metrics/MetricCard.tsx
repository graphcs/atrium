import clsx from 'clsx';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: 'blue' | 'green' | 'red' | 'amber';
}

const accents = {
  blue: { text: 'text-accent', stripe: 'bg-accent', iconBg: 'bg-accent-subtle', iconBorder: 'border-accent-border' },
  green: { text: 'text-success', stripe: 'bg-success', iconBg: 'bg-success-subtle', iconBorder: 'border-success-border' },
  red: { text: 'text-danger', stripe: 'bg-danger', iconBg: 'bg-danger-subtle', iconBorder: 'border-danger-border' },
  amber: { text: 'text-warning', stripe: 'bg-warning', iconBg: 'bg-warning-subtle', iconBorder: 'border-warning-border' },
};

export default function MetricCard({ label, value, sub, icon, accent = 'blue' }: Props) {
  const a = accents[accent];

  return (
    <div className="card p-5 animate-fade-in relative overflow-hidden">
      {/* Color stripe on top */}
      <div className={clsx('absolute top-0 left-0 right-0 h-[2px]', a.stripe, 'opacity-60')} />

      <div className="flex items-start justify-between mb-3">
        <span className="section-label">{label}</span>
        {icon && (
          <div className={clsx('w-8 h-8 rounded-lg flex items-center justify-center border', a.iconBg, a.iconBorder)}>
            {icon}
          </div>
        )}
      </div>
      <div className={clsx('text-2xl font-mono font-bold', a.text)}>
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-xs font-mono text-txt-3">{sub}</div>
      )}
    </div>
  );
}
