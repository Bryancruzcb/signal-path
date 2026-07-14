// All names, locations, products, and inventory in this file are fictional demo data.

export const productFormats = [
  'Flower',
  'Pre-roll',
  'Vape',
  'Edible',
  'Concentrate',
  'Wellness',
] as const

export type ProductFormat = (typeof productFormats)[number]

export const inventoryStatuses = ['in-stock', 'low-stock', 'unavailable'] as const

export type InventoryStatus = (typeof inventoryStatuses)[number]

export type StoreId = 'hayward-central' | 'hayward-south'

export type ProductArt = {
  texture: 'ripple' | 'grain' | 'rays' | 'grid'
  label: 'foil' | 'ink' | 'clear'
  accent: string
}

export type PickupWindow = {
  id: string
  label: string
  startsAt: string
  endsAt: string
}

export type Store = {
  id: StoreId
  name: string
  neighborhood: string
  address: string
  hours: readonly string[]
  pickupAvailable: boolean
  pickupWindows: readonly PickupWindow[]
  parkingNote: string
  transitNote: string
  accessibilityNotes: readonly string[]
}

export type Product = {
  id: string
  name: string
  brand: string
  format: ProductFormat
  subcategory: string
  size: string
  priceCents: number
  description: string
  potency: string
  flavorNotes: readonly string[]
  imageTone: string
  art: ProductArt
  availabilityByStore: Record<StoreId, InventoryStatus>
  pickupEligible: boolean
  featured: boolean
}

export const inventoryStatusLabels: Record<InventoryStatus, string> = {
  'in-stock': 'Available today',
  'low-stock': 'Low stock',
  unavailable: 'Unavailable',
}

export const pickupWindows: Record<StoreId, readonly PickupWindow[]> = {
  'hayward-central': [
    { id: 'hc-10', label: '10:00–11:00 AM', startsAt: '10:00', endsAt: '11:00' },
    { id: 'hc-11', label: '11:00 AM–12:00 PM', startsAt: '11:00', endsAt: '12:00' },
    { id: 'hc-12', label: '12:00–1:00 PM', startsAt: '12:00', endsAt: '13:00' },
    { id: 'hc-2', label: '2:00–3:00 PM', startsAt: '14:00', endsAt: '15:00' },
    { id: 'hc-4', label: '4:00–5:00 PM', startsAt: '16:00', endsAt: '17:00' },
    { id: 'hc-6', label: '6:00–7:00 PM', startsAt: '18:00', endsAt: '19:00' },
  ],
  'hayward-south': [
    { id: 'hs-10', label: '10:30–11:30 AM', startsAt: '10:30', endsAt: '11:30' },
    { id: 'hs-12', label: '12:30–1:30 PM', startsAt: '12:30', endsAt: '13:30' },
    { id: 'hs-2', label: '2:30–3:30 PM', startsAt: '14:30', endsAt: '15:30' },
    { id: 'hs-4', label: '4:30–5:30 PM', startsAt: '16:30', endsAt: '17:30' },
    { id: 'hs-6', label: '6:00–7:00 PM', startsAt: '18:00', endsAt: '19:00' },
  ],
}

export const stores: readonly Store[] = [
  {
    id: 'hayward-central',
    name: 'Morrow Market — Central',
    neighborhood: 'Central Hayward',
    address: '18 Orchard Lantern Way, Hayward, CA 94541 (fictional demo address)',
    hours: [
      'Mon–Thu: 10:00 AM–8:00 PM',
      'Fri–Sat: 10:00 AM–9:00 PM',
      'Sun: 10:00 AM–7:00 PM',
    ],
    pickupAvailable: true,
    pickupWindows: pickupWindows['hayward-central'],
    parkingNote: 'Fictional demo lot with eight short-stay pickup spaces behind the storefront.',
    transitNote: 'A short, level walk from a fictional local transit stop.',
    accessibilityNotes: [
      'Step-free entrance and a wide automatic door.',
      'Low-height checkout counter available on request.',
      'Accessible restroom available to customers.',
    ],
  },
  {
    id: 'hayward-south',
    name: 'Morrow Market — South',
    neighborhood: 'South Hayward',
    address: '402 Meadow Current Road, Hayward, CA 94545 (fictional demo address)',
    hours: [
      'Mon–Thu: 10:30 AM–7:30 PM',
      'Fri–Sat: 10:30 AM–8:00 PM',
      'Sun: 11:00 AM–6:00 PM',
    ],
    pickupAvailable: true,
    pickupWindows: pickupWindows['hayward-south'],
    parkingNote: 'Fictional demo lot with pickup parking beside the front entry.',
    transitNote: 'Fictional neighborhood stop is a brief walk from the store entrance.',
    accessibilityNotes: [
      'Step-free entry from the pickup parking area.',
      'Clear aisle space through the sales floor.',
      'Seating is available while a pickup is prepared.',
    ],
  },
]

export const products: readonly Product[] = [
  {
    id: 'canyonlight-citrus-meter-flower',
    name: 'Citrus Meter',
    brand: 'Canyonlight',
    format: 'Flower',
    subcategory: 'Sungrown whole flower',
    size: '3.5 g',
    priceCents: 3400,
    description: 'A bright, whole-flower option with orange peel, wild herb, and dry cedar notes.',
    potency: 'THC 24.1%',
    flavorNotes: ['Orange peel', 'Wild herbs', 'Cedar'],
    imageTone: '#D98B55',
    art: { texture: 'ripple', label: 'ink', accent: '#FFD0A8' },
    availabilityByStore: {
      'hayward-central': 'in-stock',
      'hayward-south': 'low-stock',
    },
    pickupEligible: true,
    featured: true,
  },
  {
    id: 'paper-kite-plum-circuit-flower',
    name: 'Plum Circuit',
    brand: 'Paper Kite',
    format: 'Flower',
    subcategory: 'Indoor whole flower',
    size: '3.5 g',
    priceCents: 4200,
    description: 'Dense flower with a deep berry aroma, cocoa-like finish, and an evergreen edge.',
    potency: 'THC 27.6%',
    flavorNotes: ['Black plum', 'Cocoa', 'Pine'],
    imageTone: '#6E557D',
    art: { texture: 'grain', label: 'foil', accent: '#E2C5F0' },
    availabilityByStore: {
      'hayward-central': 'low-stock',
      'hayward-south': 'in-stock',
    },
    pickupEligible: true,
    featured: false,
  },
  {
    id: 'mosaic-roll-sunline-minis-preroll',
    name: 'Sunline Minis',
    brand: 'Mosaic Roll Co.',
    format: 'Pre-roll',
    subcategory: 'Mini pre-roll pack',
    size: '5 × 0.5 g',
    priceCents: 2600,
    description: 'A five-pack of small, evenly filled pre-rolls with a soft citrus and pine profile.',
    potency: 'THC 22.0%',
    flavorNotes: ['Lemon zest', 'Pine needle', 'Pepper'],
    imageTone: '#D4A74B',
    art: { texture: 'rays', label: 'foil', accent: '#FFE5A0' },
    availabilityByStore: {
      'hayward-central': 'in-stock',
      'hayward-south': 'unavailable',
    },
    pickupEligible: true,
    featured: true,
  },
  {
    id: 'juniper-thread-pineglass-preroll',
    name: 'Pineglass Single',
    brand: 'Juniper Thread',
    format: 'Pre-roll',
    subcategory: 'Single pre-roll',
    size: '1 g',
    priceCents: 1000,
    description: 'One neatly packed pre-roll with fresh forest and lightly floral aromatic notes.',
    potency: 'THC 25.4%',
    flavorNotes: ['Evergreen', 'Lavender', 'Lemon rind'],
    imageTone: '#64846E',
    art: { texture: 'grid', label: 'clear', accent: '#C2E1C7' },
    availabilityByStore: {
      'hayward-central': 'low-stock',
      'hayward-south': 'in-stock',
    },
    pickupEligible: true,
    featured: false,
  },
  {
    id: 'aster-lane-apricot-current-vape',
    name: 'Apricot Current',
    brand: 'Aster Lane',
    format: 'Vape',
    subcategory: '510-thread cartridge',
    size: '1 g',
    priceCents: 4200,
    description: 'A ceramic-cartridge format with apricot, citrus, and light botanical notes.',
    potency: 'THC 82.0%',
    flavorNotes: ['Apricot', 'Citrus', 'Botanicals'],
    imageTone: '#F09D68',
    art: { texture: 'ripple', label: 'clear', accent: '#FFD1B5' },
    availabilityByStore: {
      'hayward-central': 'in-stock',
      'hayward-south': 'low-stock',
    },
    pickupEligible: true,
    featured: true,
  },
  {
    id: 'orbit-supply-night-loop-vape',
    name: 'Night Loop',
    brand: 'Orbit Supply',
    format: 'Vape',
    subcategory: 'All-in-one vape',
    size: '0.5 g',
    priceCents: 2800,
    description: 'A compact all-in-one vape with blackberry, tea leaf, and peppery aromatic notes.',
    potency: 'THC 78.5%',
    flavorNotes: ['Blackberry', 'Tea leaf', 'Black pepper'],
    imageTone: '#44556F',
    art: { texture: 'grid', label: 'foil', accent: '#B7D6EC' },
    availabilityByStore: {
      'hayward-central': 'unavailable',
      'hayward-south': 'in-stock',
    },
    pickupEligible: true,
    featured: false,
  },
  {
    id: 'mallow-house-tangerine-sea-salt-edible',
    name: 'Tangerine Sea Salt Chews',
    brand: 'Mallow House',
    format: 'Edible',
    subcategory: 'Fruit chews',
    size: '10 chews · 100 mg THC total',
    priceCents: 2000,
    description: 'Soft fruit chews with a tangerine-forward flavor and a small hit of sea salt.',
    potency: '10 mg THC per chew',
    flavorNotes: ['Tangerine', 'Sea salt', 'Sugar'],
    imageTone: '#E9784B',
    art: { texture: 'rays', label: 'ink', accent: '#FFD3BA' },
    availabilityByStore: {
      'hayward-central': 'in-stock',
      'hayward-south': 'in-stock',
    },
    pickupEligible: true,
    featured: true,
  },
  {
    id: 'nook-grove-dark-fig-chocolate-edible',
    name: 'Dark Fig Chocolate Squares',
    brand: 'Nook & Grove',
    format: 'Edible',
    subcategory: 'Chocolate squares',
    size: '10 squares · 100 mg THC total',
    priceCents: 2200,
    description: 'Bittersweet dark chocolate squares with fig, vanilla, and a faint roasted-nut note.',
    potency: '10 mg THC per square',
    flavorNotes: ['Dark chocolate', 'Fig', 'Vanilla'],
    imageTone: '#765143',
    art: { texture: 'grain', label: 'foil', accent: '#E8C5AB' },
    availabilityByStore: {
      'hayward-central': 'low-stock',
      'hayward-south': 'in-stock',
    },
    pickupEligible: true,
    featured: false,
  },
  {
    id: 'cairn-extracts-amber-window-rosin',
    name: 'Amber Window Rosin',
    brand: 'Cairn Extracts',
    format: 'Concentrate',
    subcategory: 'Cold-cured rosin',
    size: '1 g',
    priceCents: 5400,
    description: 'A cold-cured rosin with a glossy texture and a citrus, pine, and fresh-cream aroma.',
    potency: 'THC 74.2%',
    flavorNotes: ['Meyer lemon', 'Pine', 'Fresh cream'],
    imageTone: '#D5A13C',
    art: { texture: 'rays', label: 'clear', accent: '#FFE7A6' },
    availabilityByStore: {
      'hayward-central': 'in-stock',
      'hayward-south': 'low-stock',
    },
    pickupEligible: true,
    featured: true,
  },
  {
    id: 'field-manual-cedar-haze-badder',
    name: 'Cedar Haze Badder',
    brand: 'Field Manual',
    format: 'Concentrate',
    subcategory: 'Whipped badder',
    size: '1 g',
    priceCents: 3800,
    description: 'A whipped concentrate with cedar, grapefruit, and a lightly peppered finish.',
    potency: 'THC 76.8%',
    flavorNotes: ['Cedar', 'Grapefruit', 'Pepper'],
    imageTone: '#B68158',
    art: { texture: 'ripple', label: 'ink', accent: '#F0C7AA' },
    availabilityByStore: {
      'hayward-central': 'unavailable',
      'hayward-south': 'in-stock',
    },
    pickupEligible: true,
    featured: false,
  },
  {
    id: 'studio-day-citrus-balance-mints-wellness',
    name: 'Citrus Balance Mints',
    brand: 'Studio Day',
    format: 'Wellness',
    subcategory: 'Measured mints',
    size: '20 mints',
    priceCents: 2400,
    description: 'Small citrus mints in a measured 1:1 THC-to-CBD format for shoppers who prefer a mint.',
    potency: '2 mg THC + 2 mg CBD per mint',
    flavorNotes: ['Lemon', 'Spearmint', 'Sugar'],
    imageTone: '#83B68F',
    art: { texture: 'grid', label: 'clear', accent: '#D6F1C9' },
    availabilityByStore: {
      'hayward-central': 'in-stock',
      'hayward-south': 'low-stock',
    },
    pickupEligible: true,
    featured: false,
  },
  {
    id: 'low-tide-plain-balance-drops-wellness',
    name: 'Plain Balance Drops',
    brand: 'Low Tide',
    format: 'Wellness',
    subcategory: 'Measured dropper',
    size: '30 ml',
    priceCents: 3000,
    description: 'An unflavored, measured dropper format with equal parts THC and CBD per labeled serving.',
    potency: '2.5 mg THC + 2.5 mg CBD per dropper',
    flavorNotes: ['Unflavored', 'Neutral', 'Clean finish'],
    imageTone: '#6B9CAD',
    art: { texture: 'ripple', label: 'foil', accent: '#C6ECF5' },
    availabilityByStore: {
      'hayward-central': 'low-stock',
      'hayward-south': 'unavailable',
    },
    pickupEligible: true,
    featured: false,
  },
]

export const catalogDisclaimer =
  'Independent concept using fictional store, product, and inventory data. Availability is a demo only.'
