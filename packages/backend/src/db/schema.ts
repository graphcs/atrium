import Database from 'better-sqlite3';

export function initializeDatabase(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS campaigns (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'draft',
      budget_total REAL NOT NULL,
      budget_daily REAL NOT NULL,
      budget_spent REAL NOT NULL DEFAULT 0,
      budget_spent_today REAL NOT NULL DEFAULT 0,
      budget_max_bid_cpm REAL NOT NULL,
      targeting TEXT NOT NULL,
      creative TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS bid_logs (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL DEFAULT (datetime('now')),
      campaign_id TEXT NOT NULL,
      reseller TEXT NOT NULL,
      impression_id TEXT NOT NULL,
      bid_request_id TEXT NOT NULL,
      decision TEXT NOT NULL,
      bid_amount REAL,
      floor_price REAL,
      win_probability REAL,
      outcome TEXT DEFAULT 'pending',
      clearing_price REAL,
      filter_reason TEXT,
      FOREIGN KEY (campaign_id) REFERENCES campaigns(id)
    );

    CREATE INDEX IF NOT EXISTS idx_bid_logs_campaign ON bid_logs(campaign_id);
    CREATE INDEX IF NOT EXISTS idx_bid_logs_timestamp ON bid_logs(timestamp);
    CREATE INDEX IF NOT EXISTS idx_bid_logs_outcome ON bid_logs(outcome);
  `);
}
