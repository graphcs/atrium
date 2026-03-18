import { useEffect, useState } from 'react';

interface Props {
  rate: number;
  size?: number;
}

export default function WinRateGauge({ rate, size = 180 }: Props) {
  const [animated, setAnimated] = useState(0);

  useEffect(() => {
    const id = requestAnimationFrame(() => setAnimated(rate));
    return () => cancelAnimationFrame(id);
  }, [rate]);

  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = Math.PI * radius; // half circle
  const offset = circumference * (1 - animated);
  const pct = (animated * 100).toFixed(1);

  const color = animated >= 0.6 ? '#34d399' : animated >= 0.3 ? '#fbbf24' : '#f87171';
  const label = animated >= 0.6 ? 'Good' : animated >= 0.3 ? 'Fair' : 'Low';
  const labelColor = animated >= 0.6 ? 'text-success' : animated >= 0.3 ? 'text-warning' : 'text-danger';

  return (
    <div className="card p-6 flex flex-col items-center justify-center animate-fade-in">
      <span className="section-label mb-5">Win Rate</span>

      <div className="relative" style={{ width: size, height: size / 2 + 20 }}>
        <svg width={size} height={size / 2 + 20} viewBox={`0 0 ${size} ${size / 2 + 20}`}>
          {/* Track */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2 + 10}`}
            fill="none"
            stroke="#252833"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />
          {/* Active arc */}
          <path
            d={`M ${strokeWidth / 2} ${size / 2 + 10} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2 + 10}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            style={{ transition: 'stroke-dashoffset 0.6s ease-out, stroke 0.3s' }}
          />
        </svg>

        {/* Center value */}
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-1">
          <span className="text-3xl font-mono font-bold text-txt-1">{pct}%</span>
          <span className={`text-xs font-display font-medium ${labelColor} mt-0.5`}>{label}</span>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 text-[11px] font-mono text-txt-3">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-danger" /> {'< 30%'}
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-warning" /> 30-60%
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-success" /> {'> 60%'}
        </span>
      </div>
    </div>
  );
}
