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
  minWinProbabilityThreshold: 0.2,
  bidShadingFactor: 0.92,
  maxBidToFloorRatio: 3.0,
  learningRate: 0.05,
};
