export interface CompetitorBid {
  bidderId: string;
  price: number;
}

export function generateCompetitorBids(
  floorPrice: number,
  competitorCount: number,
  aggressiveness: number,
): CompetitorBid[] {
  const bids: CompetitorBid[] = [];

  for (let i = 0; i < competitorCount; i++) {
    // 40% chance each competitor bids
    if (Math.random() > 0.6) continue;

    const multiplier = 1 + (Math.random() * 2 * aggressiveness);
    const noise = (Math.random() - 0.5) * 0.5;
    const price = floorPrice * (multiplier + noise);

    if (price >= floorPrice) {
      bids.push({
        bidderId: `competitor-${i}`,
        price: Math.round(price * 100) / 100,
      });
    }
  }

  return bids;
}

/**
 * Determine auction winner. First-price: highest bid wins, pays their bid price.
 */
export function resolveAuction(
  ourBidPrice: number,
  competitorBids: CompetitorBid[],
): { won: boolean; clearingPrice: number; winningBidder: string } {
  const allBids = [
    { bidderId: 'atrium', price: ourBidPrice },
    ...competitorBids,
  ];

  allBids.sort((a, b) => b.price - a.price);
  const winner = allBids[0];

  return {
    won: winner.bidderId === 'atrium',
    clearingPrice: winner.price,
    winningBidder: winner.bidderId,
  };
}
