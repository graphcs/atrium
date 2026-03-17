import { v4 as uuid } from 'uuid';
import { getDb } from '../db/client.js';
import type { Campaign, CampaignCreateInput, CampaignStatus } from '@atrium/shared';

export class CampaignService {
  create(input: CampaignCreateInput): Campaign {
    const db = getDb();
    const id = uuid();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO campaigns (id, name, status, budget_total, budget_daily, budget_spent, budget_spent_today, budget_max_bid_cpm, targeting, creative, created_at, updated_at)
      VALUES (?, ?, 'draft', ?, ?, 0, 0, ?, ?, ?, ?, ?)
    `).run(
      id,
      input.name,
      input.budget.total,
      input.budget.daily,
      input.budget.maxBidCpm,
      JSON.stringify(input.targeting),
      JSON.stringify(input.creative),
      now,
      now,
    );

    return this.getById(id)!;
  }

  getById(id: string): Campaign | null {
    const db = getDb();
    const row = db.prepare('SELECT * FROM campaigns WHERE id = ?').get(id) as any;
    if (!row) return null;
    return this.rowToCampaign(row);
  }

  getAll(): Campaign[] {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM campaigns ORDER BY created_at DESC').all() as any[];
    return rows.map((r) => this.rowToCampaign(r));
  }

  getActive(): Campaign[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM campaigns WHERE status = 'active'").all() as any[];
    return rows.map((r) => this.rowToCampaign(r));
  }

  updateStatus(id: string, status: CampaignStatus): Campaign | null {
    const db = getDb();
    db.prepare("UPDATE campaigns SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
    return this.getById(id);
  }

  updateSpend(id: string, amount: number): void {
    const db = getDb();
    db.prepare(`
      UPDATE campaigns
      SET budget_spent = budget_spent + ?,
          budget_spent_today = budget_spent_today + ?,
          updated_at = datetime('now')
      WHERE id = ?
    `).run(amount, amount, id);
  }

  delete(id: string): boolean {
    const db = getDb();
    const result = db.prepare('DELETE FROM campaigns WHERE id = ?').run(id);
    return result.changes > 0;
  }

  resetDailySpend(): void {
    const db = getDb();
    db.prepare("UPDATE campaigns SET budget_spent_today = 0, updated_at = datetime('now')").run();
  }

  private rowToCampaign(row: any): Campaign {
    return {
      id: row.id,
      name: row.name,
      status: row.status as CampaignStatus,
      budget: {
        total: row.budget_total,
        daily: row.budget_daily,
        spent: row.budget_spent,
        spentToday: row.budget_spent_today,
        maxBidCpm: row.budget_max_bid_cpm,
      },
      targeting: JSON.parse(row.targeting),
      creative: JSON.parse(row.creative),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}
