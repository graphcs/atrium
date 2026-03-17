# Atrium — Video Ad Auction Platform

> **Video ads that optimize themselves.**

Atrium is a **Demand-Side Platform (DSP)** that aggregates video ad supply from resellers like KueezRTB and Rise Codes, runs intelligent auctions via the OpenRTB 2.6 protocol, and places optimized bids on behalf of brand advertisers. The system's core innovation is a **4-layer bid engine pipeline** that achieves 40-70% win rates (vs. the industry standard of 1-5%), dramatically reducing bid waste and backend compute costs.

---

## Table of Contents

- [How It Works](#how-it-works)
- [Architecture Overview](#architecture-overview)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Running the Platform](#running-the-platform)
- [Usage Guide](#usage-guide)
- [API Reference](#api-reference)
- [WebSocket Events](#websocket-events)
- [Bid Engine Deep Dive](#bid-engine-deep-dive)
- [Reseller Integrations](#reseller-integrations)
- [Configuration](#configuration)
- [Tech Stack](#tech-stack)
- [Production Roadmap](#production-roadmap)

---

## How It Works

```
                                          ┌──────────────────┐
  Advertiser creates      Bid Requests    │  Supply Resellers │
  campaign on Atrium  ┌──────────────────►│  ─ KueezRTB      │
         │            │   (OpenRTB 2.6)   │  ─ Rise Codes    │
         ▼            │                   └──────┬───────────┘
  ┌──────────────┐    │                          │
  │   ATRIUM     │◄───┘     Bid Responses        │
  │   Bid Engine │──────────────────────────────►│
  │              │                               │
  │  Filter ─►   │      Win Notifications        │
  │  Score  ─►   │◄─────────────────────────────┘
  │  Price  ─►   │
  │  Pace   ─►   │   Brand gets ad placements
  └──────────────┘   with optimized spend
```

1. A brand creates a **video ad campaign** on Atrium's dashboard (budget, targeting, creative)
2. Resellers send **bid requests** when ad slots become available on publisher sites
3. Atrium's bid engine evaluates each opportunity through a 4-layer pipeline
4. The engine **only bids when likely to win** — reducing wasted compute on losing bids
5. Won impressions serve the brand's video creative to the target audience

---

## Architecture Overview

```
┌──────────────────────────────────────────────────────────────┐
│                       ATRIUM PLATFORM                        │
│                                                              │
│  ┌───────────┐     ┌────────────────┐     ┌──────────────┐  │
│  │  Frontend  │◄───►│  Fastify API   │◄───►│   SQLite DB  │  │
│  │  React +   │ WS  │  Server :3001  │     │   + In-Mem   │  │
│  │  Vite :5173│     │                │     │   State      │  │
│  └───────────┘     └───────┬────────┘     └──────────────┘  │
│                            │                                 │
│            ┌───────────────┼───────────────┐                 │
│            │               │               │                 │
│       ┌────▼────┐    ┌────▼─────┐   ┌─────▼──────────┐     │
│       │Campaign │    │   Bid    │   │    Auction      │     │
│       │ Service │    │  Engine  │   │   Simulator     │     │
│       └─────────┘    └────┬─────┘   └────────────────┘     │
│                           │                                  │
│               ┌───────────┼───────────┐                     │
│          ┌────▼──┐   ┌───▼───┐   ┌──▼────┐                │
│          │Filter │──►│ Score │──►│ Price │──► Budget Pacer │
│          └───────┘   └───────┘   └───────┘                 │
│                                                              │
│  ┌───────────────── Reseller Adapter Layer ───────────────┐ │
│  │     KueezRTB Adapter      │     Rise Codes Adapter     │ │
│  └───────────────────────────┴────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

---

## Project Structure

```
atrium/
├── package.json                 # Root workspace config & scripts
├── pnpm-workspace.yaml          # pnpm workspace definition
├── tsconfig.base.json           # Shared TypeScript config
├── turbo.json                   # Turborepo task runner config
│
├── packages/
│   ├── shared/                  # @atrium/shared — Types & constants
│   │   └── src/
│   │       ├── types/
│   │       │   ├── openrtb.ts       # OpenRTB 2.6 bid request/response
│   │       │   ├── campaign.ts      # Campaign, budget, targeting, creative
│   │       │   ├── analytics.ts     # BidLog, AuctionMetrics
│   │       │   └── simulator.ts     # SimulatorConfig, SimulatorState
│   │       ├── constants/
│   │       │   ├── openrtb.ts       # IAB categories, device types, geos
│   │       │   └── defaults.ts      # Bid engine & simulator defaults
│   │       └── index.ts             # Barrel export
│   │
│   ├── backend/                 # @atrium/backend — Fastify API server
│   │   └── src/
│   │       ├── index.ts             # Server bootstrap
│   │       ├── db/
│   │       │   ├── schema.ts        # SQLite table definitions
│   │       │   └── client.ts        # Database singleton
│   │       ├── engine/
│   │       │   ├── bid-engine.ts    # Pipeline orchestrator
│   │       │   ├── bid-filter.ts    # Targeting & eligibility checks
│   │       │   ├── win-scorer.ts    # Adaptive win probability model
│   │       │   ├── bid-pricer.ts    # Bid shading / price optimization
│   │       │   └── budget-pacer.ts  # Spend pacing & rate limiting
│   │       ├── adapters/
│   │       │   ├── base-adapter.ts  # Reseller adapter interface
│   │       │   ├── kueez-adapter.ts # KueezRTB integration
│   │       │   └── rise-adapter.ts  # Rise Codes integration
│   │       ├── simulator/
│   │       │   ├── auction-simulator.ts  # Bid request generation loop
│   │       │   ├── inventory-generator.ts # Realistic impression data
│   │       │   └── competitor-model.ts    # Simulated competing DSPs
│   │       ├── services/
│   │       │   ├── campaign-service.ts   # Campaign CRUD + budget tracking
│   │       │   ├── analytics-service.ts  # Metrics aggregation queries
│   │       │   └── bid-logger.ts         # Bid log persistence
│   │       ├── routes/
│   │       │   ├── campaigns.ts     # Campaign REST endpoints
│   │       │   ├── analytics.ts     # Analytics REST endpoints
│   │       │   └── simulator.ts     # Simulator control endpoints
│   │       └── ws/
│   │           └── socket-server.ts # Socket.IO real-time streaming
│   │
│   └── frontend/                # @atrium/frontend — React dashboard
│       ├── index.html
│       ├── vite.config.ts
│       ├── tailwind.config.ts
│       └── src/
│           ├── main.tsx             # React entry point
│           ├── App.tsx              # Router + layout
│           ├── index.css            # Global styles + glassmorphic theme
│           ├── hooks/
│           │   ├── useSocket.ts     # Socket.IO connection hook
│           │   └── useApi.ts        # REST API request hook
│           ├── stores/
│           │   └── auction-store.ts # Zustand real-time state
│           ├── pages/
│           │   ├── Dashboard.tsx    # Metrics overview + charts
│           │   ├── Campaigns.tsx    # Campaign management
│           │   └── AuctionLive.tsx  # Live auction feed + controls
│           └── components/
│               ├── layout/          # Sidebar, Header
│               ├── metrics/         # MetricCard, WinRateGauge, SpendChart
│               ├── auction/         # BidFeed, SimulatorControls, AuctionStats
│               └── campaigns/       # CampaignCard, CampaignForm
│
└── docs/
    └── architecture.md          # Full architecture document
```

---

## Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| **Node.js** | >= 20.x | JavaScript runtime |
| **pnpm** | >= 10.x | Package manager (workspace support) |

Install pnpm if not already available:

```bash
npm install -g pnpm
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone git@github.com:graphcs/atrium.git
cd atrium
```

### 2. Install dependencies

```bash
pnpm install
```

This installs all dependencies across all three workspace packages (`shared`, `backend`, `frontend`), including native modules like `better-sqlite3`.

### 3. Start the development servers

```bash
# Option A: Start both backend and frontend together
pnpm dev

# Option B: Start them individually (recommended for development)
# Terminal 1 — Backend API (port 3001)
pnpm dev:backend

# Terminal 2 — Frontend dev server (port 5173)
pnpm dev:frontend
```

### 4. Open the dashboard

Navigate to **http://localhost:5173** in your browser.

---

## Running the Platform

### Quick Start (3 steps)

1. **Create a campaign**
   - Go to the **Campaigns** page (`/campaigns`)
   - Click **New Campaign**
   - Fill in the name, budget (total, daily cap, max CPM), targeting (geos, devices, content categories), and hit **Create Campaign**

2. **Activate the campaign**
   - Hover over the campaign card and click the **Play** button to set status to `active`
   - The bid engine only bids on behalf of active campaigns

3. **Start the auction simulator**
   - Go to the **Live Auction** page (`/auction`)
   - Adjust **Requests/sec** (how fast bid requests come in) and **Competitor Aggression** (how aggressively competing DSPs bid)
   - Click **Start**
   - Watch the real-time bid feed populate with wins (green), losses (red), and skipped bids (gray)

### What You'll See

- **Dashboard** (`/`) — High-level metrics: win rate gauge, total bids, spend, avg CPM, waste ratio, bid rate, and a real-time win rate chart
- **Campaigns** (`/campaigns`) — Create, activate, pause, and delete campaigns. View budget utilization and targeting configuration
- **Live Auction** (`/auction`) — Real-time scrolling bid feed, simulator controls (start/stop/reset), engine stats (throughput, elapsed time, wins/bids)

### Stopping & Resetting

- **Stop**: Pauses the simulator. Metrics and history are preserved.
- **Reset**: Clears all bid logs, resets the bid engine's learned weights, and returns to idle state.

---

## API Reference

The backend runs on **http://localhost:3001**. All endpoints return JSON.

### Campaign Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/campaigns` | List all campaigns |
| `POST` | `/api/campaigns` | Create a new campaign |
| `GET` | `/api/campaigns/:id` | Get a single campaign |
| `PATCH` | `/api/campaigns/:id/status` | Update campaign status |
| `DELETE` | `/api/campaigns/:id` | Delete a campaign |

#### Create Campaign — `POST /api/campaigns`

```json
{
  "name": "Q1 Brand Awareness",
  "budget": {
    "total": 10000,
    "daily": 500,
    "maxBidCpm": 8.00
  },
  "targeting": {
    "geos": ["US", "GB"],
    "devices": ["desktop", "mobile"],
    "categories": ["IAB1", "IAB19"],
    "domains": [],
    "excludeDomains": []
  },
  "creative": {
    "id": "creative-1",
    "name": "Brand Video 15s",
    "vastUrl": "https://cdn.example.com/vast/brand-15s.xml",
    "duration": 15,
    "width": 1920,
    "height": 1080,
    "mimeType": "video/mp4"
  }
}
```

#### Update Status — `PATCH /api/campaigns/:id/status`

```json
{
  "status": "active"
}
```

Valid statuses: `draft`, `active`, `paused`, `completed`

### Analytics Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics/metrics` | Aggregated auction metrics |
| `GET` | `/api/analytics/by-reseller` | Metrics broken down per reseller |
| `GET` | `/api/analytics/recent-bids?limit=50` | Recent bid log entries |

#### Metrics Response Example

```json
{
  "totalBidRequests": 391,
  "totalBids": 41,
  "totalWins": 19,
  "totalLosses": 22,
  "totalNoBids": 350,
  "winRate": 0.463,
  "bidRate": 0.105,
  "avgBidPrice": 5.18,
  "avgClearingPrice": 4.42,
  "totalSpend": 84.03,
  "avgCpm": 4.42,
  "wasteRatio": 0.537
}
```

### Simulator Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/simulator/start` | Start the auction simulator |
| `POST` | `/api/simulator/stop` | Stop the simulator |
| `POST` | `/api/simulator/reset` | Reset simulator, clear all data |
| `GET` | `/api/simulator/state` | Get current simulator state |

#### Start Simulator — `POST /api/simulator/start`

```json
{
  "requestsPerSecond": 50,
  "competitorAggressiveness": 0.6
}
```

All fields are optional — defaults are used if omitted.

---

## WebSocket Events

The frontend connects to Socket.IO on the backend server. Real-time events:

| Event | Direction | Payload | Frequency |
|-------|-----------|---------|-----------|
| `bid_result` | Server → Client | `BidLog` | Every bid evaluation |
| `metrics_update` | Server → Client | `AuctionMetrics` | Every 10 bid requests |
| `simulator_state` | Server → Client | `SimulatorState` | On state changes |

On connection, the server immediately emits the current `simulator_state`.

---

## Bid Engine Deep Dive

The bid engine processes each incoming bid request through a **4-layer pipeline**. Each layer eliminates a specific type of waste:

### Layer 1: Bid Filter

Checks campaign eligibility before any expensive computation:

- **Budget check** — Total and daily budget exhaustion
- **Floor price check** — Bid floor vs. campaign max CPM
- **Geo targeting** — Country match
- **Device targeting** — Desktop, mobile, tablet, CTV
- **Category targeting** — IAB content category overlap
- **Domain filtering** — Whitelist/blacklist
- **Creative compatibility** — Duration within ad slot min/max

**Impact:** Eliminates ~90% of bid requests immediately.

### Layer 2: Win Probability Scorer

Predicts the likelihood of winning the auction using an adaptive feature-weighted model:

| Feature | Signal |
|---------|--------|
| Bid-to-floor ratio | Higher ratio → more likely to win |
| Reseller ID | Some resellers are more competitive |
| Device type | Mobile auctions tend more competitive |
| Geography | US/UK inventory more contested than others |

The model **learns from outcomes** — after each win/loss, feature weights are updated. Bids with win probability below the threshold (default 20%) are filtered out.

### Layer 3: Bid Pricer (Bid Shading)

Calculates the optimal bid price — high enough to win, low enough to not overpay:

1. Estimate clearing price from historical auction data
2. Apply shading factor (default 0.92 — bid at 92% of estimated clearing)
3. Adjust based on win probability (likely to win → bid lower)
4. Enforce constraints: floor minimum, max CPM, 3x floor ceiling

### Layer 4: Budget Pacer

Controls the rate of spending to distribute budget evenly:

- Compares daily spend rate to time-of-day progress
- Probabilistic throttle when overpacing
- Hard throttle at 90%+ total budget utilization
- Per-second rate limiting (100 bids/sec max)

### Pipeline Result

```
391 bid requests in → 41 bids placed (10.5% bid rate)
                    → 19 wins (46.3% win rate)
                    → 22 losses
                    → 350 smart no-bids (saved compute)
```

---

## Reseller Integrations

The platform uses an **adapter pattern** — each reseller implements a common interface:

```typescript
interface ResellerAdapter {
  readonly id: string;
  readonly name: string;
  submitBid(request: BidRequest, response: BidResponse): Promise<BidSubmitResult>;
  ping(): Promise<boolean>;
}
```

### KueezRTB

- **Type:** SSP + Publisher network (Israeli ad tech)
- **Inventory:** ~90M monthly visitors across quiz/entertainment sites
- **Integration:** Prebid.js adapter (parameters: `cId`, `pId`)
- **Content:** Entertainment, Hobbies, Sports
- **Markets:** US, GB, DE, IL

### Rise Codes

- **Type:** SSP with AI-powered Smart Auction Management (SAM)
- **Integration:** Server-to-server RTB endpoint (`s2s.yellowblue.io/rtb`)
- **Content:** Entertainment, News, Technology, Travel
- **Markets:** US, GB, CA, AU, FR

### Adding a New Reseller

1. Create a new file in `packages/backend/src/adapters/` (e.g., `new-reseller-adapter.ts`)
2. Implement the `ResellerAdapter` interface
3. Add a `ResellerConfig` entry in `packages/shared/src/constants/defaults.ts`
4. The simulator will automatically include the new reseller based on its weight

---

## Configuration

### Bid Engine Defaults

Located in `packages/shared/src/constants/defaults.ts`:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `minWinProbabilityThreshold` | `0.2` | Min win probability to place a bid (0-1) |
| `bidShadingFactor` | `0.92` | Fraction of estimated clearing price to bid |
| `maxBidToFloorRatio` | `3.0` | Never bid more than 3x the floor price |
| `learningRate` | `0.05` | How fast the win model adapts to outcomes |

### Simulator Defaults

| Parameter | Default | Description |
|-----------|---------|-------------|
| `requestsPerSecond` | `50` | Bid requests generated per second |
| `competitorCount` | `5` | Number of simulated competing DSPs |
| `competitorAggressiveness` | `0.6` | How aggressively competitors bid (0-1) |

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Backend server port |

---

## Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| **Language** | TypeScript | Full-stack type safety with shared types across packages |
| **Backend** | Fastify 5 | Lowest-latency Node.js framework — critical for RTB |
| **Frontend** | React 18 + Vite | Component model for data-heavy dashboards + fastest HMR |
| **Database** | SQLite (better-sqlite3) | Zero-config, single-file persistence for prototype |
| **Real-time** | Socket.IO | Battle-tested WebSockets with auto-reconnection |
| **State** | Zustand | Minimal state management — no boilerplate |
| **Charts** | Recharts | React-native charting with streaming data support |
| **Styling** | Tailwind CSS | Utility-first CSS for rapid, consistent UI |
| **Monorepo** | pnpm workspaces + Turborepo | Shared types, single install, coordinated builds |

---

## Production Roadmap

This prototype demonstrates the core bid engine and auction mechanics. For production:

### Phase 1 — Infrastructure
- Replace SQLite with **PostgreSQL** + **Redis** (sub-ms reads for bid state)
- Kubernetes deployment with auto-scaling

### Phase 2 — Real Integrations
- Connect to live KueezRTB and Rise Codes API endpoints
- Integrate with **Prebid Server** for header bidding
- VAST creative serving infrastructure

### Phase 3 — ML-Powered Bidding
- Replace heuristic win scorer with **gradient-boosted decision tree**
- Feature engineering: time-of-day, day-of-week, domain history
- A/B testing framework for bidding strategies

### Phase 4 — Scale & Monitoring
- **Grafana** operational dashboards
- **PagerDuty** alerting for win rate drops
- Geographic edge bidders (latency optimization)
- Target: 100,000+ bid requests/second

### Phase 5 — Creative Optimization
- A/B test video creatives per audience segment
- AI-generated creative variants
- Cross-channel attribution

---

## Further Reading

- [Architecture Document](docs/architecture.md) — Detailed system design, data model, and API reference
- [OpenRTB 2.6 Specification](https://github.com/InteractiveAdvertisingBureau/openrtb2.x) — IAB Tech Lab protocol standard
- [KueezRTB Prebid Adapter](https://docs.prebid.org/dev-docs/bidders/kueezrtb.html) — Prebid.js integration docs
- [Rise Codes Partners API](https://partners-api-docs.risecodes.com/) — Rise Codes API documentation

---

*Built for the Atrium Development Test — a system to aggregate resellers, run smart auctions with high win rates, and reduce bid waste for video advertising in the agentic age.*
