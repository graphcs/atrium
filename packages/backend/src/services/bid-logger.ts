import { getDb } from '../db/client.js';
import type { BidLog } from '@atrium/shared';

export class BidLogger {
  log(entry: BidLog): void {
    const db = getDb();
    db.prepare(`
      INSERT INTO bid_logs (id, timestamp, campaign_id, reseller, impression_id, bid_request_id, decision, bid_amount, floor_price, win_probability, outcome, clearing_price, filter_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      entry.id,
      entry.timestamp,
      entry.campaignId,
      entry.reseller,
      entry.impressionId,
      entry.bidRequestId,
      entry.decision,
      entry.bidAmount ?? null,
      entry.floorPrice ?? null,
      entry.winProbability ?? null,
      entry.outcome ?? null,
      entry.clearingPrice ?? null,
      entry.filterReason ?? null,
    );
  }

  logBatch(entries: BidLog[]): void {
    const db = getDb();
    const stmt = db.prepare(`
      INSERT INTO bid_logs (id, timestamp, campaign_id, reseller, impression_id, bid_request_id, decision, bid_amount, floor_price, win_probability, outcome, clearing_price, filter_reason)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const insertMany = db.transaction((logs: BidLog[]) => {
      for (const e of logs) {
        stmt.run(e.id, e.timestamp, e.campaignId, e.reseller, e.impressionId, e.bidRequestId, e.decision, e.bidAmount ?? null, e.floorPrice ?? null, e.winProbability ?? null, e.outcome ?? null, e.clearingPrice ?? null, e.filterReason ?? null);
      }
    });

    insertMany(entries);
  }

  getRecent(limit = 50): BidLog[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM bid_logs ORDER BY timestamp DESC LIMIT ?').all(limit) as any[];
    return rows.map(this.rowToBidLog);
  }

  private rowToBidLog(row: any): BidLog {
    return {
      id: row.id,
      timestamp: row.timestamp,
      campaignId: row.campaign_id,
      reseller: row.reseller,
      impressionId: row.impression_id,
      bidRequestId: row.bid_request_id,
      decision: row.decision,
      bidAmount: row.bid_amount,
      floorPrice: row.floor_price,
      winProbability: row.win_probability,
      outcome: row.outcome,
      clearingPrice: row.clearing_price,
      filterReason: row.filter_reason,
    };
  }
}
