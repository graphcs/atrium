import { getDb } from '../db/client.js';
import type { AuctionMetrics } from '@atrium/shared';

export class AnalyticsService {
  getMetrics(): AuctionMetrics {
    const db = getDb();

    // Note: bid_amount and clearing_price are stored as CPM (cost per 1000 impressions).
    // Each row = one impression, so divide by 1000 to get actual per-impression cost.
    const totals = db.prepare(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN decision = 'bid' THEN 1 ELSE 0 END) as total_bids,
        SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as total_wins,
        SUM(CASE WHEN outcome = 'loss' THEN 1 ELSE 0 END) as total_losses,
        SUM(CASE WHEN decision = 'no_bid' THEN 1 ELSE 0 END) as total_no_bids,
        AVG(CASE WHEN decision = 'bid' THEN bid_amount END) as avg_bid_price,
        AVG(CASE WHEN outcome = 'win' THEN clearing_price END) as avg_clearing_price,
        SUM(CASE WHEN outcome = 'win' THEN clearing_price / 1000.0 ELSE 0 END) as total_spend
      FROM bid_logs
    `).get() as any;

    const totalBids = totals.total_bids || 0;
    const totalWins = totals.total_wins || 0;

    return {
      totalBidRequests: totals.total_requests || 0,
      totalBids,
      totalWins,
      totalLosses: totals.total_losses || 0,
      totalNoBids: totals.total_no_bids || 0,
      winRate: totalBids > 0 ? totalWins / totalBids : 0,
      bidRate: totals.total_requests > 0 ? totalBids / totals.total_requests : 0,
      avgBidPrice: totals.avg_bid_price || 0,
      avgClearingPrice: totals.avg_clearing_price || 0,
      totalSpend: totals.total_spend || 0,
      avgCpm: totals.avg_clearing_price || 0, // already in CPM units
      wasteRatio: totalBids > 0 ? (totals.total_losses / totalBids) : 0,
    };
  }

  getMetricsByReseller(): Record<string, AuctionMetrics> {
    const db = getDb();
    const resellers = db.prepare('SELECT DISTINCT reseller FROM bid_logs').all() as any[];

    const result: Record<string, AuctionMetrics> = {};
    for (const { reseller } of resellers) {
      const totals = db.prepare(`
        SELECT
          COUNT(*) as total_requests,
          SUM(CASE WHEN decision = 'bid' THEN 1 ELSE 0 END) as total_bids,
          SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as total_wins,
          SUM(CASE WHEN outcome = 'loss' THEN 1 ELSE 0 END) as total_losses,
          SUM(CASE WHEN decision = 'no_bid' THEN 1 ELSE 0 END) as total_no_bids,
          AVG(CASE WHEN decision = 'bid' THEN bid_amount END) as avg_bid_price,
          AVG(CASE WHEN outcome = 'win' THEN clearing_price END) as avg_clearing_price,
          SUM(CASE WHEN outcome = 'win' THEN clearing_price / 1000.0 ELSE 0 END) as total_spend
        FROM bid_logs WHERE reseller = ?
      `).get(reseller) as any;

      const totalBids = totals.total_bids || 0;
      const totalWins = totals.total_wins || 0;

      result[reseller] = {
        totalBidRequests: totals.total_requests || 0,
        totalBids,
        totalWins,
        totalLosses: totals.total_losses || 0,
        totalNoBids: totals.total_no_bids || 0,
        winRate: totalBids > 0 ? totalWins / totalBids : 0,
        bidRate: totals.total_requests > 0 ? totalBids / totals.total_requests : 0,
        avgBidPrice: totals.avg_bid_price || 0,
        avgClearingPrice: totals.avg_clearing_price || 0,
        totalSpend: totals.total_spend || 0,
        avgCpm: totals.avg_clearing_price || 0,
        wasteRatio: totalBids > 0 ? (totals.total_losses / totalBids) : 0,
      };
    }

    return result;
  }

  clearAll(): void {
    const db = getDb();
    db.prepare('DELETE FROM bid_logs').run();
  }
}
