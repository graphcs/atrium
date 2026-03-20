# Atrium Video Ad Auction Platform — Architecture Document

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture](#2-system-architecture)
3. [Bid Engine Design](#3-bid-engine-design)
4. [Reseller Integration](#4-reseller-integration)
5. [Win Rate Optimization Strategy](#5-win-rate-optimization-strategy)
6. [Data Model](#6-data-model)
7. [Real-Time Pipeline](#7-real-time-pipeline)
8. [Technology Choices](#8-technology-choices)
9. [Production Roadmap](#9-production-roadmap)
10. [API Reference](#10-api-reference)

---

## 1. Executive Summary

**Atrium** builds video ads that optimize themselves. This document details the architecture for Atrium's **Demand-Side Platform (DSP)** — a system that aggregates video ad supply from resellers (SSPs), runs intelligent auctions, and places bids on behalf of brand advertisers.

### Core Value Proposition

The platform solves two critical problems:

1. **Bid Waste Reduction** — Traditional DSPs bid on everything and win 1-5% of auctions. Every losing bid costs compute. Our system uses a 4-layer bid engine pipeline to only bid when we're likely to win, targeting 40-70% win rates.

2. **Reseller Aggregation** — Instead of brands managing integrations with multiple supply-side platforms, Atrium provides a single interface to access inventory from KueezRTB, Rise Codes, and future resellers.

### How It Works

```
Brand creates campaign → Atrium receives bid opportunities → Bid engine decides
whether to bid & at what price → Wins yield ad placements → Brand gets conversions
```

---

## 2. System Architecture

### High-Level Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      ATRIUM PLATFORM                         │
│                                                              │
│  ┌──────────┐    ┌────────────────┐    ┌──────────────────┐ │
│  │ Frontend  │    │  Fastify API   │    │   SQLite + In-   │ │
│  │  React +  │◄──►│   Server       │◄──►│   Memory State   │ │
│  │   Vite    │ WS │                │    │                  │ │
│  └──────────┘    └───────┬────────┘    └──────────────────┘ │
│                          │                                   │
│              ┌───────────┼───────────┐                       │
│              │           │           │                       │
│         ┌────▼───┐  ┌───▼────┐  ┌──▼──────────┐            │
│         │Campaign│  │  Bid   │  │  Auction     │            │
│         │Service │  │ Engine │  │  Simulator   │            │
│         └────────┘  └───┬────┘  └──────────────┘            │
│                         │                                    │
│              ┌──────────┼──────────┐                        │
│              │          │          │                         │
│         ┌────▼──┐  ┌───▼───┐  ┌──▼────┐                   │
│         │Filter │  │ Score │  │ Price │  ─► Budget Pacer   │
│         └───────┘  └───────┘  └───────┘                    │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Reseller Adapter Layer                    │   │
│  │  ┌──────────────┐        ┌──────────────┐            │   │
│  │  │  KueezRTB    │        │  Rise Codes  │  + Future  │   │
│  │  │  Adapter     │        │  Adapter     │  Adapters  │   │
│  │  └──────┬───────┘        └──────┬───────┘            │   │
│  └─────────┼───────────────────────┼────────────────────┘   │
└────────────┼───────────────────────┼────────────────────────┘
             │                       │
             ▼                       ▼
     ┌───────────────┐      ┌────────────────┐
     │   KueezRTB    │      │  Rise Codes    │
     │   SSP/Prebid  │      │  S2S RTB       │
     │   ~90M visits │      │  SAM Engine    │
     └───────────────┘      └────────────────┘
```

### Component Overview

| Component | Responsibility |
|-----------|---------------|
| **Frontend** | Campaign management dashboard, real-time auction visualization, analytics |
| **Fastify API** | REST endpoints for campaigns, analytics, simulator control |
| **Bid Engine** | 4-layer pipeline: Filter → Score → Price → Pace |
| **Campaign Service** | CRUD operations, budget tracking, status management |
| **Reseller Adapters** | OpenRTB 2.6 protocol adapters for each supply partner |
| **Auction Simulator** | Generates realistic bid requests with competing bidders for testing |
| **WebSocket Server** | Real-time event streaming from backend to frontend |

---

## 3. Bid Engine Design

The bid engine is the core of the platform. It processes incoming bid requests through a **4-layer pipeline**, each layer designed to eliminate a specific type of waste:

```
Bid Request ─► [FILTER] ─► [SCORE] ─► [PRICE] ─► [PACE] ─► Bid Response
                  │            │          │          │
                  │            │          │          └─ Budget exhausted? Throttle
                  │            │          └─ How much to bid
                  │            └─ How likely are we to win?
                  └─ Does this match our campaigns?
```

### Layer 1: Bid Filter

**Purpose:** Eliminate clearly non-viable impressions before any computation.

**Checks:**
- Campaign budget exhaustion (total and daily)
- Bid floor exceeds campaign max CPM
- Geographic targeting mismatch
- Device type targeting mismatch
- Content category targeting mismatch
- Domain whitelist/blacklist
- Creative duration compatibility with ad slot

**Impact:** Typically eliminates 40-60% of bid requests immediately, saving all downstream compute.

### Layer 2: Win Probability Scorer

**Purpose:** Predict the probability of winning the auction at a given price.

**Approach:** Feature-weighted adaptive scoring model that learns from outcomes:

| Feature | Signal |
|---------|--------|
| Bid-to-floor ratio | Higher ratio → higher win probability |
| Reseller ID | Some resellers are more/less competitive |
| Device type | Mobile auctions tend to be more competitive |
| Geography | US/UK inventory more competitive than emerging markets |

**Learning:** After each auction outcome (win/loss), weights are updated using a configurable learning rate. This allows the model to adapt to market conditions over time.

**Threshold:** Bids with win probability below 0.3 (30%) are filtered out. This threshold is the primary lever for controlling the win rate vs. volume tradeoff.

### Layer 3: Bid Pricer (Bid Shading)

**Purpose:** Calculate the optimal bid price — high enough to win, low enough to not overpay.

**Algorithm:**
1. Estimate clearing price from historical data (moving average of recent clearing prices)
2. Apply shading factor (default 0.85 — bid at 85% of estimated clearing price)
3. Adjust for win probability (if likely to win, bid lower; if unlikely, bid higher)
4. Enforce constraints: floor price minimum, max CPM ceiling, max floor ratio

**Key insight:** In first-price auctions (standard in modern ad tech), bid shading is critical. Without it, winners consistently overpay.

### Layer 4: Budget Pacer

**Purpose:** Distribute spending evenly across the campaign's lifetime.

**Mechanism:**
- Compares daily spend rate to time-of-day fraction
- If overpacing: probabilistic throttle (skip some auctions)
- If near budget exhaustion (>90% spent): hard throttle to 30%
- Rate limiting: cap bids per second to prevent runaway spending

#### Bid shading

  Bid Shading — The Math

  The core idea: in a first-price auction (which is the industry standard now), you pay exactly what
  you bid. So if you bid $8 and the next-highest bid was $3.50, you just overpaid by $4.50. Bid shading
   means: bid closer to $3.50, not $8.

  The Formula

  Here's what our bid pricer calculates, step by step:

  bidPrice = estimatedClearingPrice × shadingFactor × probabilityAdjustment

  Step 1 — Estimate the clearing price:

  If we have < 10 past auctions of data:
      estimatedClearing = floorPrice × 1.8      (aggressive guess while learning)

  If we have >= 10 past auctions:
      estimatedClearing = movingAverage(last 100 clearing prices)
      estimatedClearing = max(estimatedClearing, floorPrice × 1.1)

  Step 2 — Apply shading factor (0.92):

  shadedPrice = estimatedClearing × 0.92

  We bid at 92% of what we think the clearing price is — just under, banking on winning at a slight
  discount.

  Step 3 — Adjust for win probability:

  probabilityAdjustment = 1 + (0.5 - winProbability) × 0.4

  This is the clever part:
  - If winProbability = 0.8 (very likely to win): adjustment = 1 + (0.5 - 0.8) × 0.4 = 0.88 → bid lower
   (why overpay when we'll probably win?)
  - If winProbability = 0.3 (borderline): adjustment = 1 + (0.5 - 0.3) × 0.4 = 1.08 → bid higher (need
  to be more competitive)
  - If winProbability = 0.5 (coin flip): adjustment = 1.0 → no change

  Step 4 — Enforce constraints:

  bidPrice = max(bidPrice, floorPrice × 1.01)     // at least 1% above floor
  bidPrice = min(bidPrice, maxBidCpm)               // never exceed campaign max
  bidPrice = min(bidPrice, floorPrice × 3.0)        // never bid more than 3x floor

  Concrete Example

  Say a bid request comes in from KueezRTB:
  - Floor price: $2.50 CPM
  - Our campaign max bid: $8.00 CPM
  - Win probability score: 0.65 (we're likely to win this)
  - We have enough history, moving average of clearing prices: $4.00

  estimatedClearing = max($4.00, $2.50 × 1.1) = $4.00
  shadedPrice       = $4.00 × 0.92 = $3.68
  probAdjustment    = 1 + (0.5 - 0.65) × 0.4 = 0.94
  bidPrice          = $3.68 × 0.94 = $3.46

  Constraints:
    max($3.46, $2.50 × 1.01) = $3.46  ✓ (above floor)
    min($3.46, $8.00) = $3.46          ✓ (under max)
    min($3.46, $2.50 × 3.0) = $3.46   ✓ (under 3x floor)

  Final bid: $3.46 CPM

  Without shading, we'd bid $8.00 and overpay by $4.54 per win. Bid shading saves us 57% per
  impression.

---

## 4. Reseller Integration

### OpenRTB 2.6 Protocol

All reseller communication uses the **OpenRTB 2.6** standard, maintained by IAB Tech Lab. This is the universal protocol for programmatic ad buying.

**Bid Request** (from reseller to Atrium):
```json
{
  "id": "auction-123",
  "imp": [{
    "id": "imp-1",
    "video": {
      "mimes": ["video/mp4"],
      "protocols": [3, 7],
      "maxduration": 30,
      "w": 1920, "h": 1080
    },
    "bidfloor": 2.50
  }],
  "site": { "domain": "example.com", "cat": ["IAB1"] },
  "device": { "geo": { "country": "US" }, "devicetype": 1 }
}
```

**Bid Response** (from Atrium to reseller):
```json
{
  "id": "auction-123",
  "seatbid": [{
    "seat": "atrium",
    "bid": [{
      "id": "bid-456",
      "impid": "imp-1",
      "price": 3.25,
      "adm": "<VAST version=\"3.0\">...video creative...</VAST>"
    }]
  }]
}
```

### Reseller Profiles

#### KueezRTB
- **Type:** SSP + Publisher network
- **Inventory:** ~90M monthly visitors across quiz/entertainment sites
- **Integration:** Prebid.js adapter (KueezRTB), parameters: `cId`, `pId`
- **Typical floor prices:** $1.50 - $4.00 CPM
- **Geos:** US, GB, DE, IL
- **Content categories:** Entertainment (IAB1), Hobbies (IAB9), Sports (IAB17)

#### Rise Codes
- **Type:** SSP with AI optimization (SAM engine)
- **Integration:** Server-to-server RTB at `s2s.yellowblue.io/rtb`
- **Typical floor prices:** $2.00 - $5.00 CPM
- **Geos:** US, GB, CA, AU, FR
- **Content categories:** Entertainment (IAB1), News (IAB12), Technology (IAB19), Travel (IAB20)

### Adapter Pattern

Each reseller implements a common interface:

```typescript
interface ResellerAdapter {
  readonly id: string;
  readonly name: string;
  submitBid(request: BidRequest, response: BidResponse): Promise<BidSubmitResult>;
  ping(): Promise<boolean>;
}
```

Adding a new reseller requires only implementing this interface — no changes to the bid engine or core logic.

---

## 5. Win Rate Optimization Strategy

### The Problem

Traditional DSPs bid on every available impression, resulting in:
- 1-5% win rates
- 95-99% of compute wasted on losing bids
- High infrastructure costs for low ROI

### Our Approach: Selective Bidding

**Three pillars of optimization:**

#### Pillar 1: Smart Filtering
Don't bid on impressions that don't match campaign targeting. This eliminates 40-60% of bid requests before any costly computation.

#### Pillar 2: Bid Shading
In first-price auctions, naive bidders bid their maximum and overpay. Bid shading estimates the minimum winning price and bids just above it:

```
Naive bid:    Max CPM ($8.00) → Win, but overpay by $3.50
Shaded bid:   Floor × 1.3 ($3.25) → Win at clearing price
Savings:      $4.75 per win (59% savings)
```

#### Pillar 3: Continuous Learning
The win probability model learns from every auction outcome:

```
Win  → Increase weights for that reseller, device, geo (we can bid less aggressively here)
Loss → Decrease weights (we need to bid more or skip these)
```

Over hundreds of auctions, the model converges on optimal bidding patterns for each segment of inventory.

### Expected Performance

| Metric | Traditional DSP | Atrium Target |
|--------|----------------|---------------|
| Win Rate | 1-5% | 40-70% |
| Bid Waste | 95-99% | 30-60% |
| Avg CPM Savings | Baseline | 20-40% reduction |

---

## 6. Data Model

### Campaign

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| name | string | Campaign name |
| status | enum | draft, active, paused, completed |
| budget.total | number | Total budget in USD |
| budget.daily | number | Daily spend cap |
| budget.maxBidCpm | number | Maximum bid price (CPM) |
| targeting | object | Geos, devices, categories, domains |
| creative | object | VAST URL, duration, dimensions |

### Bid Log

| Field | Type | Description |
|-------|------|-------------|
| id | UUID | Primary key |
| timestamp | datetime | When the bid was evaluated |
| campaignId | UUID | Which campaign this was for |
| reseller | string | Which reseller sent the request |
| decision | enum | bid or no_bid |
| bidAmount | number | How much we bid (if any) |
| floorPrice | number | The bid floor from the request |
| winProbability | number | Model's predicted win chance |
| outcome | enum | win, loss, pending |
| clearingPrice | number | Actual clearing price |
| filterReason | string | Why we didn't bid (if no_bid) |

### Auction Metrics (Aggregated)

| Metric | Computation |
|--------|-------------|
| Win Rate | wins / total_bids |
| Bid Rate | bids / total_requests |
| Waste Ratio | losses / total_bids |
| Avg CPM | total_spend / total_wins |
| Avg Bid Price | mean(bid_amounts) |
| Avg Clearing Price | mean(clearing_prices) where won |

---

## 7. Real-Time Pipeline

### Event Flow

```
Auction Simulator
    │
    ├─ tick() every N ms
    │   ├─ Generate bid request (inventory-generator)
    │   ├─ Run through bid engine pipeline
    │   ├─ If bid: simulate competitor bids
    │   ├─ Resolve auction (first-price)
    │   ├─ Log results to SQLite
    │   └─ Emit events ──┐
    │                     │
    ▼                     ▼
EventEmitter         Socket.IO Server
                          │
                ┌─────────┼─────────┐
                │         │         │
          bid_result  metrics   state
          (each bid)  (every    (status
                       10 bids)  changes)
                │         │         │
                ▼         ▼         ▼
           Socket.IO Client (Frontend)
                          │
                    Zustand Store
                          │
                    React Components
                    (auto re-render)
```

### WebSocket Events

| Event | Frequency | Payload |
|-------|-----------|---------|
| `bid_result` | Every bid | BidLog |
| `metrics_update` | Every 10 bids | AuctionMetrics |
| `simulator_state` | On state change | SimulatorState |

---

## 8. Technology Choices

| Technology | Rationale |
|------------|-----------|
| **TypeScript** | Full-stack type safety. Shared types between backend and frontend eliminate a class of integration bugs. |
| **Fastify** | Lowest-latency Node.js framework. Critical for RTB where responses must be under 200ms. |
| **SQLite** | Zero-config persistence for prototype. Single-file database, no server to manage. |
| **Socket.IO** | Battle-tested WebSocket library with automatic fallback, reconnection, and room support. |
| **React 18** | Component model ideal for real-time data-heavy dashboards. Concurrent features for smooth updates. |
| **Vite** | Fastest development server. HMR under 50ms. |
| **Zustand** | Minimal state management. No boilerplate. Direct subscription model for real-time updates. |
| **Recharts** | React-native charting. Declarative API, good performance with streaming data. |
| **Tailwind CSS** | Utility-first CSS for rapid, consistent UI development. |
| **Monorepo (pnpm)** | Shared types package. Single install. Coordinated builds. |

---

## 9. Production Roadmap

### Phase 1: Database & Infrastructure
- **PostgreSQL** replaces SQLite for concurrent writes and production reliability
- **Redis** for real-time bid state, budget counters, and rate limiting (sub-ms reads)
- **Kubernetes** deployment with auto-scaling based on bid request volume

### Phase 2: Real Reseller Integrations
- Implement actual HTTP clients for KueezRTB Prebid and Rise Codes S2S endpoints
- Obtain API credentials and publisher IDs
- Integrate with **Prebid Server** for server-side header bidding
- Add VAST creative serving infrastructure

### Phase 3: ML-Powered Bidding
- Replace heuristic win scorer with **gradient-boosted decision tree** model
- Feature engineering: time of day, day of week, historical domain performance
- A/B test bidding strategies per campaign
- Automated bid floor prediction

### Phase 4: Scale & Monitoring
- **Grafana** dashboards for operational metrics
- **PagerDuty** alerting for win rate drops, budget anomalies
- Geographic load distribution (edge bidders close to resellers)
- Target: 100,000+ bid requests/second

### Phase 5: Creative Optimization
- A/B test video creatives per audience segment
- Generative creative variants using AI
- Cross-channel attribution (view-through, click-through)

---

## 10. API Reference

### Campaign Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/campaigns` | List all campaigns |
| `POST` | `/api/campaigns` | Create a new campaign |
| `GET` | `/api/campaigns/:id` | Get campaign by ID |
| `PATCH` | `/api/campaigns/:id/status` | Update campaign status |
| `DELETE` | `/api/campaigns/:id` | Delete a campaign |

#### POST /api/campaigns — Request Body

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
    "categories": ["IAB1", "IAB19"]
  },
  "creative": {
    "id": "creative-1",
    "name": "Brand Video 30s",
    "vastUrl": "https://cdn.example.com/vast/brand-30s.xml",
    "duration": 30,
    "width": 1920,
    "height": 1080,
    "mimeType": "video/mp4"
  }
}
```

### Analytics Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/analytics/metrics` | Aggregated auction metrics |
| `GET` | `/api/analytics/by-reseller` | Metrics broken down by reseller |
| `GET` | `/api/analytics/recent-bids?limit=50` | Recent bid log entries |

### Simulator Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/simulator/start` | Start the auction simulator |
| `POST` | `/api/simulator/stop` | Stop the simulator |
| `POST` | `/api/simulator/reset` | Reset simulator and clear data |
| `GET` | `/api/simulator/state` | Get current simulator state |

#### POST /api/simulator/start — Request Body (Optional)

```json
{
  "requestsPerSecond": 50,
  "competitorAggressiveness": 0.6
}
```

### WebSocket Events

Connect to the root URL via Socket.IO. Events:

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `bid_result` | Server → Client | `BidLog` | Emitted for each bid evaluation |
| `metrics_update` | Server → Client | `AuctionMetrics` | Emitted every 10 bid requests |
| `simulator_state` | Server → Client | `SimulatorState` | Emitted on simulator state changes |

---

*Document prepared for Atrium team. Architecture and prototype by [Your Name].*
