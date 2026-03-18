import { useRef, useState, useEffect } from 'react';
import { useAuctionStore } from '../../stores/auction-store';
import { Pause } from 'lucide-react';
import clsx from 'clsx';

export default function BidFeed() {
  const bids = useAuctionStore((s) => s.recentBids);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (!paused && containerRef.current) {
      containerRef.current.scrollTop = 0;
    }
  }, [bids, paused]);

  return (
    <div className="card flex flex-col h-full animate-fade-in relative">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5 border-b border-border">
        <div className="flex items-center gap-3">
          <span className="section-label">Live Bid Feed</span>
          {bids.length > 0 && (
            <span className="tag bg-surface-2 text-txt-3 border border-border">
              {bids.length} entries
            </span>
          )}
        </div>
        {paused && (
          <span className="flex items-center gap-1.5 text-xs font-display text-warning">
            <Pause className="w-3 h-3" />
            Paused
          </span>
        )}
      </div>

      {/* Feed */}
      <div
        ref={containerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="flex-1 overflow-y-auto min-h-0"
      >
        {bids.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center px-4">
            <p className="text-txt-2 font-display text-sm">No bids yet</p>
            <p className="text-txt-3 font-display text-xs mt-1">
              Start the simulator to see real-time bid activity
            </p>
          </div>
        ) : (
          <table className="w-full text-xs font-mono">
            <thead className="sticky top-0 bg-surface-1 z-10">
              <tr className="text-txt-3 border-b border-border">
                <th className="px-4 py-2.5 text-left font-medium w-8"></th>
                <th className="px-4 py-2.5 text-left font-medium">Source</th>
                <th className="px-4 py-2.5 text-left font-medium">Action</th>
                <th className="px-4 py-2.5 text-right font-medium">Bid</th>
                <th className="px-4 py-2.5 text-right font-medium">Floor</th>
                <th className="px-4 py-2.5 text-right font-medium">Result</th>
              </tr>
            </thead>
            <tbody>
              {bids.slice(0, 100).map((bid) => {
                const isWin = bid.outcome === 'win';
                const isLoss = bid.outcome === 'loss';
                const isBid = bid.decision === 'bid';

                return (
                  <tr
                    key={bid.id}
                    className={clsx(
                      'border-b border-border/30 transition-colors animate-slide-in',
                      isWin && 'bg-success-subtle',
                      isLoss && 'bg-danger-subtle',
                    )}
                  >
                    {/* Status indicator */}
                    <td className="px-4 py-2">
                      <div
                        className={clsx(
                          'w-2 h-2 rounded-full',
                          isWin && 'bg-success',
                          isLoss && 'bg-danger',
                          !isBid && 'bg-txt-3',
                          isBid && !isWin && !isLoss && 'bg-warning',
                        )}
                      />
                    </td>

                    {/* Reseller */}
                    <td className="px-4 py-2 text-txt-2 truncate max-w-[100px]">{bid.reseller}</td>

                    {/* Decision */}
                    <td className="px-4 py-2">
                      <span className={clsx(
                        'tag border',
                        isBid
                          ? 'bg-accent-subtle text-accent border-accent-border'
                          : 'bg-surface-2 text-txt-3 border-border',
                      )}>
                        {isBid ? 'BID' : 'SKIP'}
                      </span>
                    </td>

                    {/* Bid amount */}
                    <td className="px-4 py-2 text-right text-txt-1">
                      {bid.bidAmount ? `$${bid.bidAmount.toFixed(2)}` : <span className="text-txt-3">&mdash;</span>}
                    </td>

                    {/* Floor price */}
                    <td className="px-4 py-2 text-right text-txt-3">
                      {bid.floorPrice ? `$${bid.floorPrice.toFixed(2)}` : <span>&mdash;</span>}
                    </td>

                    {/* Outcome */}
                    <td className="px-4 py-2 text-right">
                      <span className={clsx(
                        'tag border',
                        isWin && 'bg-success-subtle text-success border-success-border',
                        isLoss && 'bg-danger-subtle text-danger border-danger-border',
                        !isBid && 'text-txt-3',
                        isBid && !isWin && !isLoss && 'bg-warning-subtle text-warning border-warning-border',
                      )}>
                        {isWin ? 'WIN' : isLoss ? 'LOSS' : isBid ? 'PENDING' : (bid.filterReason ?? 'skip')}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pause overlay indicator */}
      {paused && bids.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-surface-2 border border-border rounded-full px-4 py-1.5 text-xs font-display text-txt-2 shadow-lg">
          Hover to pause &middot; move mouse away to resume
        </div>
      )}
    </div>
  );
}
