import { useAuctionStore } from '../../stores/auction-store';

interface Props {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: Props) {
  const metrics = useAuctionStore((s) => s.metrics);

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-border bg-surface-1/50 backdrop-blur-sm">
      <div>
        <h1 className="font-display font-bold text-lg text-txt-1">{title}</h1>
        {subtitle && (
          <p className="text-xs text-txt-3 font-display -mt-0.5">{subtitle}</p>
        )}
      </div>

      {metrics && metrics.totalBids > 0 && (
        <div className="flex items-center gap-5">
          <HeaderStat label="Win Rate" value={`${(metrics.winRate * 100).toFixed(1)}%`} color="text-success" />
          <div className="w-px h-4 bg-border" />
          <HeaderStat label="Total Bids" value={metrics.totalBids.toLocaleString()} color="text-accent" />
          <div className="w-px h-4 bg-border" />
          <HeaderStat label="Spend" value={`$${metrics.totalSpend.toFixed(2)}`} color="text-warning" />
        </div>
      )}
    </header>
  );
}

function HeaderStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[11px] font-display text-txt-3">{label}</span>
      <span className={`text-sm font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
