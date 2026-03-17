import type { BidRequest, Campaign, Impression } from '@atrium/shared';
import { DEVICE_TYPES } from '@atrium/shared';

export interface FilterResult {
  pass: boolean;
  reason?: string;
}

export function filterBidRequest(request: BidRequest, impression: Impression, campaign: Campaign): FilterResult {
  const t = campaign.targeting;

  if (campaign.budget.spent >= campaign.budget.total) {
    return { pass: false, reason: 'budget_exhausted' };
  }
  if (campaign.budget.spentToday >= campaign.budget.daily) {
    return { pass: false, reason: 'daily_budget_exhausted' };
  }

  const floorCpm = impression.bidfloor ?? 0;
  if (floorCpm > campaign.budget.maxBidCpm) {
    return { pass: false, reason: 'floor_exceeds_max_bid' };
  }

  if (t.geos && t.geos.length > 0 && request.device?.geo?.country) {
    if (!t.geos.includes(request.device.geo.country)) {
      return { pass: false, reason: 'geo_mismatch' };
    }
  }

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

  if (t.categories && t.categories.length > 0 && request.site?.cat) {
    const overlap = request.site.cat.some(c => t.categories!.includes(c));
    if (!overlap) {
      return { pass: false, reason: 'category_mismatch' };
    }
  }

  if (t.excludeDomains && t.excludeDomains.length > 0 && request.site?.domain) {
    if (t.excludeDomains.includes(request.site.domain)) {
      return { pass: false, reason: 'domain_excluded' };
    }
  }

  if (t.domains && t.domains.length > 0 && request.site?.domain) {
    if (!t.domains.includes(request.site.domain)) {
      return { pass: false, reason: 'domain_not_whitelisted' };
    }
  }

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
