import type { Campaign } from '@atrium/shared';

/**
 * Budget pacing — controls spend rate to distribute budget evenly.
 */
export class BudgetPacer {
  private bidCountThisSecond = 0;
  private lastSecondTimestamp = 0;

  getThrottle(campaign: Campaign): number {
    if (campaign.budget.spent >= campaign.budget.total) return 0;
    if (campaign.budget.spentToday >= campaign.budget.daily) return 0;

    const dailyUtilization = campaign.budget.spentToday / campaign.budget.daily;
    const now = new Date();
    const hourFraction = (now.getHours() * 60 + now.getMinutes()) / (24 * 60);

    if (hourFraction > 0 && dailyUtilization > hourFraction) {
      const overpace = dailyUtilization / hourFraction;
      return Math.max(0.1, 1 / overpace);
    }

    const totalUtilization = campaign.budget.spent / campaign.budget.total;
    if (totalUtilization > 0.9) {
      return 0.3;
    }

    return 1.0;
  }

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
