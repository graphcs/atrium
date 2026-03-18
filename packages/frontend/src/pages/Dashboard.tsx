import Header from '../components/layout/Header';
import MetricCard from '../components/metrics/MetricCard';
import WinRateGauge from '../components/metrics/WinRateGauge';
import SpendChart from '../components/metrics/SpendChart';
import { useAuctionStore } from '../stores/auction-store';
import { Crosshair, TrendingUp, DollarSign, BarChart3 } from 'lucide-react';

export default function Dashboard() {
  const metrics = useAuctionStore((s) => s.metrics);
  const recentBids = useAuctionStore((s) => s.recentBids);

  const m = metrics ?? {
    totalBids: 0, totalWins: 0, winRate: 0, totalSpend: 0,
    avgCpm: 0, wasteRatio: 0, bidRate: 0, totalBidRequests: 0,
    totalLosses: 0, totalNoBids: 0, avgBidPrice: 0, avgClearingPrice: 0,
  };

  const hasData = m.totalBids > 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Dashboard" subtitle="Real-time bidding performance" />

      <div className="flex-1 p-6 space-y-5">
        {/* Key metrics */}
        <div className="grid grid-cols-4 gap-4">
          <MetricCard
            label="Bid Requests"
            value={m.totalBidRequests.toLocaleString()}
            sub={`${(m.bidRate * 100).toFixed(1)}% bid rate`}
            icon={<Crosshair className="w-4 h-4 text-accent" />}
            accent="blue"
          />
          <MetricCard
            label="Wins"
            value={m.totalWins.toLocaleString()}
            sub={`of ${m.totalBids.toLocaleString()} bids placed`}
            icon={<TrendingUp className="w-4 h-4 text-success" />}
            accent="green"
          />
          <MetricCard
            label="Total Spend"
            value={`$${m.totalSpend.toFixed(2)}`}
            sub={`${m.totalLosses.toLocaleString()} losses (${(m.wasteRatio * 100).toFixed(1)}% waste)`}
            icon={<DollarSign className="w-4 h-4 text-warning" />}
            accent="amber"
          />
          <MetricCard
            label="Avg CPM"
            value={`$${m.avgCpm.toFixed(2)}`}
            sub={`Clear: $${m.avgClearingPrice.toFixed(2)}`}
            icon={<BarChart3 className="w-4 h-4 text-accent" />}
            accent="blue"
          />
        </div>

        {/* Gauge + Chart */}
        <div className="grid grid-cols-3 gap-4">
          <WinRateGauge rate={m.winRate} />
          <div className="col-span-2">
            <SpendChart />
          </div>
        </div>

        {/* Recent activity table */}
        <div className="card animate-fade-in">
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
            <span className="section-label">Recent Activity</span>
            {hasData && (
              <span className="text-xs font-mono text-txt-3">{recentBids.length} entries</span>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono">
              <thead>
                <tr className="text-txt-3 border-b border-border">
                  <th className="px-5 py-3 text-left font-medium">Reseller</th>
                  <th className="px-5 py-3 text-left font-medium">Decision</th>
                  <th className="px-5 py-3 text-right font-medium">Bid</th>
                  <th className="px-5 py-3 text-right font-medium">Floor</th>
                  <th className="px-5 py-3 text-right font-medium">Clear Price</th>
                  <th className="px-5 py-3 text-right font-medium">Outcome</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {recentBids.slice(0, 15).map((bid) => (
                  <tr key={bid.id} className="hover:bg-surface-2/50 transition-colors">
                    <td className="px-5 py-2.5 text-txt-2">{bid.reseller}</td>
                    <td className="px-5 py-2.5">
                      <span className={bid.decision === 'bid'
                        ? 'tag bg-accent-subtle text-accent'
                        : 'tag bg-surface-2 text-txt-3'
                      }>
                        {bid.decision === 'bid' ? 'BID' : bid.filterReason ?? 'SKIP'}
                      </span>
                    </td>
                    <td className="px-5 py-2.5 text-right text-txt-1">
                      {bid.bidAmount ? `$${bid.bidAmount.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-right text-txt-3">
                      {bid.floorPrice ? `$${bid.floorPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-right text-txt-2">
                      {bid.clearingPrice ? `$${bid.clearingPrice.toFixed(2)}` : '—'}
                    </td>
                    <td className="px-5 py-2.5 text-right">
                      <span className={
                        bid.outcome === 'win'
                          ? 'tag bg-success-subtle text-success'
                          : bid.outcome === 'loss'
                            ? 'tag bg-danger-subtle text-danger'
                            : 'text-txt-3'
                      }>
                        {bid.outcome === 'win' ? 'WIN' : bid.outcome === 'loss' ? 'LOSS' : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {recentBids.length === 0 && (
              <div className="py-16 text-center">
                <p className="text-txt-2 font-display text-sm">No activity yet</p>
                <p className="text-txt-3 font-display text-xs mt-1">
                  Create a campaign and start the simulator to see live auction data
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
