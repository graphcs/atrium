import Header from '../components/layout/Header';
import SimulatorControls from '../components/auction/SimulatorControls';
import AuctionStats from '../components/auction/AuctionStats';
import BidFeed from '../components/auction/BidFeed';

export default function AuctionLive() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header title="Live Auction" subtitle="Run auction simulations and observe bid behavior" />

      <div className="flex-1 p-6">
        <div className="grid grid-cols-[320px_1fr] gap-4 h-[calc(100vh-8rem)]">
          {/* Left: controls + stats */}
          <div className="space-y-4 overflow-y-auto">
            <SimulatorControls />
            <AuctionStats />
          </div>

          {/* Right: bid feed */}
          <BidFeed />
        </div>
      </div>
    </div>
  );
}
