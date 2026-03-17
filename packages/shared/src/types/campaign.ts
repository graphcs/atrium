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
  total: number;
  daily: number;
  spent: number;
  spentToday: number;
  maxBidCpm: number;
}

export interface Targeting {
  geos?: string[];
  devices?: DeviceType[];
  categories?: string[];
  domains?: string[];
  excludeDomains?: string[];
  videoMinDuration?: number;
  videoMaxDuration?: number;
  resellers?: string[];
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
  vastUrl: string;
  duration: number;
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
