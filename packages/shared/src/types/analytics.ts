export interface BidLog {
  id: string;
  timestamp: string;
  campaignId: string;
  reseller: string;
  impressionId: string;
  bidRequestId: string;
  decision: BidDecision;
  bidAmount?: number;
  floorPrice?: number;
  winProbability?: number;
  outcome?: BidOutcome;
  clearingPrice?: number;
  filterReason?: string;
}

export enum BidDecision {
  Bid = 'bid',
  NoBid = 'no_bid',
}

export enum BidOutcome {
  Win = 'win',
  Loss = 'loss',
  Pending = 'pending',
}

export interface AuctionMetrics {
  totalBidRequests: number;
  totalBids: number;
  totalWins: number;
  totalLosses: number;
  totalNoBids: number;
  winRate: number;
  bidRate: number;
  avgBidPrice: number;
  avgClearingPrice: number;
  totalSpend: number;
  avgCpm: number;
  wasteRatio: number;
}

export interface RealtimeUpdate {
  type: 'bid_result' | 'metrics_update' | 'simulator_state';
  data: BidLog | AuctionMetrics | SimulatorStateUpdate;
}

export interface SimulatorStateUpdate {
  status: 'running' | 'stopped' | 'idle';
  totalProcessed: number;
  elapsedMs: number;
}
