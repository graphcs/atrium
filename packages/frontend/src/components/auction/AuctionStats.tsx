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
    <div className="glass-panel p-5 space-y-4 animate-fade-in">
      <span className="text-[10px] font-mono text-gray-500 tracking-[0.15em] uppercase">
        Engine Stats
      </span>

      <div className="space-y-3">
        <StatRow
          icon={<Activity className="w-3.5 h-3.5 text-atrium-400" />}
          label="Throughput"
          value={`${stats?.requestsPerSecond.toFixed(0) ?? '0'} req/s`}
        />
        <StatRow
          icon={<Target className="w-3.5 h-3.5 text-neon-green" />}
          label="Processed"
          value={stats?.totalRequests.toLocaleString() ?? '0'}
        />
        <StatRow
          icon={<TrendingUp className="w-3.5 h-3.5 text-neon-amber" />}
          label="Wins / Bids"
          value={`${stats?.totalWins ?? 0} / ${stats?.totalBids ?? 0}`}
        />
        <StatRow
          icon={<Clock className="w-3.5 h-3.5 text-neon-cyan" />}
          label="Elapsed"
          value={`${minutes}m ${seconds}s`}
        />
      </div>

      {metrics && metrics.totalBids > 0 && (
        <div className="pt-3 border-t border-white/[0.04] space-y-2">
          <MiniStat label="Avg Bid CPM" value={`$${metrics.avgBidPrice.toFixed(2)}`} />
          <MiniStat label="Avg Clear CPM" value={`$${metrics.avgClearingPrice.toFixed(2)}`} />
          <MiniStat label="Bid Rate" value={`${(metrics.bidRate * 100).toFixed(1)}%`} />
          <MiniStat label="Waste Ratio" value={`${(metrics.wasteRatio * 100).toFixed(1)}%`} />
        </div>
      )}
    </div>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-md bg-white/[0.03] border border-white/[0.04] flex items-center justify-center">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-[10px] font-mono text-gray-500">{label}</div>
        <div className="text-sm font-mono font-semibold text-gray-200">{value}</div>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-[11px] font-mono">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-300">{value}</span>
    </div>
  );
}
