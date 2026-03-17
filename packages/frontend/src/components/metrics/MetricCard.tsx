import clsx from 'clsx';
import type { ReactNode } from 'react';

interface Props {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
  accent?: 'blue' | 'green' | 'red' | 'amber' | 'cyan' | 'purple';
}

const accents = {
  blue: { text: 'text-atrium-400', glow: 'shadow-atrium-500/10', border: 'border-atrium-500/10', bg: 'bg-atrium-500/5' },
  green: { text: 'text-neon-green', glow: 'shadow-neon-green/10', border: 'border-neon-green/10', bg: 'bg-neon-green/5' },
  red: { text: 'text-neon-red', glow: 'shadow-neon-red/10', border: 'border-neon-red/10', bg: 'bg-neon-red/5' },
  amber: { text: 'text-neon-amber', glow: 'shadow-neon-amber/10', border: 'border-neon-amber/10', bg: 'bg-neon-amber/5' },
  cyan: { text: 'text-neon-cyan', glow: 'shadow-neon-cyan/10', border: 'border-neon-cyan/10', bg: 'bg-neon-cyan/5' },
  purple: { text: 'text-neon-purple', glow: 'shadow-neon-purple/10', border: 'border-neon-purple/10', bg: 'bg-neon-purple/5' },
};

export default function MetricCard({ label, value, sub, icon, accent = 'blue' }: Props) {
  const a = accents[accent];

  return (
    <div className={clsx('glass-panel p-5 animate-fade-in group hover:shadow-lg transition-shadow duration-300', a.glow)}>
      <div className="flex items-start justify-between mb-3">
        <span className="text-[10px] font-mono text-gray-500 tracking-[0.15em] uppercase">{label}</span>
        {icon && (
          <div className={clsx('w-8 h-8 rounded-md flex items-center justify-center', a.bg, a.border, 'border')}>
            {icon}
          </div>
        )}
      </div>
      <div className={clsx('text-2xl font-mono font-bold tracking-tight', a.text)}>
        {value}
      </div>
      {sub && (
        <div className="mt-1 text-[11px] font-mono text-gray-500">{sub}</div>
      )}
    </div>
  );
}
