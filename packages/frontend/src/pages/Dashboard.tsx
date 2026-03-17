import Header from '../components/layout/Header';
import MetricCard from '../components/metrics/MetricCard';
import WinRateGauge from '../components/metrics/WinRateGauge';
import SpendChart from '../components/metrics/SpendChart';
import { useAuctionStore } from '../stores/auction-store';
import { Crosshair, TrendingUp, DollarSign, BarChart3, AlertTriangle, Zap } from 'lucide-react';

export default function Dashboard() {
  const metrics = useAuctionStore((s) => s.metrics);
  const recentBids = useAuctionStore((s) => s.recentBids);

  const m = metrics ?? {
    totalBids: 0, totalWins: 0, winRate: 0, totalSpend: 0,
    avgCpm: 0, wasteRatio: 0, bidRate: 0, totalBidRequests: 0,
    totalLosses: 0, totalNoBids: 0, avgBidPrice: 0, avgClearingPrice: 0,
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" />

      <div className="flex-1 p-8 space-y-6">
        {/* Top metrics row */}
        <div className="grid grid-cols-6 gap-4">
          <MetricCard
            label="Total Bids"
            value={m.totalBids.toLocaleString()}
            sub={`of ${m.totalBidRequests.toLocaleString()} requests`}
            icon={<Crosshair className="w-4 h-4 text-atrium-400" />}
            accent="blue"
          />
          <MetricCard
            label="Wins"
            value={m.totalWins.toLocaleString()}
            sub={`${(m.winRate * 100).toFixed(1)}% win rate`}
            icon={<TrendingUp className="w-4 h-4 text-neon-green" />}
            accent="green"
          />
          <MetricCard
            label="Total Spend"
            value={`$${m.totalSpend.toFixed(2)}`}
            icon={<DollarSign className="w-4 h-4 text-neon-amber" />}
            accent="amber"
          />
          <MetricCard
            label="Avg CPM"
            value={`$${m.avgCpm.toFixed(2)}`}
            icon={<BarChart3 className="w-4 h-4 text-neon-cyan" />}
            accent="cyan"
          />
          <MetricCard
            label="Waste Ratio"
            value={`${(m.wasteRatio * 100).toFixed(1)}%`}
            sub={`${m.totalLosses.toLocaleString()} losses`}
            icon={<AlertTriangle className="w-4 h-4 text-neon-red" />}
            accent="red"
          />
          <MetricCard
            label="Bid Rate"
            value={`${(m.bidRate * 100).toFixed(1)}%`}
            sub={`${m.totalNoBids.toLocaleString()} skipped`}
            icon={<Zap className="w-4 h-4 text-neon-purple" />}
            accent="purple"
          />
        </div>

        {/* Middle row: gauge + chart */}
        <div className="grid grid-cols-3 gap-4">
          <WinRateGauge rate={m.winRate} />
          <div className="col-span-2">
            <SpendChart />
          </div>
        </div>

        {/* Recent bids table */}
        <div className="glass-panel animate-fade-in">
          <div className="px-5 py-3 border-b border-white/[0.04]">
            <span className="text-[10px] font-mono text-gray-500 tracking-[0.15em] uppercase">
              Recent Activity
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-[11px] font-mono">
              <thead>
                <tr className="text-gray-500 border-b border-white/[0.04]">
                  <th className="px-5 py-2.5 text-left font-medium">Reseller</th>
                  <th className="px-5 py-2.5 text-left font-medium">Decision</th>
                  <th className="px-5 py-2.5 text-right font-medium">Bid</th>
                  <th className="px-5 py-2.5 text-right font-medium">Floor</th>
                  <th className="px-5 py-2.5 text-right font-medium">Clear</th>
                  <th className="px-5 py-2.5 text-right font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.02]">
                {recentBids.slice(0, 15).map((bid) => (
                  <tr key={bid.id} className="hover:bg-white/[0.01] transition-colors">
                    <td className="px-5 py-2 text-gray-400">{bid.reseller}</td>
                    <td className="px-5 py-2">
                      <span className={bid.decision === 'bid' ? 'text-atrium-400' : 'text-gray-600'}>
                        {bid.decision === 'bid' ? 'BID' : bid.filterReason ?? 'SKIP'}
                      </span>
                    </td>
                    <td className="px-5 py-2 text-right text-gray-300">
                      {bid.bidAmount ? `$${bid.bidAmount.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-2 text-right text-gray-500">
                      {bid.floorPrice ? `$${bid.floorPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-2 text-right text-gray-400">
                      {bid.clearingPrice ? `$${bid.clearingPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-2 text-right">
                      <span
                        className={
                          bid.outcome === 'win'
                            ? 'text-neon-green'
                            : bid.outcome === 'loss'
                              ? 'text-neon-red'
                              : 'text-gray-600'
                        }
                      >
                        {bid.outcome === 'win' ? 'WIN' : bid.outcome === 'loss' ? 'LOSS' : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentBids.length === 0 && (
              <div className="py-12 text-center text-gray-600 font-mono text-xs">
                No activity yet. Create a campaign and start the simulator.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
