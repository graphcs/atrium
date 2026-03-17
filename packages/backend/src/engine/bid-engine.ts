import { v4 as uuid } from 'uuid';
import type { BidRequest, BidResponse, Campaign, BidLog, Impression } from '@atrium/shared';
import { BidDecision, BidOutcome, BID_ENGINE_DEFAULTS } from '@atrium/shared';
import { filterBidRequest } from './bid-filter.js';
import { WinScorer } from './win-scorer.js';
import { BidPricer } from './bid-pricer.js';
import { BudgetPacer } from './budget-pacer.js';

export interface BidEngineResult {
  response: BidResponse | null;
  logs: BidLog[];
  campaignId?: string;
}

export class BidEngine {
  private scorer = new WinScorer();
  private pricer = new BidPricer();
  private pacer = new BudgetPacer();

  processBidRequest(request: BidRequest, campaigns: Campaign[], reseller: string): BidEngineResult {
    const logs: BidLog[] = [];
    let bestBid: { campaignId: string; impId: string; price: number; winProb: number } | null = null;

    for (const imp of request.imp) {
      for (const campaign of campaigns) {
        const log = this.evaluateOpportunity(request, imp, campaign, reseller);
        logs.push(log);

        if (log.decision === BidDecision.Bid && log.bidAmount) {
          if (!bestBid || log.bidAmount > bestBid.price) {
            bestBid = {
              campaignId: campaign.id,
              impId: imp.id,
              price: log.bidAmount,
              winProb: log.winProbability ?? 0,
            };
          }
        }
      }
    }

    if (!bestBid) {
      return { response: null, logs };
    }

    const response: BidResponse = {
      id: request.id,
      seatbid: [{
        seat: 'atrium',
        bid: [{
          id: uuid(),
          impid: bestBid.impId,
          price: bestBid.price,
          adm: '<VAST version="3.0"><Ad><!-- Atrium Creative --></Ad></VAST>',
          adomain: ['atrium.io'],
        }],
      }],
    };

    return { response, logs, campaignId: bestBid.campaignId };
  }

  private evaluateOpportunity(
    request: BidRequest,
    impression: Impression,
    campaign: Campaign,
    reseller: string,
  ): BidLog {
    const timestamp = new Date().toISOString();
    const baseLog: BidLog = {
      id: uuid(),
      timestamp,
      campaignId: campaign.id,
      reseller,
      impressionId: impression.id,
      bidRequestId: request.id,
      decision: BidDecision.NoBid,
      floorPrice: impression.bidfloor,
      outcome: BidOutcome.Pending,
    };

    // Step 1: Filter
    const filterResult = filterBidRequest(request, impression, campaign);
    if (!filterResult.pass) {
      return { ...baseLog, filterReason: filterResult.reason };
    }

    // Step 2: Budget pacing
    const throttle = this.pacer.getThrottle(campaign);
    if (throttle <= 0) {
      return { ...baseLog, filterReason: 'budget_pacing' };
    }
    if (Math.random() > throttle) {
      return { ...baseLog, filterReason: 'pacing_throttle' };
    }

    // Step 3: Rate limit
    if (!this.pacer.checkRateLimit()) {
      return { ...baseLog, filterReason: 'rate_limited' };
    }

    // Step 4: Score win probability
    const preliminaryPrice = (impression.bidfloor ?? 1) * 1.2;
    const winProbability = this.scorer.score(request, impression, preliminaryPrice);

    if (winProbability < BID_ENGINE_DEFAULTS.minWinProbabilityThreshold) {
      return { ...baseLog, winProbability, filterReason: 'low_win_probability' };
    }

    // Step 5: Calculate optimal bid price
    const bidAmount = this.pricer.calculateBid(impression, campaign.budget.maxBidCpm, winProbability);

    return {
      ...baseLog,
      decision: BidDecision.Bid,
      bidAmount,
      winProbability,
    };
  }

  recordOutcome(request: BidRequest, won: boolean, clearingPrice?: number): void {
    this.scorer.recordOutcome(request, won);
    if (clearingPrice !== undefined) {
      this.pricer.recordClearingPrice(clearingPrice);
    }
  }

  reset(): void {
    this.scorer.reset();
    this.pricer.reset();
    this.pacer.reset();
  }
}
