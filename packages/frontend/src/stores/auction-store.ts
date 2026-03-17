import { create } from 'zustand';
import type { AuctionMetrics, BidLog, SimulatorState } from '@atrium/shared';

interface AuctionStore {
  metrics: AuctionMetrics | null;
  recentBids: BidLog[];
  simulatorState: SimulatorState | null;
  metricsHistory: { time: number; winRate: number; spend: number }[];

  setMetrics: (metrics: AuctionMetrics) => void;
  addBidResult: (bid: BidLog) => void;
  setSimulatorState: (state: SimulatorState) => void;
  clearBids: () => void;
}

export const useAuctionStore = create<AuctionStore>((set) => ({
  metrics: null,
  recentBids: [],
  simulatorState: null,
  metricsHistory: [],

  setMetrics: (metrics) =>
    set((state) => ({
      metrics,
      metricsHistory: [
        ...state.metricsHistory.slice(-120),
        { time: Date.now(), winRate: metrics.winRate, spend: metrics.totalSpend },
      ],
    })),

  addBidResult: (bid) =>
    set((state) => ({
      recentBids: [bid, ...state.recentBids].slice(0, 200),
    })),

  setSimulatorState: (simulatorState) => set({ simulatorState }),

  clearBids: () => set({ recentBids: [], metrics: null, metricsHistory: [] }),
}));
