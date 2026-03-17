/** OpenRTB 2.6 Bid Request — simplified for video DSP */
export interface BidRequest {
  id: string;
  imp: Impression[];
  site?: Site;
  app?: App;
  device?: Device;
  user?: User;
  at?: AuctionType;
  tmax?: number;
  cur?: string[];
}

export interface Impression {
  id: string;
  video: Video;
  bidfloor?: number;
  bidfloorcur?: string;
  pmp?: PMP;
}

export interface Video {
  mimes: string[];
  protocols: number[];
  minduration?: number;
  maxduration?: number;
  w?: number;
  h?: number;
  linearity?: number;
  playbackmethod?: number[];
  startdelay?: number;
  placement?: number;
}

export interface Site {
  id?: string;
  domain?: string;
  cat?: string[];
  page?: string;
  publisher?: Publisher;
}

export interface App {
  id?: string;
  bundle?: string;
  cat?: string[];
  publisher?: Publisher;
}

export interface Publisher {
  id?: string;
  name?: string;
  domain?: string;
}

export interface Device {
  ua?: string;
  ip?: string;
  geo?: Geo;
  devicetype?: number;
  os?: string;
  osv?: string;
  language?: string;
}

export interface Geo {
  lat?: number;
  lon?: number;
  country?: string;
  region?: string;
  city?: string;
}

export interface User {
  id?: string;
  buyeruid?: string;
}

export interface PMP {
  private_auction?: number;
  deals?: Deal[];
}

export interface Deal {
  id: string;
  bidfloor?: number;
  at?: AuctionType;
}

export enum AuctionType {
  FirstPrice = 1,
  SecondPrice = 2,
}

/** OpenRTB 2.6 Bid Response */
export interface BidResponse {
  id: string;
  seatbid: SeatBid[];
  cur?: string;
}

export interface SeatBid {
  seat?: string;
  bid: Bid[];
}

export interface Bid {
  id: string;
  impid: string;
  price: number;
  adm?: string;
  nurl?: string;
  adomain?: string[];
  crid?: string;
  w?: number;
  h?: number;
  dealid?: string;
}
