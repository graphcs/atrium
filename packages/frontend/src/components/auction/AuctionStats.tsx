import { useAuctionStore } from '../../stores/auction-store';
import { Activity, Target, Clock, TrendingUp } from 'lucide-react';

export default function AuctionStats() {
  const simState = useAuctionStore((s) => s.simulatorState);
  const metrics = useAuctionStore((s) => s.metrics);

  const stats = simState?.stats;
  const elapsed = stats?.elapsedMs ?? 0;
  const minutes = Math.floor(elapsed / 60000);
  const seconds = Math.floor((elapsed % 60000) / 1000);

  return (
    <div className="card p-5 space-y-4 animate-fade-in">
      <span className="section-label">Engine Stats</span>

      <div className="space-y-3">
        <StatRow
          icon={<Activity className="w-4 h-4 text-accent" />}
          label="Throughput"
          value={`${stats?.requestsPerSecond.toFixed(0) ?? '0'} req/s`}
        />
        <StatRow
          icon={<Target className="w-4 h-4 text-success" />}
          label="Processed"
          value={stats?.totalRequests.toLocaleString() ?? '0'}
        />
        <StatRow
          icon={<TrendingUp className="w-4 h-4 text-warning" />}
          label="Wins / Bids"
          value={`${stats?.totalWins ?? 0} / ${stats?.totalBids ?? 0}`}
        />
        <StatRow
          icon={<Clock className="w-4 h-4 text-txt-2" />}
          label="Elapsed"
          value={`${minutes}m ${seconds}s`}
        />
      </div>

      {metrics && metrics.totalBids > 0 && (
        <div className="pt-3 border-t border-border space-y-2.5">
          <MiniStat label="Avg Bid CPM" value={`$${metrics.avgBidPrice.toFixed(2)}`} />
          <MiniStat label="Avg Clear CPM" value={`$${metrics.avgClearingPrice.toFixed(2)}`} />
          <MiniStat label="Bid Rate" value={`${(metrics.bidRate * 100).toFixed(1)}%`} />
          <MiniStat label="Waste Ratio" value={`${(metrics.wasteRatio * 100).toFixed(1)}%`} highlight={metrics.wasteRatio > 0.3} />
        </div>
      )}
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-8 h-8 rounded-lg bg-surface-2 border border-border flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[11px] font-display text-txt-3">{label}</div>
        <div className="text-sm font-mono font-semibold text-txt-1">{value}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between text-xs font-mono">
      <span className="text-txt-3">{label}</span>
      <span className={highlight ? 'text-danger' : 'text-txt-1'}>{value}</span>
    </div>
  );
}
