import type { Impression } from '@atrium/shared';
import { BID_ENGINE_DEFAULTS } from '@atrium/shared';

/**
 * Bid shading — calculate optimal bid price.
 * Goal: bid just enough to win, not more.
 */
export class BidPricer {
  private clearingPriceHistory: number[] = [];
  private maxHistory = 1000;
  private shadingFactor: number;

  constructor(shadingFactor = BID_ENGINE_DEFAULTS.bidShadingFactor) {
    this.shadingFactor = shadingFactor;
  }

  calculateBid(impression: Impression, maxBidCpm: number, winProbability: number): number {
    const floor = impression.bidfloor ?? 0;

    const estimatedClearing = this.getEstimatedClearingPrice(floor);

    // If we're likely to win, bid lower. If unlikely, bid higher.
    const probabilityAdjustment = 1 + (0.5 - winProbability) * 0.4;

    let bidPrice = estimatedClearing * this.shadingFactor * probabilityAdjustment;

    // At least 1% above floor
    bidPrice = Math.max(bidPrice, floor * 1.01);

    // Never exceed max
    bidPrice = Math.min(bidPrice, maxBidCpm);

    // Never bid more than 3x the floor
    if (floor > 0) {
      bidPrice = Math.min(bidPrice, floor * BID_ENGINE_DEFAULTS.maxBidToFloorRatio);
    }

    return Math.round(bidPrice * 100) / 100;
  }

  recordClearingPrice(price: number): void {
    this.clearingPriceHistory.push(price);
    if (this.clearingPriceHistory.length > this.maxHistory) {
      this.clearingPriceHistory.shift();
    }
  }

  private getEstimatedClearingPrice(floor: number): number {
    if (this.clearingPriceHistory.length < 10) {
      // Aggressive initial estimate — bid competitively while learning
      return floor * 1.8;
    }

    const recent = this.clearingPriceHistory.slice(-100);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    return Math.max(avg, floor * 1.1);
  }

  reset(): void {
    this.clearingPriceHistory = [];
  }
}
