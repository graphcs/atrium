import type { BidRequest, Impression } from '@atrium/shared';

/**
 * Win probability model.
 * Uses a feature-weighted scoring approach that learns from outcomes.
 * In production this would be a proper ML model; here we use an adaptive heuristic.
 */
export class WinScorer {
  private featureWeights: Map<string, number> = new Map();
  private learningRate: number;
  private baseWinRate = 0.5;

  constructor(learningRate = 0.05) {
    this.learningRate = learningRate;
  }

  score(request: BidRequest, impression: Impression, bidPrice: number): number {
    const floor = impression.bidfloor ?? 0;

    let probability = this.baseWinRate;

    // Bid-to-floor ratio
    if (floor > 0) {
      const ratio = bidPrice / floor;
      probability *= Math.min(ratio, 2.0);
    }

    // Reseller-specific adjustment
    const resellerId = request.site?.publisher?.id ?? 'unknown';
    const resellerWeight = this.featureWeights.get(`reseller:${resellerId}`) ?? 1.0;
    probability *= resellerWeight;

    // Device type adjustment
    const deviceType = request.device?.devicetype ?? 2;
    const deviceWeight = this.featureWeights.get(`device:${deviceType}`) ?? 1.0;
    probability *= deviceWeight;

    // Geo adjustment
    const country = request.device?.geo?.country ?? 'unknown';
    const geoWeight = this.featureWeights.get(`geo:${country}`) ?? 1.0;
    probability *= geoWeight;

    return Math.max(0, Math.min(1, probability));
  }

  recordOutcome(request: BidRequest, won: boolean): void {
    const direction = won ? 1 : -1;
    const adjustment = this.learningRate * direction;

    const resellerId = request.site?.publisher?.id ?? 'unknown';
    this.adjustWeight(`reseller:${resellerId}`, adjustment);

    const deviceType = request.device?.devicetype ?? 2;
    this.adjustWeight(`device:${deviceType}`, adjustment);

    const country = request.device?.geo?.country ?? 'unknown';
    this.adjustWeight(`geo:${country}`, adjustment);

    this.baseWinRate += this.learningRate * 0.1 * direction;
    this.baseWinRate = Math.max(0.1, Math.min(0.9, this.baseWinRate));
  }

  private adjustWeight(key: string, adjustment: number): void {
    const current = this.featureWeights.get(key) ?? 1.0;
    this.featureWeights.set(key, Math.max(0.1, Math.min(2.0, current + adjustment)));
  }

  reset(): void {
    this.featureWeights.clear();
    this.baseWinRate = 0.5;
  }
}
