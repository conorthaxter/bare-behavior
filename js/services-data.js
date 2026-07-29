// Single source of truth for the services section. UI renders from this — never hard-code prices in markup.
export const TBD_PRICE_DISPLAY = 'inquire'; // 'inquire' | 'omit'

// dotXY is expressed in the SHARED normalized viewBox: 0 0 329.32 754.19 (both figures normalized to this).
export const SERVICE_REGIONS = [
  {
    id: 'face',
    side: 'front',
    dotXY: [164, 55],
    boxSide: 'right',
    category: 'Face',
    items: [
      { name: 'Eyebrows', price: 25, note: 'brow cleanup, middle brow' },
      { name: 'Lip', price: 14 },
      { name: 'Chin', price: 18 },
      { name: 'Cheeks', price: 18 },
      { name: 'Sideburns', price: 18 },
      { name: 'Nostrils', price: 20 },
      { name: 'Ears', price: 20 },
      { name: 'Full face', price: 70 },
      { name: 'Eyebrow wax & tint', price: 45 },
      { name: 'Tint', price: 25 },
    ],
  },
  {
    id: 'neck',
    side: 'back',
    dotXY: [164, 108],
    boxSide: 'left',
    category: 'Body',
    items: [{ name: 'Neck', price: 20 }],
  },
  {
    id: 'shoulders',
    side: 'back',
    dotXY: [200, 138],
    boxSide: 'left',
    category: 'Body',
    items: [{ name: 'Shoulders', price: 19 }],
  },
  {
    id: 'chest',
    side: 'front',
    dotXY: [164, 175],
    boxSide: 'right',
    category: 'Body',
    items: [{ name: 'Chest', price: 71 }],
  },
  {
    id: 'arms',
    side: 'front',
    dotXY: [252, 260],
    boxSide: 'right',
    category: 'Body',
    items: [
      { name: 'Arms', price: 55 },
      { name: 'Arms (half)', price: 42 },
      { name: 'Underarms', price: 22 },
    ],
  },
  {
    id: 'stomach',
    side: 'front',
    dotXY: [164, 290],
    boxSide: 'right',
    category: 'Body',
    items: [{ name: 'Stomach (partial)', price: 32 }],
  },
  {
    id: 'legs',
    side: 'front',
    dotXY: [205, 460],
    boxSide: 'right',
    category: 'Body',
    items: [
      { name: 'Legs', price: 85 },
      { name: 'Legs (half)', price: 48 },
      { name: 'Inner thigh', price: 12 },
    ],
  },
  {
    id: 'below-the-belt',
    side: 'front',
    dotXY: [160, 380],
    boxSide: 'right',
    category: 'Below the Belt',
    items: [
      { name: 'Bare Mini (Bikini)', price: 40 },
      { name: 'Bare Midi (Bikini Tight)', price: 55 },
      { name: 'Bare Maxi (Brazilian)', price: 69 },
      { name: 'Manzilian', price: 95 },
      { name: 'Brazilian Rehab', price: 'prices vary', note: 'steam, extractions, mask' },
      { name: 'Manzilian Rehab', price: 'prices vary' },
    ],
  },
  {
    id: 'back',
    side: 'back',
    dotXY: [164, 220],
    boxSide: 'left',
    category: 'Body',
    items: [
      { name: 'Back', price: 71 },
      { name: 'Back (partial)', price: 32 },
    ],
  },
  {
    id: 'glutes',
    side: 'back',
    dotXY: [195, 400],
    boxSide: 'left',
    category: 'Below the Belt',
    items: [{ name: 'Glutes', price: 32 }],
  },
  {
    id: 'between-the-cheeks',
    side: 'back',
    dotXY: [164, 415],
    boxSide: 'left',
    category: 'Below the Belt',
    items: [{ name: 'Between the Cheeks', price: 21 }],
  },
];

export const CATEGORY_ORDER = ['Body', 'Face', 'Below the Belt'];

export function formatPrice(item) {
  if (item.price == null) {
    return TBD_PRICE_DISPLAY === 'omit' ? '' : 'inquire';
  }
  if (typeof item.price === 'string') return item.price; // e.g. "prices vary"
  return `$${item.price}${item.priceSuffix || ''}`;
}
