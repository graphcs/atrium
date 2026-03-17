# Atrium Video Ad Auction Platform — Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a TypeScript monorepo prototype of a DSP (Demand-Side Platform) that aggregates video ad supply from resellers (KueezRTB, Rise Codes) via OpenRTB 2.6, runs smart auctions with high win rates, and presents a professional real-time dashboard.

**Architecture:** Fastify backend with a modular bid engine (filter → score → price → pace), reseller adapters behind a common OpenRTB interface, a built-in auction simulator that generates realistic bid requests with competing bidders, and WebSocket streaming to a React frontend. SQLite for persistence, in-memory maps for real-time bid state and budget tracking.

**Tech Stack:** TypeScript, pnpm workspaces, Fastify, React 18, Vite, SQLite (better-sqlite3), WebSocket (ws + socket.io), Tailwind CSS, Recharts

---

## File Structure

```
atrium/
├── pnpm-workspace.yaml
├── package.json                          # root: scripts, devDeps
├── tsconfig.base.json                    # shared TS config
├── turbo.json                            # turborepo config
│
├── packages/
│   ├── shared/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # barrel export
│   │       ├── types/
│   │       │   ├── openrtb.ts            # OpenRTB 2.6 bid request/response types
│   │       │   ├── campaign.ts           # Campaign, targeting, budget types
│   │       │   ├── analytics.ts          # Metrics, bid log types
│   │       │   └── simulator.ts          # Simulator control/state types
│   │       └── constants/
│   │           ├── openrtb.ts            # Protocol enums (device types, video protocols, etc.)
│   │           └── defaults.ts           # Default config values
│   │
│   ├── backend/
│   │   ├── package.json
│   │   ├── tsconfig.json
│   │   └── src/
│   │       ├── index.ts                  # Fastify server bootstrap
│   │       ├── db/
│   │       │   ├── schema.ts             # SQLite schema + migrations
│   │       │   └── client.ts             # DB singleton
│   │       ├── routes/
│   │       │   ├── campaigns.ts          # CRUD /api/campaigns
│   │       │   ├── analytics.ts          # GET /api/analytics/*
│   │       │   └── simulator.ts          # POST /api/simulator/start|stop|reset
│   │       ├── engine/
│   │       │   ├── bid-engine.ts         # Orchestrator: filter → score → price → pace
│   │       │   ├── bid-filter.ts         # Targeting match logic
│   │       │   ├── bid-pricer.ts         # Bid shading / price calculation
│   │       │   ├── win-scorer.ts         # Win probability model
│   │       │   └── budget-pacer.ts       # Budget pacing / throttle
│   │       ├── adapters/
│   │       │   ├── base-adapter.ts       # Abstract adapter interface
│   │       │   ├── kueez-adapter.ts      # KueezRTB-specific adapter
│   │       │   └── rise-adapter.ts       # Rise Codes-specific adapter
│   │       ├── simulator/
│   │       │   ├── auction-simulator.ts  # Generates bid requests, simulates competing bidders
│   │       │   ├── inventory-generator.ts# Realistic impression/inventory generation
│   │       │   └── competitor-model.ts   # Simulated competing DSP bids
│   │       ├── services/
│   │       │   ├── campaign-service.ts   # Campaign business logic
│   │       │   ├── analytics-service.ts  # Metrics aggregation
│   │       │   └── bid-logger.ts         # Logs every bid for analytics
│   │       └── ws/
│   │           └── socket-server.ts      # WebSocket server for real-time updates
│   │
│   └── frontend/
│       ├── package.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       ├── postcss.config.js
│       ├── index.html
│       └── src/
│           ├── main.tsx                  # React entry
│           ├── App.tsx                   # Router + layout
│           ├── hooks/
│           │   ├── useSocket.ts          # WebSocket connection hook
│           │   └── useApi.ts             # REST API hook
│           ├── stores/
│           │   └── auction-store.ts      # Zustand store for real-time state
│           ├── pages/
│           │   ├── Dashboard.tsx         # Main dashboard with metrics
│           │   ├── Campaigns.tsx         # Campaign list + create
│           │   └── AuctionLive.tsx       # Live auction feed + simulator controls
│           └── components/
│               ├── layout/
│               │   ├── Sidebar.tsx
│               │   └── Header.tsx
│               ├── metrics/
│               │   ├── MetricCard.tsx
│               │   ├── WinRateGauge.tsx
│               │   └── SpendChart.tsx
│               ├── auction/
│               │   ├── BidFeed.tsx
│               │   ├── SimulatorControls.tsx
│               │   └── AuctionStats.tsx
│               └── campaigns/
│                   ├── CampaignForm.tsx
│                   └── CampaignCard.tsx
│
└── docs/
    └── architecture.md                   # Architecture document for presentation
```

---

## Task 1: Monorepo Scaffold

**Files:**
- Create: `pnpm-workspace.yaml`
- Create: `package.json` (root)
- Create: `tsconfig.base.json`
- Create: `turbo.json`
- Create: `packages/shared/package.json`
- Create: `packages/shared/tsconfig.json`
- Create: `packages/backend/package.json`
- Create: `packages/backend/tsconfig.json`
- Create: `packages/frontend/package.json`
- Create: `packages/frontend/tsconfig.json`
- Create: `packages/frontend/vite.config.ts`
- Create: `packages/frontend/tailwind.config.ts`
- Create: `packages/frontend/postcss.config.js`
- Create: `packages/frontend/index.html`

- [ ] **Step 1: Create root workspace config**

`pnpm-workspace.yaml`:
```yaml
packages:
  - "packages/*"
```

`package.json`:
```json
{
  "name": "atrium",
  "private": true,
  "scripts": {
    "dev": "turbo run dev",
    "build": "turbo run build",
    "dev:backend": "pnpm --filter @atrium/backend dev",
    "dev:frontend": "pnpm --filter @atrium/frontend dev"
  },
  "devDependencies": {
    "turbo": "^2.0.0",
    "typescript": "^5.4.0"
  }
}
```

`tsconfig.base.json`:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "dist",
    "rootDir": "src",
    "resolveJsonModule": true,
    "isolatedModules": true
  }
}
```

`turbo.json`:
```json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    }
  }
}
```

- [ ] **Step 2: Create shared package**

`packages/shared/package.json`:
```json
{
  "name": "@atrium/shared",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "main": "src/index.ts",
  "types": "src/index.ts",
  "scripts": {
    "build": "tsc",
    "dev": "tsc --watch"
  }
}
```

`packages/shared/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 3: Create backend package**

`packages/backend/package.json`:
```json
{
  "name": "@atrium/backend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "@atrium/shared": "workspace:*",
    "fastify": "^5.0.0",
    "@fastify/cors": "^10.0.0",
    "@fastify/websocket": "^11.0.0",
    "better-sqlite3": "^11.0.0",
    "socket.io": "^4.7.0",
    "uuid": "^10.0.0",
    "zod": "^3.23.0"
  },
  "devDependencies": {
    "@types/better-sqlite3": "^7.6.0",
    "@types/uuid": "^10.0.0",
    "tsx": "^4.0.0"
  }
}
```

`packages/backend/tsconfig.json`:
```json
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src"]
}
```

- [ ] **Step 4: Create frontend package**

`packages/frontend/package.json`:
```json
{
  "name": "@atrium/frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@atrium/shared": "workspace:*",
    "react": "^18.3.0",
    "react-dom": "^18.3.0",
    "react-router-dom": "^6.23.0",
    "socket.io-client": "^4.7.0",
    "zustand": "^4.5.0",
    "recharts": "^2.12.0",
    "lucide-react": "^0.400.0",
    "clsx": "^2.1.0"
  },
  "devDependencies": {
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    "tailwindcss": "^3.4.0",
    "vite": "^5.4.0"
  }
}
```

`packages/frontend/vite.config.ts`:
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3001',
      '/socket.io': {
        target: 'http://localhost:3001',
        ws: true,
      },
    },
  },
});
```

`packages/frontend/tailwind.config.ts`:
```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        atrium: {
          50: '#f0f4ff',
          100: '#dbe4ff',
          200: '#bac8ff',
          300: '#91a7ff',
          400: '#748ffc',
          500: '#5c7cfa',
          600: '#4c6ef5',
          700: '#4263eb',
          800: '#3b5bdb',
          900: '#364fc7',
          950: '#1e3a8a',
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

`packages/frontend/postcss.config.js`:
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
```

`packages/frontend/index.html`:
```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Atrium — Video Ad Auction Platform</title>
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

- [ ] **Step 5: Install dependencies**

```bash
cd /root/code/atrium && pnpm install
```

- [ ] **Step 6: Commit scaffold**

```bash
git add -A
git commit -m "feat: scaffold monorepo with shared, backend, and frontend packages"
```

---

## Task 2: Shared Types — OpenRTB 2.6 + Domain Types

**Files:**
- Create: `packages/shared/src/types/openrtb.ts`
- Create: `packages/shared/src/types/campaign.ts`
- Create: `packages/shared/src/types/analytics.ts`
- Create: `packages/shared/src/types/simulator.ts`
- Create: `packages/shared/src/constants/openrtb.ts`
- Create: `packages/shared/src/constants/defaults.ts`
- Create: `packages/shared/src/index.ts`

- [ ] **Step 1: Create OpenRTB 2.6 types**

`packages/shared/src/types/openrtb.ts`:
```ts
/** OpenRTB 2.6 Bid Request — simplified for video DSP */
export interface BidRequest {
  id: string;
  imp: Impression[];
  site?: Site;
  app?: App;
  device?: Device;
  user?: User;
  at?: AuctionType; // 1=first price, 2=second price
  tmax?: number; // max time in ms for bid response
  cur?: string[]; // allowed currencies
}

export interface Impression {
  id: string;
  video: Video;
  bidfloor?: number;
  bidfloorcur?: string;
  pmp?: PMP;
}

export interface Video {
  mimes: string[];
  protocols: number[];
  minduration?: number;
  maxduration?: number;
  w?: number;
  h?: number;
  linearity?: number; // 1=linear (in-stream), 2=non-linear
  playbackmethod?: number[];
  startdelay?: number; // 0=pre, >0=mid, -1=generic mid, -2=generic post
  placement?: number;
}

export interface Site {
  id?: string;
  domain?: string;
  cat?: string[]; // IAB content categories
  page?: string;
  publisher?: Publisher;
}

export interface App {
  id?: string;
  bundle?: string;
  cat?: string[];
  publisher?: Publisher;
}

export interface Publisher {
  id?: string;
  name?: string;
  domain?: string;
}

export interface Device {
  ua?: string;
  ip?: string;
  geo?: Geo;
  devicetype?: number;
  os?: string;
  osv?: string;
  language?: string;
}

export interface Geo {
  lat?: number;
  lon?: number;
  country?: string;
  region?: string;
  city?: string;
}

export interface User {
  id?: string;
  buyeruid?: string;
}

export interface PMP {
  private_auction?: number;
  deals?: Deal[];
}

export interface Deal {
  id: string;
  bidfloor?: number;
  at?: AuctionType;
}

export enum AuctionType {
  FirstPrice = 1,
  SecondPrice = 2,
}

/** OpenRTB 2.6 Bid Response */
export interface BidResponse {
  id: string;
  seatbid: SeatBid[];
  cur?: string;
}

export interface SeatBid {
  seat?: string;
  bid: Bid[];
}

export interface Bid {
  id: string;
  impid: string;
  price: number;
  adm?: string; // VAST XML or URL
  nurl?: string; // win notice URL
  adomain?: string[];
  crid?: string; // creative ID
  w?: number;
  h?: number;
  dealid?: string;
}
```

- [ ] **Step 2: Create campaign types**

`packages/shared/src/types/campaign.ts`:
```ts
export interface Campaign {
  id: string;
  name: string;
  status: CampaignStatus;
  budget: Budget;
  targeting: Targeting;
  creative: Creative;
  createdAt: string;
  updatedAt: string;
}

export enum CampaignStatus {
  Draft = 'draft',
  Active = 'active',
  Paused = 'paused',
  Completed = 'completed',
}

export interface Budget {
  total: number; // total budget in USD
  daily: number; // daily cap in USD
  spent: number; // total spent so far
  spentToday: number; // spent today
  maxBidCpm: number; // maximum bid in CPM ($)
}

export interface Targeting {
  geos?: string[]; // ISO country codes
  devices?: DeviceType[];
  categories?: string[]; // IAB categories
  domains?: string[]; // whitelist domains
  excludeDomains?: string[]; // blacklist domains
  videoMinDuration?: number;
  videoMaxDuration?: number;
  resellers?: string[]; // specific resellers to target
}

export enum DeviceType {
  Desktop = 'desktop',
  Mobile = 'mobile',
  Tablet = 'tablet',
  CTV = 'ctv',
}

export interface Creative {
  id: string;
  name: string;
  vastUrl: string; // URL to VAST XML
  duration: number; // seconds
  width: number;
  height: number;
  mimeType: string;
}

export interface CampaignCreateInput {
  name: string;
  budget: Omit<Budget, 'spent' | 'spentToday'>;
  targeting: Targeting;
  creative: Creative;
}
```

- [ ] **Step 3: Create analytics types**

`packages/shared/src/types/analytics.ts`:
```ts
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
  winRate: number; // wins / bids
  bidRate: number; // bids / requests
  avgBidPrice: number;
  avgClearingPrice: number;
  totalSpend: number;
  avgCpm: number;
  wasteRatio: number; // losses / bids
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
```

- [ ] **Step 4: Create simulator types**

`packages/shared/src/types/simulator.ts`:
```ts
export interface SimulatorConfig {
  requestsPerSecond: number;
  resellers: ResellerConfig[];
  competitorCount: number;
  competitorAggressiveness: number; // 0-1, how aggressive competitors bid
}

export interface ResellerConfig {
  id: string;
  name: string;
  weight: number; // probability weight for this reseller
  avgFloorPrice: number;
  floorPriceVariance: number;
  categories: string[];
  geos: string[];
}

export interface SimulatorCommand {
  action: 'start' | 'stop' | 'reset';
  config?: Partial<SimulatorConfig>;
}

export interface SimulatorState {
  status: 'idle' | 'running' | 'stopped';
  config: SimulatorConfig;
  stats: {
    totalRequests: number;
    totalBids: number;
    totalWins: number;
    elapsedMs: number;
    requestsPerSecond: number;
  };
}
```

- [ ] **Step 5: Create constants**

`packages/shared/src/constants/openrtb.ts`:
```ts
export const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/ogg'] as const;

export const VAST_PROTOCOLS = {
  VAST_2_0: 2,
  VAST_3_0: 3,
  VAST_2_0_WRAPPER: 5,
  VAST_3_0_WRAPPER: 6,
  VAST_4_0: 7,
  VAST_4_0_WRAPPER: 8,
} as const;

export const IAB_CATEGORIES = [
  'IAB1', // Arts & Entertainment
  'IAB2', // Automotive
  'IAB3', // Business
  'IAB5', // Education
  'IAB9', // Hobbies & Interests
  'IAB12', // News
  'IAB17', // Sports
  'IAB19', // Technology & Computing
  'IAB20', // Travel
  'IAB22', // Shopping
] as const;

export const DEVICE_TYPES = {
  MOBILE: 1,
  PC: 2,
  CTV: 3,
  TABLET: 5,
} as const;

export const GEO_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'IL',
] as const;
```

`packages/shared/src/constants/defaults.ts`:
```ts
import type { SimulatorConfig } from '../types/simulator.js';

export const DEFAULT_SIMULATOR_CONFIG: SimulatorConfig = {
  requestsPerSecond: 50,
  competitorCount: 5,
  competitorAggressiveness: 0.6,
  resellers: [
    {
      id: 'kueez',
      name: 'KueezRTB',
      weight: 0.5,
      avgFloorPrice: 2.5,
      floorPriceVariance: 1.5,
      categories: ['IAB1', 'IAB9', 'IAB17'],
      geos: ['US', 'GB', 'DE', 'IL'],
    },
    {
      id: 'rise',
      name: 'Rise Codes',
      weight: 0.5,
      avgFloorPrice: 3.0,
      floorPriceVariance: 2.0,
      categories: ['IAB1', 'IAB12', 'IAB19', 'IAB20'],
      geos: ['US', 'GB', 'CA', 'AU', 'FR'],
    },
  ],
};

export const BID_ENGINE_DEFAULTS = {
  minWinProbabilityThreshold: 0.3,
  bidShadingFactor: 0.85, // bid at 85% of estimated clearing price
  maxBidToFloorRatio: 3.0, // never bid more than 3x the floor
  learningRate: 0.05, // how fast win-rate model adapts
};
```

- [ ] **Step 6: Create barrel export**

`packages/shared/src/index.ts`:
```ts
export * from './types/openrtb.js';
export * from './types/campaign.js';
export * from './types/analytics.js';
export * from './types/simulator.js';
export * from './constants/openrtb.js';
export * from './constants/defaults.js';
```

- [ ] **Step 7: Commit**

```bash
git add packages/shared/
git commit -m "feat: add shared types for OpenRTB 2.6, campaigns, analytics, and simulator"
```

---

## Task 3: Backend — Database + Campaign Service

**Files:**
- Create: `packages/backend/src/db/schema.ts`
- Create: `packages/backend/src/db/client.ts`
- Create: `packages/backend/src/services/campaign-service.ts`
- Create: `packages/backend/src/routes/campaigns.ts`

- [ ] **Step 1: Create database schema**

`packages/backend/src/db/schema.ts`:
```ts
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
      targeting TEXT NOT NULL, -- JSON
      creative TEXT NOT NULL, -- JSON
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
```

- [ ] **Step 2: Create database client**

`packages/backend/src/db/client.ts`:
```ts
import Database from 'better-sqlite3';
import { initializeDatabase } from './schema.js';

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database('atrium.db');
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initializeDatabase(db);
  }
  return db;
}

export function closeDb(): void {
  if (db) {
    db.close();
    db = null;
  }
}
```

- [ ] **Step 3: Create campaign service**

`packages/backend/src/services/campaign-service.ts`:
```ts
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
    return rows.map(this.rowToCampaign);
  }

  getActive(): Campaign[] {
    const db = getDb();
    const rows = db.prepare("SELECT * FROM campaigns WHERE status = 'active'").all() as any[];
    return rows.map(this.rowToCampaign);
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
```

- [ ] **Step 4: Create campaign routes**

`packages/backend/src/routes/campaigns.ts`:
```ts
import { FastifyInstance } from 'fastify';
import { CampaignService } from '../services/campaign-service.js';
import type { CampaignStatus } from '@atrium/shared';

const campaignService = new CampaignService();

export async function campaignRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/campaigns', async () => {
    return campaignService.getAll();
  });

  app.get('/api/campaigns/:id', async (req) => {
    const { id } = req.params as { id: string };
    const campaign = campaignService.getById(id);
    if (!campaign) {
      return app.httpErrors.notFound('Campaign not found');
    }
    return campaign;
  });

  app.post('/api/campaigns', async (req) => {
    const input = req.body as any;
    return campaignService.create(input);
  });

  app.patch('/api/campaigns/:id/status', async (req) => {
    const { id } = req.params as { id: string };
    const { status } = req.body as { status: CampaignStatus };
    const campaign = campaignService.updateStatus(id, status);
    if (!campaign) {
      return app.httpErrors.notFound('Campaign not found');
    }
    return campaign;
  });

  app.delete('/api/campaigns/:id', async (req) => {
    const { id } = req.params as { id: string };
    const deleted = campaignService.delete(id);
    if (!deleted) {
      return app.httpErrors.notFound('Campaign not found');
    }
    return { success: true };
  });
}
```

- [ ] **Step 5: Commit**

```bash
git add packages/backend/src/db/ packages/backend/src/services/campaign-service.ts packages/backend/src/routes/campaigns.ts
git commit -m "feat: add campaign CRUD service with SQLite persistence"
```

---

## Task 4: Backend — Bid Engine

**Files:**
- Create: `packages/backend/src/engine/bid-filter.ts`
- Create: `packages/backend/src/engine/win-scorer.ts`
- Create: `packages/backend/src/engine/bid-pricer.ts`
- Create: `packages/backend/src/engine/budget-pacer.ts`
- Create: `packages/backend/src/engine/bid-engine.ts`

- [ ] **Step 1: Create bid filter**

`packages/backend/src/engine/bid-filter.ts`:
```ts
import type { BidRequest, Campaign, Impression } from '@atrium/shared';
import { DEVICE_TYPES } from '@atrium/shared';

export interface FilterResult {
  pass: boolean;
  reason?: string;
}

export function filterBidRequest(request: BidRequest, impression: Impression, campaign: Campaign): FilterResult {
  const t = campaign.targeting;

  // Check budget exhaustion
  if (campaign.budget.spent >= campaign.budget.total) {
    return { pass: false, reason: 'budget_exhausted' };
  }
  if (campaign.budget.spentToday >= campaign.budget.daily) {
    return { pass: false, reason: 'daily_budget_exhausted' };
  }

  // Check bid floor vs max bid
  const floorCpm = impression.bidfloor ?? 0;
  if (floorCpm > campaign.budget.maxBidCpm) {
    return { pass: false, reason: 'floor_exceeds_max_bid' };
  }

  // Check geo targeting
  if (t.geos && t.geos.length > 0 && request.device?.geo?.country) {
    if (!t.geos.includes(request.device.geo.country)) {
      return { pass: false, reason: 'geo_mismatch' };
    }
  }

  // Check device targeting
  if (t.devices && t.devices.length > 0 && request.device?.devicetype) {
    const deviceMap: Record<number, string> = {
      [DEVICE_TYPES.MOBILE]: 'mobile',
      [DEVICE_TYPES.PC]: 'desktop',
      [DEVICE_TYPES.TABLET]: 'tablet',
      [DEVICE_TYPES.CTV]: 'ctv',
    };
    const deviceName = deviceMap[request.device.devicetype];
    if (deviceName && !t.devices.includes(deviceName as any)) {
      return { pass: false, reason: 'device_mismatch' };
    }
  }

  // Check category targeting
  if (t.categories && t.categories.length > 0 && request.site?.cat) {
    const overlap = request.site.cat.some(c => t.categories!.includes(c));
    if (!overlap) {
      return { pass: false, reason: 'category_mismatch' };
    }
  }

  // Check domain blacklist
  if (t.excludeDomains && t.excludeDomains.length > 0 && request.site?.domain) {
    if (t.excludeDomains.includes(request.site.domain)) {
      return { pass: false, reason: 'domain_excluded' };
    }
  }

  // Check domain whitelist
  if (t.domains && t.domains.length > 0 && request.site?.domain) {
    if (!t.domains.includes(request.site.domain)) {
      return { pass: false, reason: 'domain_not_whitelisted' };
    }
  }

  // Check video duration compatibility
  if (impression.video) {
    const creative = campaign.creative;
    if (impression.video.maxduration && creative.duration > impression.video.maxduration) {
      return { pass: false, reason: 'creative_too_long' };
    }
    if (impression.video.minduration && creative.duration < impression.video.minduration) {
      return { pass: false, reason: 'creative_too_short' };
    }
  }

  return { pass: true };
}
```

- [ ] **Step 2: Create win probability scorer**

`packages/backend/src/engine/win-scorer.ts`:
```ts
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

  /**
   * Predict probability of winning at a given bid price.
   * Returns 0-1 probability.
   */
  score(request: BidRequest, impression: Impression, bidPrice: number): number {
    const floor = impression.bidfloor ?? 0;

    // Base: ratio of bid to floor (higher ratio = higher chance)
    let probability = this.baseWinRate;

    // Feature: bid-to-floor ratio
    if (floor > 0) {
      const ratio = bidPrice / floor;
      probability *= Math.min(ratio, 2.0); // cap contribution at 2x
    }

    // Feature: reseller-specific adjustment
    const resellerId = request.site?.publisher?.id ?? 'unknown';
    const resellerWeight = this.featureWeights.get(`reseller:${resellerId}`) ?? 1.0;
    probability *= resellerWeight;

    // Feature: device type adjustment (mobile tends more competitive)
    const deviceType = request.device?.devicetype ?? 2;
    const deviceWeight = this.featureWeights.get(`device:${deviceType}`) ?? 1.0;
    probability *= deviceWeight;

    // Feature: geo adjustment
    const country = request.device?.geo?.country ?? 'unknown';
    const geoWeight = this.featureWeights.get(`geo:${country}`) ?? 1.0;
    probability *= geoWeight;

    // Clamp to 0-1
    return Math.max(0, Math.min(1, probability));
  }

  /**
   * Update model weights based on auction outcome.
   */
  recordOutcome(request: BidRequest, won: boolean): void {
    const direction = won ? 1 : -1;
    const adjustment = this.learningRate * direction;

    // Update reseller weight
    const resellerId = request.site?.publisher?.id ?? 'unknown';
    const resellerKey = `reseller:${resellerId}`;
    const currentReseller = this.featureWeights.get(resellerKey) ?? 1.0;
    this.featureWeights.set(resellerKey, Math.max(0.1, Math.min(2.0, currentReseller + adjustment)));

    // Update device weight
    const deviceType = request.device?.devicetype ?? 2;
    const deviceKey = `device:${deviceType}`;
    const currentDevice = this.featureWeights.get(deviceKey) ?? 1.0;
    this.featureWeights.set(deviceKey, Math.max(0.1, Math.min(2.0, currentDevice + adjustment)));

    // Update geo weight
    const country = request.device?.geo?.country ?? 'unknown';
    const geoKey = `geo:${country}`;
    const currentGeo = this.featureWeights.get(geoKey) ?? 1.0;
    this.featureWeights.set(geoKey, Math.max(0.1, Math.min(2.0, currentGeo + adjustment)));

    // Update base win rate (slow moving average)
    this.baseWinRate = this.baseWinRate + (this.learningRate * 0.1 * direction);
    this.baseWinRate = Math.max(0.1, Math.min(0.9, this.baseWinRate));
  }

  reset(): void {
    this.featureWeights.clear();
    this.baseWinRate = 0.5;
  }
}
```

- [ ] **Step 3: Create bid pricer (bid shading)**

`packages/backend/src/engine/bid-pricer.ts`:
```ts
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

  /**
   * Calculate optimal bid price for an impression.
   */
  calculateBid(impression: Impression, maxBidCpm: number, winProbability: number): number {
    const floor = impression.bidfloor ?? 0;

    // Strategy: Start from estimated clearing price and shade down
    const estimatedClearing = this.getEstimatedClearingPrice(floor);

    // Adjust based on win probability — if we're likely to win, bid lower
    // If unlikely, bid higher (closer to our max)
    const probabilityAdjustment = 1 + (0.5 - winProbability) * 0.4;

    let bidPrice = estimatedClearing * this.shadingFactor * probabilityAdjustment;

    // Enforce floor
    bidPrice = Math.max(bidPrice, floor * 1.01); // at least 1% above floor

    // Enforce ceiling
    bidPrice = Math.min(bidPrice, maxBidCpm);

    // Enforce max ratio to floor
    if (floor > 0) {
      bidPrice = Math.min(bidPrice, floor * BID_ENGINE_DEFAULTS.maxBidToFloorRatio);
    }

    return Math.round(bidPrice * 100) / 100; // round to cents
  }

  /**
   * Record actual clearing price to improve future estimates.
   */
  recordClearingPrice(price: number): void {
    this.clearingPriceHistory.push(price);
    if (this.clearingPriceHistory.length > this.maxHistory) {
      this.clearingPriceHistory.shift();
    }
  }

  private getEstimatedClearingPrice(floor: number): number {
    if (this.clearingPriceHistory.length < 10) {
      // Not enough data — estimate as floor + 30%
      return floor * 1.3;
    }

    // Use recent moving average
    const recent = this.clearingPriceHistory.slice(-100);
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    return Math.max(avg, floor * 1.05);
  }

  reset(): void {
    this.clearingPriceHistory = [];
  }
}
```

- [ ] **Step 4: Create budget pacer**

`packages/backend/src/engine/budget-pacer.ts`:
```ts
import type { Campaign } from '@atrium/shared';

/**
 * Budget pacing — controls spend rate to distribute budget evenly.
 */
export class BudgetPacer {
  private bidCountThisSecond = 0;
  private lastSecondTimestamp = 0;

  /**
   * Check if a campaign can afford to bid right now.
   * Returns a throttle factor 0-1 (0 = don't bid, 1 = full speed).
   */
  getThrottle(campaign: Campaign): number {
    // Hard stop: budget exhausted
    if (campaign.budget.spent >= campaign.budget.total) return 0;
    if (campaign.budget.spentToday >= campaign.budget.daily) return 0;

    // Calculate daily budget utilization
    const dailyUtilization = campaign.budget.spentToday / campaign.budget.daily;

    // Calculate what fraction of the day has passed (assume 24h campaign)
    const now = new Date();
    const hourFraction = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);

    // If we're ahead of pace, throttle down
    if (hourFraction > 0 && dailyUtilization > hourFraction) {
      const overpace = dailyUtilization / hourFraction;
      return Math.max(0.1, 1 / overpace);
    }

    // If we're behind pace, allow full speed (or slightly boost)
    const totalUtilization = campaign.budget.spent / campaign.budget.total;
    if (totalUtilization > 0.9) {
      // Near total budget limit, slow down
      return 0.3;
    }

    return 1.0;
  }

  /**
   * Rate limiting — don't send too many bids per second.
   */
  checkRateLimit(maxBidsPerSecond = 100): boolean {
    const now = Math.floor(Date.now() / 1000);
    if (now !== this.lastSecondTimestamp) {
      this.lastSecondTimestamp = now;
      this.bidCountThisSecond = 0;
    }
    this.bidCountThisSecond++;
    return this.bidCountThisSecond <= maxBidsPerSecond;
  }

  reset(): void {
    this.bidCountThisSecond = 0;
    this.lastSecondTimestamp = 0;
  }
}
```

- [ ] **Step 5: Create bid engine orchestrator**

`packages/backend/src/engine/bid-engine.ts`:
```ts
import { v4 as uuid } from 'uuid';
import type { BidRequest, BidResponse, Campaign, BidLog, Impression } from '@atrium/shared';
import { BidDecision, BidOutcome, BID_ENGINE_DEFAULTS } from '@atrium/shared';
import { filterBidRequest } from './bid-filter.js';
import { WinScorer } from './win-scorer.js';
import { BidPricer } from './bid-pricer.js';
import { BudgetPacer } from './budget-pacer.js';

export interface BidEngineResult {
  response: BidResponse | null; // null = no bid
  logs: BidLog[];
}

export class BidEngine {
  private scorer = new WinScorer();
  private pricer = new BidPricer();
  private pacer = new BudgetPacer();

  /**
   * Process a bid request against all active campaigns.
   * Returns the best bid (if any) and logs for all evaluations.
   */
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
          crid: bestBid.campaignId,
        }],
      }],
    };

    return { response, logs };
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
    // Probabilistic throttle — skip some bids when throttled
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

  /**
   * Record auction outcome to update models.
   */
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
```

- [ ] **Step 6: Commit**

```bash
git add packages/backend/src/engine/
git commit -m "feat: add bid engine with filtering, scoring, pricing, and pacing"
```

---

## Task 5: Backend — Reseller Adapters

**Files:**
- Create: `packages/backend/src/adapters/base-adapter.ts`
- Create: `packages/backend/src/adapters/kueez-adapter.ts`
- Create: `packages/backend/src/adapters/rise-adapter.ts`

- [ ] **Step 1: Create base adapter interface**

`packages/backend/src/adapters/base-adapter.ts`:
```ts
import type { BidRequest, BidResponse } from '@atrium/shared';

export interface ResellerAdapter {
  readonly id: string;
  readonly name: string;

  /** Submit a bid response to this reseller */
  submitBid(request: BidRequest, response: BidResponse): Promise<BidSubmitResult>;

  /** Health check */
  ping(): Promise<boolean>;
}

export interface BidSubmitResult {
  accepted: boolean;
  clearingPrice?: number;
  won?: boolean;
  error?: string;
}
```

- [ ] **Step 2: Create Kueez adapter**

`packages/backend/src/adapters/kueez-adapter.ts`:
```ts
import type { BidRequest, BidResponse } from '@atrium/shared';
import type { ResellerAdapter, BidSubmitResult } from './base-adapter.js';

/**
 * KueezRTB adapter.
 * In production: integrates with KueezRTB's Prebid/server-to-server endpoint.
 * Prototype: simulates responses based on realistic parameters.
 */
export class KueezAdapter implements ResellerAdapter {
  readonly id = 'kueez';
  readonly name = 'KueezRTB';

  async submitBid(request: BidRequest, response: BidResponse): Promise<BidSubmitResult> {
    // In production, this would POST to KueezRTB's endpoint
    // For prototype, we simulate the response in the auction simulator
    return {
      accepted: true,
      won: false,
    };
  }

  async ping(): Promise<boolean> {
    // In production: hit health endpoint at sync.kueezrtb.com
    return true;
  }
}
```

- [ ] **Step 3: Create Rise Codes adapter**

`packages/backend/src/adapters/rise-adapter.ts`:
```ts
import type { BidRequest, BidResponse } from '@atrium/shared';
import type { ResellerAdapter, BidSubmitResult } from './base-adapter.js';

/**
 * Rise Codes adapter.
 * In production: integrates with Rise's S2S endpoint at s2s.yellowblue.io/rtb.
 * Prototype: simulates responses based on realistic parameters.
 */
export class RiseAdapter implements ResellerAdapter {
  readonly id = 'rise';
  readonly name = 'Rise Codes';

  async submitBid(request: BidRequest, response: BidResponse): Promise<BidSubmitResult> {
    // In production, this would POST to s2s.yellowblue.io/rtb
    // with publisher_id provided by account manager
    return {
      accepted: true,
      won: false,
    };
  }

  async ping(): Promise<boolean> {
    // In production: hit health endpoint at Rise's API
    return true;
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add packages/backend/src/adapters/
git commit -m "feat: add reseller adapter layer for KueezRTB and Rise Codes"
```

---

## Task 6: Backend — Auction Simulator

**Files:**
- Create: `packages/backend/src/simulator/inventory-generator.ts`
- Create: `packages/backend/src/simulator/competitor-model.ts`
- Create: `packages/backend/src/simulator/auction-simulator.ts`
- Create: `packages/backend/src/services/bid-logger.ts`
- Create: `packages/backend/src/services/analytics-service.ts`
- Create: `packages/backend/src/routes/analytics.ts`
- Create: `packages/backend/src/routes/simulator.ts`

- [ ] **Step 1: Create inventory generator**

`packages/backend/src/simulator/inventory-generator.ts`:
```ts
import { v4 as uuid } from 'uuid';
import type { BidRequest, ResellerConfig } from '@atrium/shared';
import { VIDEO_MIMES, VAST_PROTOCOLS, IAB_CATEGORIES, DEVICE_TYPES, GEO_COUNTRIES } from '@atrium/shared';

const DOMAINS = [
  'gaming-news.com', 'sport-clips.tv', 'tech-daily.io', 'travel-vids.com',
  'music-stream.fm', 'quiz-world.net', 'news-hub.org', 'entertainment.buzz',
  'mobile-games.app', 'fitness-zone.com',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * stdDev;
}

export function generateBidRequest(reseller: ResellerConfig): BidRequest {
  const floor = Math.max(0.1, gaussianRandom(reseller.avgFloorPrice, reseller.floorPriceVariance));

  return {
    id: uuid(),
    imp: [{
      id: uuid(),
      video: {
        mimes: [...VIDEO_MIMES],
        protocols: [VAST_PROTOCOLS.VAST_3_0, VAST_PROTOCOLS.VAST_4_0],
        minduration: 5,
        maxduration: pick([15, 30, 60]),
        w: pick([640, 1280, 1920]),
        h: pick([360, 720, 1080]),
        linearity: 1,
        playbackmethod: [pick([1, 2, 3])],
        startdelay: pick([0, -1, 15]),
      },
      bidfloor: Math.round(floor * 100) / 100,
      bidfloorcur: 'USD',
    }],
    site: {
      id: uuid(),
      domain: pick(DOMAINS),
      cat: [pick(reseller.categories)],
      publisher: {
        id: reseller.id,
        name: reseller.name,
      },
    },
    device: {
      devicetype: pick([DEVICE_TYPES.MOBILE, DEVICE_TYPES.PC, DEVICE_TYPES.TABLET, DEVICE_TYPES.CTV]),
      geo: {
        country: pick(reseller.geos),
      },
      os: pick(['iOS', 'Android', 'Windows', 'macOS']),
      language: 'en',
    },
    at: 1, // first-price auction
    tmax: 200,
    cur: ['USD'],
  };
}
```

- [ ] **Step 2: Create competitor model**

`packages/backend/src/simulator/competitor-model.ts`:
```ts
/**
 * Simulates competing DSP bids in the auction.
 * Each competitor has a strategy profile.
 */
export interface CompetitorBid {
  bidderId: string;
  price: number;
}

export function generateCompetitorBids(
  floorPrice: number,
  competitorCount: number,
  aggressiveness: number,
): CompetitorBid[] {
  const bids: CompetitorBid[] = [];

  for (let i = 0; i < competitorCount; i++) {
    // Not all competitors bid on every impression
    if (Math.random() > 0.6) continue; // 40% chance each competitor bids

    // Competitor bid ranges from floor to floor * multiplier
    const multiplier = 1 + (Math.random() * 2 * aggressiveness);
    const noise = (Math.random() - 0.5) * 0.5;
    const price = floorPrice * (multiplier + noise);

    if (price >= floorPrice) {
      bids.push({
        bidderId: `competitor-${i}`,
        price: Math.round(price * 100) / 100,
      });
    }
  }

  return bids;
}

/**
 * Determine auction winner given our bid and competitor bids.
 * First-price auction: highest bid wins, pays their bid price.
 */
export function resolveAuction(
  ourBidPrice: number,
  competitorBids: CompetitorBid[],
): { won: boolean; clearingPrice: number; winningBidder: string } {
  const allBids = [
    { bidderId: 'atrium', price: ourBidPrice },
    ...competitorBids,
  ];

  allBids.sort((a, b) => b.price - a.price);
  const winner = allBids[0];

  return {
    won: winner.bidderId === 'atrium',
    clearingPrice: winner.price,
    winningBidder: winner.bidderId,
  };
}
```

- [ ] **Step 3: Create bid logger**

`packages/backend/src/services/bid-logger.ts`:
```ts
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

    const insertMany = db.transaction((entries: BidLog[]) => {
      for (const e of entries) {
        stmt.run(e.id, e.timestamp, e.campaignId, e.reseller, e.impressionId, e.bidRequestId, e.decision, e.bidAmount ?? null, e.floorPrice ?? null, e.winProbability ?? null, e.outcome ?? null, e.clearingPrice ?? null, e.filterReason ?? null);
      }
    });

    insertMany(entries);
  }

  getRecent(limit = 50): BidLog[] {
    const db = getDb();
    return db.prepare('SELECT * FROM bid_logs ORDER BY timestamp DESC LIMIT ?').all(limit) as BidLog[];
  }
}
```

- [ ] **Step 4: Create analytics service**

`packages/backend/src/services/analytics-service.ts`:
```ts
import { getDb } from '../db/client.js';
import type { AuctionMetrics } from '@atrium/shared';

export class AnalyticsService {
  getMetrics(): AuctionMetrics {
    const db = getDb();

    const totals = db.prepare(`
      SELECT
        COUNT(*) as total_requests,
        SUM(CASE WHEN decision = 'bid' THEN 1 ELSE 0 END) as total_bids,
        SUM(CASE WHEN outcome = 'win' THEN 1 ELSE 0 END) as total_wins,
        SUM(CASE WHEN outcome = 'loss' THEN 1 ELSE 0 END) as total_losses,
        SUM(CASE WHEN decision = 'no_bid' THEN 1 ELSE 0 END) as total_no_bids,
        AVG(CASE WHEN decision = 'bid' THEN bid_amount END) as avg_bid_price,
        AVG(CASE WHEN outcome = 'win' THEN clearing_price END) as avg_clearing_price,
        SUM(CASE WHEN outcome = 'win' THEN clearing_price ELSE 0 END) as total_spend
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
      avgCpm: totalWins > 0 ? (totals.total_spend / totalWins) : 0,
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
          SUM(CASE WHEN outcome = 'win' THEN clearing_price ELSE 0 END) as total_spend
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
        avgCpm: totalWins > 0 ? (totals.total_spend / totalWins) : 0,
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
```

- [ ] **Step 5: Create auction simulator**

`packages/backend/src/simulator/auction-simulator.ts`:
```ts
import { EventEmitter } from 'events';
import type { BidRequest, SimulatorConfig, SimulatorState, BidLog, ResellerConfig } from '@atrium/shared';
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

    // Pick a reseller based on weight
    const reseller = this.pickReseller();
    const bidRequest = generateBidRequest(reseller);

    this.totalRequests++;

    // Run through bid engine
    const result = this.engine.processBidRequest(bidRequest, campaigns, reseller.id);

    // If we bid, simulate the auction
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
        // Update campaign spend
        const campaignId = result.response.seatbid[0].bid[0].crid!;
        this.campaignService.updateSpend(campaignId, auction.clearingPrice / 1000); // CPM to per-impression
      }
    }

    // Log all evaluations
    this.bidLogger.logBatch(result.logs);

    // Emit events for real-time updates
    for (const log of result.logs) {
      this.emit('bid_result', log);
    }

    // Emit metrics periodically (every 10 requests)
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
```

- [ ] **Step 6: Create routes**

`packages/backend/src/routes/analytics.ts`:
```ts
import { FastifyInstance } from 'fastify';
import { AnalyticsService } from '../services/analytics-service.js';
import { BidLogger } from '../services/bid-logger.js';

const analyticsService = new AnalyticsService();
const bidLogger = new BidLogger();

export async function analyticsRoutes(app: FastifyInstance): Promise<void> {
  app.get('/api/analytics/metrics', async () => {
    return analyticsService.getMetrics();
  });

  app.get('/api/analytics/by-reseller', async () => {
    return analyticsService.getMetricsByReseller();
  });

  app.get('/api/analytics/recent-bids', async (req) => {
    const { limit } = req.query as { limit?: string };
    return bidLogger.getRecent(limit ? parseInt(limit) : 50);
  });
}
```

`packages/backend/src/routes/simulator.ts`:
```ts
import { FastifyInstance } from 'fastify';
import { AuctionSimulator } from '../simulator/auction-simulator.js';

export function createSimulatorRoutes(simulator: AuctionSimulator) {
  return async function simulatorRoutes(app: FastifyInstance): Promise<void> {
    app.post('/api/simulator/start', async (req) => {
      const config = req.body as any;
      simulator.start(config);
      return simulator.getState();
    });

    app.post('/api/simulator/stop', async () => {
      simulator.stop();
      return simulator.getState();
    });

    app.post('/api/simulator/reset', async () => {
      simulator.reset();
      return simulator.getState();
    });

    app.get('/api/simulator/state', async () => {
      return simulator.getState();
    });
  };
}
```

- [ ] **Step 7: Commit**

```bash
git add packages/backend/src/simulator/ packages/backend/src/services/ packages/backend/src/routes/analytics.ts packages/backend/src/routes/simulator.ts
git commit -m "feat: add auction simulator with inventory generation, competitor model, and analytics"
```

---

## Task 7: Backend — WebSocket + Server Bootstrap

**Files:**
- Create: `packages/backend/src/ws/socket-server.ts`
- Create: `packages/backend/src/index.ts`

- [ ] **Step 1: Create WebSocket server**

`packages/backend/src/ws/socket-server.ts`:
```ts
import { Server as HttpServer } from 'http';
import { Server as SocketServer } from 'socket.io';
import { AuctionSimulator } from '../simulator/auction-simulator.js';

export function setupSocketServer(httpServer: HttpServer, simulator: AuctionSimulator): SocketServer {
  const io = new SocketServer(httpServer, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
    },
  });

  // Forward simulator events to all connected clients
  simulator.on('bid_result', (data) => {
    io.emit('bid_result', data);
  });

  simulator.on('metrics', (data) => {
    io.emit('metrics_update', data);
  });

  simulator.on('state', (data) => {
    io.emit('simulator_state', data);
  });

  io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Send current state on connect
    socket.emit('simulator_state', simulator.getState());

    socket.on('disconnect', () => {
      console.log(`Client disconnected: ${socket.id}`);
    });
  });

  return io;
}
```

- [ ] **Step 2: Create server bootstrap**

`packages/backend/src/index.ts`:
```ts
import Fastify from 'fastify';
import cors from '@fastify/cors';
import { createServer } from 'http';
import { campaignRoutes } from './routes/campaigns.js';
import { analyticsRoutes } from './routes/analytics.js';
import { createSimulatorRoutes } from './routes/simulator.js';
import { AuctionSimulator } from './simulator/auction-simulator.js';
import { setupSocketServer } from './ws/socket-server.js';

const PORT = parseInt(process.env.PORT ?? '3001');

async function main() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });

  // Create shared simulator instance
  const simulator = new AuctionSimulator();

  // Register routes
  await app.register(campaignRoutes);
  await app.register(analyticsRoutes);
  await app.register(createSimulatorRoutes(simulator));

  // Start HTTP server
  await app.listen({ port: PORT, host: '0.0.0.0' });

  // Attach Socket.IO to the underlying HTTP server
  const httpServer = (app.server as any) as import('http').Server;
  setupSocketServer(httpServer, simulator);

  console.log(`Atrium backend running on http://localhost:${PORT}`);
  console.log('WebSocket server attached');
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
```

- [ ] **Step 3: Verify backend starts**

```bash
cd /root/code/atrium && pnpm --filter @atrium/backend dev
# Expected: Server starts on port 3001, no errors
# Ctrl+C to stop
```

- [ ] **Step 4: Commit**

```bash
git add packages/backend/src/ws/ packages/backend/src/index.ts
git commit -m "feat: add WebSocket server and Fastify bootstrap with all routes"
```

---

## Task 8: Frontend — Core Setup + Layout

**Files:**
- Create: `packages/frontend/src/main.tsx`
- Create: `packages/frontend/src/index.css`
- Create: `packages/frontend/src/App.tsx`
- Create: `packages/frontend/src/hooks/useSocket.ts`
- Create: `packages/frontend/src/hooks/useApi.ts`
- Create: `packages/frontend/src/stores/auction-store.ts`
- Create: `packages/frontend/src/components/layout/Sidebar.tsx`
- Create: `packages/frontend/src/components/layout/Header.tsx`

*Note: The frontend-design skill will be used to create the actual component implementations with professional, unique styling. The plan here defines the component structure and interfaces.*

- [ ] **Step 1: Create entry point + global styles**

`packages/frontend/src/main.tsx`:
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
```

`packages/frontend/src/index.css`:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-gray-950 text-white antialiased;
    font-family: 'Inter', system-ui, sans-serif;
  }
}
```

- [ ] **Step 2: Create hooks**

`packages/frontend/src/hooks/useSocket.ts`:
```ts
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuctionStore } from '../stores/auction-store';

export function useSocket() {
  const socketRef = useRef<Socket | null>(null);
  const { addBidResult, setMetrics, setSimulatorState } = useAuctionStore();

  useEffect(() => {
    const socket = io('/', { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('bid_result', (data) => addBidResult(data));
    socket.on('metrics_update', (data) => setMetrics(data));
    socket.on('simulator_state', (data) => setSimulatorState(data));

    return () => {
      socket.disconnect();
    };
  }, [addBidResult, setMetrics, setSimulatorState]);

  return socketRef.current;
}
```

`packages/frontend/src/hooks/useApi.ts`:
```ts
import { useState, useCallback } from 'react';

const BASE_URL = '/api';

export function useApi() {
  const [loading, setLoading] = useState(false);

  const request = useCallback(async <T>(path: string, options?: RequestInit): Promise<T> => {
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
      });
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      return await res.json();
    } finally {
      setLoading(false);
    }
  }, []);

  const get = useCallback(<T>(path: string) => request<T>(path), [request]);

  const post = useCallback(<T>(path: string, body?: any) =>
    request<T>(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }), [request]);

  const patch = useCallback(<T>(path: string, body?: any) =>
    request<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }), [request]);

  const del = useCallback(<T>(path: string) =>
    request<T>(path, { method: 'DELETE' }), [request]);

  return { get, post, patch, del, loading };
}
```

- [ ] **Step 3: Create Zustand store**

`packages/frontend/src/stores/auction-store.ts`:
```ts
import { create } from 'zustand';
import type { AuctionMetrics, BidLog, SimulatorState } from '@atrium/shared';

interface AuctionStore {
  metrics: AuctionMetrics | null;
  recentBids: BidLog[];
  simulatorState: SimulatorState | null;
  maxRecentBids: number;

  setMetrics: (metrics: AuctionMetrics) => void;
  addBidResult: (bid: BidLog) => void;
  setSimulatorState: (state: SimulatorState) => void;
  clearBids: () => void;
}

export const useAuctionStore = create<AuctionStore>((set) => ({
  metrics: null,
  recentBids: [],
  simulatorState: null,
  maxRecentBids: 200,

  setMetrics: (metrics) => set({ metrics }),

  addBidResult: (bid) =>
    set((state) => ({
      recentBids: [bid, ...state.recentBids].slice(0, state.maxRecentBids),
    })),

  setSimulatorState: (simulatorState) => set({ simulatorState }),

  clearBids: () => set({ recentBids: [], metrics: null }),
}));
```

- [ ] **Step 4: Create layout and App shell**

These files (App.tsx, Sidebar.tsx, Header.tsx) will be created using the **frontend-design** skill for professional styling. The plan defines the structure:

- `App.tsx`: React Router with sidebar layout, routes for Dashboard, Campaigns, AuctionLive
- `Sidebar.tsx`: Navigation sidebar with Atrium branding, nav links, simulator status indicator
- `Header.tsx`: Page header with breadcrumb + current metrics summary

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/
git commit -m "feat: add frontend core setup with hooks, store, and layout shell"
```

---

## Task 9: Frontend — Dashboard, Campaigns, Auction Live Pages

**Files:**
- Create: `packages/frontend/src/pages/Dashboard.tsx`
- Create: `packages/frontend/src/pages/Campaigns.tsx`
- Create: `packages/frontend/src/pages/AuctionLive.tsx`
- Create: `packages/frontend/src/components/metrics/MetricCard.tsx`
- Create: `packages/frontend/src/components/metrics/WinRateGauge.tsx`
- Create: `packages/frontend/src/components/metrics/SpendChart.tsx`
- Create: `packages/frontend/src/components/auction/BidFeed.tsx`
- Create: `packages/frontend/src/components/auction/SimulatorControls.tsx`
- Create: `packages/frontend/src/components/auction/AuctionStats.tsx`
- Create: `packages/frontend/src/components/campaigns/CampaignForm.tsx`
- Create: `packages/frontend/src/components/campaigns/CampaignCard.tsx`

*All created using the frontend-design skill for professional, unique design.*

- [ ] **Step 1: Create metric components**

- `MetricCard.tsx`: Animated number display with label, trend arrow, sparkline
- `WinRateGauge.tsx`: Circular gauge showing win rate percentage with animated fill
- `SpendChart.tsx`: Real-time line chart of spend over time (Recharts)

- [ ] **Step 2: Create auction components**

- `BidFeed.tsx`: Scrolling feed of recent bids with win/loss color coding, auto-scroll
- `SimulatorControls.tsx`: Start/Stop/Reset buttons with config sliders (RPS, aggressiveness)
- `AuctionStats.tsx`: Real-time stats panel (bids/sec, total processed, elapsed time)

- [ ] **Step 3: Create campaign components**

- `CampaignForm.tsx`: Multi-step form for campaign creation (name, budget, targeting, creative)
- `CampaignCard.tsx`: Campaign summary card with status badge, budget progress, actions

- [ ] **Step 4: Create pages**

- `Dashboard.tsx`: Grid of MetricCards + WinRateGauge + SpendChart + recent activity
- `Campaigns.tsx`: Campaign list + create button + CampaignForm modal
- `AuctionLive.tsx`: SimulatorControls + BidFeed + AuctionStats side-by-side

- [ ] **Step 5: Commit**

```bash
git add packages/frontend/src/
git commit -m "feat: add dashboard, campaign management, and live auction pages"
```

---

## Task 10: Architecture Documentation

**Files:**
- Create: `docs/architecture.md`

- [ ] **Step 1: Write architecture document**

The document should cover:

1. **Executive Summary** — What Atrium is, what this system does
2. **System Architecture** — High-level diagram, component overview
3. **Bid Engine Design** — The 4-layer pipeline (filter → score → price → pace), why each layer exists
4. **Reseller Integration** — OpenRTB 2.6 protocol, adapter pattern, Kueez + Rise specifics
5. **Win Rate Optimization Strategy** — Bid shading, win probability model, feedback loop
6. **Data Model** — Campaign, bid log, analytics schemas
7. **Real-Time Pipeline** — WebSocket streaming, event-driven updates
8. **Technology Choices** — Why TypeScript, Fastify, SQLite, etc.
9. **Production Roadmap** — What changes for production (ML model, real reseller APIs, Redis, etc.)
10. **API Reference** — Endpoint documentation

- [ ] **Step 2: Commit**

```bash
git add docs/
git commit -m "docs: add architecture document for Atrium auction platform"
```

---

## Task 11: Integration Test + Final Polish

- [ ] **Step 1: Verify full stack starts**

```bash
# Terminal 1
pnpm --filter @atrium/backend dev
# Terminal 2
pnpm --filter @atrium/frontend dev
```

- [ ] **Step 2: End-to-end smoke test**

1. Open frontend at http://localhost:5173
2. Create a campaign with targeting
3. Activate the campaign
4. Start the auction simulator
5. Observe real-time bid feed and metrics
6. Verify win rate is displayed and updating
7. Stop simulator, check analytics
8. Reset simulator, verify clean state

- [ ] **Step 3: Fix any issues found during testing**

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete Atrium auction platform prototype with full-stack integration"
```
