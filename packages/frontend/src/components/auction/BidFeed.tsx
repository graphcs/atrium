import { useRef, useState, useEffect } from 'react';
import { useAuctionStore } from '../../stores/auction-store';
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
    <div className="glass-panel flex flex-col h-full animate-fade-in relative scan-overlay">
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.04]">
        <span className="text-[10px] font-mono text-gray-500 tracking-[0.15em] uppercase">
          Live Bid Feed
        </span>
        <span className="text-[10px] font-mono text-gray-600">
          {bids.length} entries
        </span>
      </div>

      <div
        ref={containerRef}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        className="flex-1 overflow-y-auto min-h-0 divide-y divide-white/[0.02]"
      >
        {bids.length === 0 ? (
          <div className="flex items-center justify-center h-40 text-gray-600 font-mono text-xs">
            No bids yet. Start the simulator.
          </div>
        ) : (
          bids.slice(0, 100).map((bid) => {
            const isWin = bid.outcome === 'win';
            const isLoss = bid.outcome === 'loss';
            const isBid = bid.decision === 'bid';

            return (
              <div
                key={bid.id}
                className={clsx(
                  'px-5 py-2.5 flex items-center gap-3 text-[11px] font-mono transition-colors animate-slide-in-right',
                  isWin && 'bg-neon-green/[0.03]',
                  isLoss && 'bg-neon-red/[0.02]',
                )}
              >
                {/* Status dot */}
                <div
                  className={clsx(
                    'w-1.5 h-1.5 rounded-full shrink-0',
                    isWin && 'bg-neon-green shadow-[0_0_4px_rgba(16,185,129,0.5)]',
                    isLoss && 'bg-neon-red shadow-[0_0_4px_rgba(244,63,94,0.5)]',
                    !isBid && 'bg-gray-600',
                    isBid && !isWin && !isLoss && 'bg-neon-amber',
                  )}
                />

                {/* Reseller */}
                <span className="text-gray-500 w-14 shrink-0 truncate">{bid.reseller}</span>

                {/* Decision */}
                <span
                  className={clsx(
                    'data-tag shrink-0',
                    isBid ? 'bg-atrium-500/10 text-atrium-400' : 'bg-gray-500/10 text-gray-600',
                  )}
                >
                  {isBid ? 'BID' : 'SKIP'}
                </span>

                {/* Price */}
                {bid.bidAmount ? (
                  <span className="text-gray-300 w-16 text-right shrink-0">
                    ${bid.bidAmount.toFixed(2)}
                  </span>
                ) : (
                  <span className="text-gray-700 w-16 text-right shrink-0">—</span>
                )}

                {/* Floor */}
                <span className="text-gray-600 w-16 text-right shrink-0">
                  {bid.floorPrice ? `$${bid.floorPrice.toFixed(2)}` : '—'}
                </span>

                {/* Outcome */}
                <span
                  className={clsx(
                    'ml-auto data-tag shrink-0',
                    isWin && 'bg-neon-green/10 text-neon-green',
                    isLoss && 'bg-neon-red/10 text-neon-red',
                    !isBid && 'bg-transparent text-gray-700',
                    isBid && !isWin && !isLoss && 'bg-neon-amber/10 text-neon-amber',
                  )}
                >
                  {isWin ? 'WIN' : isLoss ? 'LOSS' : isBid ? 'PEND' : (bid.filterReason ?? 'skip')}
                </span>
              </div>
            );
          })
        )}
      </div>

      {paused && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-void-100/90 border border-white/[0.06] rounded-full px-3 py-1 text-[10px] font-mono text-gray-400">
          Scroll paused — move mouse away to resume
        </div>
      )}
    </div>
  );
}
