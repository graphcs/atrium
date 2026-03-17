import { useEffect, useState } from 'react';
import clsx from 'clsx';

interface Props {
  rate: number; // 0–1
  size?: number;
}

export default function WinRateGauge({ rate, size = 200 }: Props) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(rate));
    return () => cancelAnimationFrame(id);
  }, [rate]);

  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - animated);
  const pct = (animated * 100).toFixed(1);

  const color =
    animated >= 0.6 ? '#10b981' : animated >= 0.3 ? '#f59e0b' : '#f43f5e';
  const glowColor =
    animated >= 0.6
      ? 'rgba(16,185,129,0.3)'
      : animated >= 0.3
        ? 'rgba(245,158,11,0.3)'
        : 'rgba(244,63,94,0.3)';

  return (
    <div className="glass-panel p-6 flex flex-col items-center justify-center animate-fade-in">
      <span className="text-[10px] font-mono text-gray-500 tracking-[0.15em] uppercase mb-4">
        Win Rate
      </span>
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90"
        >
          {/* Track */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.04)"
            strokeWidth={strokeWidth}
          />
          {/* Active arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{
              transition: 'stroke-dashoffset 0.8s ease-out, stroke 0.4s',
              filter: `drop-shadow(0 0 8px ${glowColor})`,
            }}
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span
            className={clsx('text-4xl font-mono font-bold tracking-tight')}
            style={{ color }}
          >
            {pct}
          </span>
          <span className="text-[11px] font-mono text-gray-500 -mt-0.5">%</span>
        </div>
      </div>
      <div className="mt-4 flex items-center gap-4 text-[10px] font-mono text-gray-500">
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neon-red/60" /> {'<30'}
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neon-amber/60" /> 30-60
        </span>
        <span className="flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-neon-green/60" /> {'>60'}
        </span>
      </div>
    </div>
  );
}
