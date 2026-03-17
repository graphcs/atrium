import type { BidRequest, BidResponse } from '@atrium/shared';
import type { ResellerAdapter, BidSubmitResult } from './base-adapter.js';

/**
 * KueezRTB adapter.
 * Production: integrates with KueezRTB's Prebid/server-to-server endpoint.
 * Prototype: simulates responses — actual auction is resolved in the simulator.
 */
export class KueezAdapter implements ResellerAdapter {
  readonly id = 'kueez';
  readonly name = 'KueezRTB';

  async submitBid(_request: BidRequest, _response: BidResponse): Promise<BidSubmitResult> {
    return { accepted: true, won: false };
  }

  async ping(): Promise<boolean> {
    return true;
  }
}
