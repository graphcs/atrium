export const VIDEO_MIMES = ['video/mp4', 'video/webm', 'video/ogg'] as const;

export const VAST_PROTOCOLS = {
  VAST_2_0: 2,
  VAST_3_0: 3,
  VAST_2_0_WRAPPER: 5,
  VAST_3_0_WRAPPER: 6,
  VAST_4_0: 7,
  VAST_4_0_WRAPPER: 8,
} as const;

export const IAB_CATEGORIES = [
  'IAB1', 'IAB2', 'IAB3', 'IAB5', 'IAB9',
  'IAB12', 'IAB17', 'IAB19', 'IAB20', 'IAB22',
] as const;

export const DEVICE_TYPES = {
  MOBILE: 1,
  PC: 2,
  CTV: 3,
  TABLET: 5,
} as const;

export const GEO_COUNTRIES = [
  'US', 'GB', 'CA', 'AU', 'DE', 'FR', 'JP', 'BR', 'IN', 'IL',
] as const;
