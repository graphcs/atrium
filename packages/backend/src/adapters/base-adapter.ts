import type { BidRequest, BidResponse } from '@atrium/shared';

export interface ResellerAdapter {
  readonly id: string;
  readonly name: string;
  submitBid(request: BidRequest, response: BidResponse): Promise<BidSubmitResult>;
  ping(): Promise<boolean>;
}

export interface BidSubmitResult {
  accepted: boolean;
  clearingPrice?: number;
  won?: boolean;
  error?: string;
}
