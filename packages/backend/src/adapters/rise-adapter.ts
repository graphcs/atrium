import type { BidRequest, BidResponse } from '@atrium/shared';
import type { ResellerAdapter, BidSubmitResult } from './base-adapter.js';

/**
 * Rise Codes adapter.
 * Production: integrates with Rise's S2S endpoint at s2s.yellowblue.io/rtb.
 * Prototype: simulates responses — actual auction is resolved in the simulator.
 */
export class RiseAdapter implements ResellerAdapter {
  readonly id = 'rise';
  readonly name = 'Rise Codes';

  async submitBid(_request: BidRequest, _response: BidResponse): Promise<BidSubmitResult> {
    return { accepted: true, won: false };
  }

  async ping(): Promise<boolean> {
    return true;
  }
}
