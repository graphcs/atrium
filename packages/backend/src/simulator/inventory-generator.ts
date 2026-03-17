import { v4 as uuid } from 'uuid';
import type { BidRequest, ResellerConfig } from '@atrium/shared';
import { VIDEO_MIMES, VAST_PROTOCOLS, DEVICE_TYPES } from '@atrium/shared';

const DOMAINS = [
  'gaming-news.com', 'sport-clips.tv', 'tech-daily.io', 'travel-vids.com',
  'music-stream.fm', 'quiz-world.net', 'news-hub.org', 'entertainment.buzz',
  'mobile-games.app', 'fitness-zone.com',
];

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function gaussianRandom(mean: number, stdDev: number): number {
  const u1 = Math.random();
  const u2 = Math.random();
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + z * stdDev;
}

export function generateBidRequest(reseller: ResellerConfig): BidRequest {
  const floor = Math.max(0.1, gaussianRandom(reseller.avgFloorPrice, reseller.floorPriceVariance));

  return {
    id: uuid(),
    imp: [{
      id: uuid(),
      video: {
        mimes: [...VIDEO_MIMES],
        protocols: [VAST_PROTOCOLS.VAST_3_0, VAST_PROTOCOLS.VAST_4_0],
        minduration: 5,
        maxduration: pick([15, 30, 60]),
        w: pick([640, 1280, 1920]),
        h: pick([360, 720, 1080]),
        linearity: 1,
        playbackmethod: [pick([1, 2, 3])],
        startdelay: pick([0, -1, 15]),
      },
      bidfloor: Math.round(floor * 100) / 100,
      bidfloorcur: 'USD',
    }],
    site: {
      id: uuid(),
      domain: pick(DOMAINS),
      cat: [pick(reseller.categories)],
      publisher: {
        id: reseller.id,
        name: reseller.name,
      },
    },
    device: {
      devicetype: pick([DEVICE_TYPES.MOBILE, DEVICE_TYPES.PC, DEVICE_TYPES.TABLET, DEVICE_TYPES.CTV]),
      geo: {
        country: pick(reseller.geos),
      },
      os: pick(['iOS', 'Android', 'Windows', 'macOS']),
      language: 'en',
    },
    at: 1,
    tmax: 200,
    cur: ['USD'],
  };
}
