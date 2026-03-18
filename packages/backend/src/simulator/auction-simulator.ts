import { EventEmitter } from 'events';
import type { SimulatorConfig, SimulatorState, BidLog, ResellerConfig } from '@atrium/shared';
import { BidOutcome, DEFAULT_SIMULATOR_CONFIG } from '@atrium/shared';
import { BidEngine } from '../engine/bid-engine.js';
import { CampaignService } from '../services/campaign-service.js';
import { BidLogger } from '../services/bid-logger.js';
import { AnalyticsService } from '../services/analytics-service.js';
import { generateBidRequest } from './inventory-generator.js';
import { generateCompetitorBids, resolveAuction } from './competitor-model.js';

export class AuctionSimulator extends EventEmitter {
  private config: SimulatorConfig;
  private engine: BidEngine;
  private campaignService: CampaignService;
  private bidLogger: BidLogger;
  private analyticsService: AnalyticsService;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private startTime = 0;
  private totalRequests = 0;
  private totalBids = 0;
  private totalWins = 0;
  private status: 'idle' | 'running' | 'stopped' = 'idle';

  constructor() {
    super();
    this.config = { ...DEFAULT_SIMULATOR_CONFIG };
    this.engine = new BidEngine();
    this.campaignService = new CampaignService();
    this.bidLogger = new BidLogger();
    this.analyticsService = new AnalyticsService();
  }

  start(config?: Partial<SimulatorConfig>): void {
    if (this.status === 'running') return;

    if (config) {
      this.config = { ...this.config, ...config };
    }

    this.status = 'running';
    this.startTime = Date.now();

    const intervalMs = Math.max(10, Math.floor(1000 / this.config.requestsPerSecond));

    this.intervalId = setInterval(() => {
      this.tick();
    }, intervalMs);

    this.emit('state', this.getState());
  }

  /** Update config while running (restarts the interval if RPS changed) */
  updateConfig(config: Partial<SimulatorConfig>): void {
    const oldRps = this.config.requestsPerSecond;
    this.config = { ...this.config, ...config };

    // If RPS changed and we're running, restart the interval at the new rate
    if (this.status === 'running' && config.requestsPerSecond && config.requestsPerSecond !== oldRps) {
      if (this.intervalId) {
        clearInterval(this.intervalId);
      }
      const intervalMs = Math.max(10, Math.floor(1000 / this.config.requestsPerSecond));
      this.intervalId = setInterval(() => {
        this.tick();
      }, intervalMs);
    }

    this.emit('state', this.getState());
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.status = 'stopped';
    this.emit('state', this.getState());
  }

  reset(): void {
    this.stop();
    this.engine.reset();
    this.analyticsService.clearAll();
    this.totalRequests = 0;
    this.totalBids = 0;
    this.totalWins = 0;
    this.startTime = 0;
    this.status = 'idle';
    this.emit('state', this.getState());
    this.emit('metrics', this.analyticsService.getMetrics());
  }

  getState(): SimulatorState {
    const elapsed = this.startTime > 0 ? Date.now() - this.startTime : 0;
    return {
      status: this.status,
      config: this.config,
      stats: {
        totalRequests: this.totalRequests,
        totalBids: this.totalBids,
        totalWins: this.totalWins,
        elapsedMs: elapsed,
        requestsPerSecond: elapsed > 0 ? (this.totalRequests / (elapsed / 1000)) : 0,
      },
    };
  }

  private tick(): void {
    const campaigns = this.campaignService.getActive();
    if (campaigns.length === 0) return;

    const reseller = this.pickReseller();
    const bidRequest = generateBidRequest(reseller);

    this.totalRequests++;

    const result = this.engine.processBidRequest(bidRequest, campaigns, reseller.id);

    if (result.response) {
      const ourPrice = result.response.seatbid[0].bid[0].price;
      const competitors = generateCompetitorBids(
        bidRequest.imp[0].bidfloor ?? 1,
        this.config.competitorCount,
        this.config.competitorAggressiveness,
      );
      const auction = resolveAuction(ourPrice, competitors);

      this.totalBids++;

      // Update log entries with outcome
      for (const log of result.logs) {
        if (log.decision === 'bid') {
          log.outcome = auction.won ? BidOutcome.Win : BidOutcome.Loss;
          log.clearingPrice = auction.clearingPrice;
        }
      }

      // Record outcome for model learning
      this.engine.recordOutcome(bidRequest, auction.won, auction.clearingPrice);

      if (auction.won) {
        this.totalWins++;
        if (result.campaignId) {
          this.campaignService.updateSpend(result.campaignId, auction.clearingPrice / 1000);
        }
      }
    }

    // Log all evaluations
    this.bidLogger.logBatch(result.logs);

    // Emit events for real-time updates
    for (const log of result.logs) {
      this.emit('bid_result', log);
    }

    // Emit metrics every 10 requests
    if (this.totalRequests % 10 === 0) {
      this.emit('metrics', this.analyticsService.getMetrics());
      this.emit('state', this.getState());
    }
  }

  private pickReseller(): ResellerConfig {
    const totalWeight = this.config.resellers.reduce((sum, r) => sum + r.weight, 0);
    let random = Math.random() * totalWeight;
    for (const reseller of this.config.resellers) {
      random -= reseller.weight;
      if (random <= 0) return reseller;
    }
    return this.config.resellers[0];
  }
}
