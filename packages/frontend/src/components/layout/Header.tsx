import { useAuctionStore } from '../../stores/auction-store';

export default function Header({ title }: { title: string }) {
  const metrics = useAuctionStore((s) => s.metrics);

  return (
    <header className="h-16 flex items-center justify-between px-8 border-b border-white/[0.04] bg-void/60 backdrop-blur-md">
      <h1 className="font-display font-bold text-xl text-white tracking-tight">{title}</h1>

      {metrics && metrics.totalBids > 0 && (
        <div className="flex items-center gap-6">
          <QuickStat label="WIN RATE" value={`${(metrics.winRate * 100).toFixed(1)}%`} color="text-neon-green" />
          <QuickStat label="BIDS" value={metrics.totalBids.toLocaleString()} color="text-atrium-400" />
          <QuickStat label="SPEND" value={`$${metrics.totalSpend.toFixed(2)}`} color="text-neon-amber" />
        </div>
      )}
    </header>
  );
}

function QuickStat({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-[10px] font-mono text-gray-500 tracking-widest">{label}</span>
      <span className={`text-sm font-mono font-semibold ${color}`}>{value}</span>
    </div>
  );
}
