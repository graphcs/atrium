export interface SimulatorConfig {
  requestsPerSecond: number;
  resellers: ResellerConfig[];
  competitorCount: number;
  competitorAggressiveness: number;
}

export interface ResellerConfig {
  id: string;
  name: string;
  weight: number;
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
