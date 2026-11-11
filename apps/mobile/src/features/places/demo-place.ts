import type { PlaceProfile } from './types';

/**
 * SYNTHETIC demo data for the design-system anchor screen (phase 0.5).
 * Not a real place; handles are obviously fictional. The screen labels it on-screen.
 * TODO(phase-4): replace with usePlace(slug) from Supabase.
 */
export const DEMO_PLACE_SLUG = 'smash-club-demo';

// Non-breaking separators keep "A · B" pairs together when text wraps.
const SEP = ' · ';

export const demoPlace: PlaceProfile = {
  slug: DEMO_PLACE_SLUG,
  name: 'Smash Club',
  category: 'Hamburguesas',
  area: 'Las Mercedes',
  distance: '1,2 km',
  rank: { position: 3, tag: 'Hamburguesas', city: 'Caracas' },
  score: {
    value: 8.6,
    raters: 47,
    distribution: [
      { label: '9–10', count: 27 },
      { label: '7–8', count: 14 },
      { label: '1–6', count: 6 },
    ],
  },
  photos: [
    { id: 'p1', author: '@ejemplo.ana' },
    { id: 'p2', author: '@ejemplo.luis' },
    { id: 'p3', author: '@ejemplo.vale' },
    { id: 'p4', author: '@ejemplo.jose' },
  ],
  facts: [
    {
      id: 'spend',
      claim: '$12 – $18',
      detail: 'por persona',
      status: 'confirmed',
      basis: 'average',
      visits: 39,
      evidence: [
        { id: 'e1', author: '@ejemplo.ana', when: 'hace 2 días', value: '$15' },
        { id: 'e2', author: '@ejemplo.jose', when: 'hace 5 días', value: '$13' },
      ],
    },
    {
      id: 'generator',
      claim: 'Tiene planta',
      detail: 'planta eléctrica',
      status: 'confirmed',
      basis: 'confirmed',
      visits: 12,
      evidence: [
        { id: 'e3', author: '@ejemplo.luis', when: 'hace 3 días' },
        { id: 'e4', author: '@ejemplo.vale', when: 'hace 1 semana' },
      ],
    },
    {
      id: 'payments',
      claim: `Pago Móvil${SEP}Zelle${SEP}$`,
      detail: 'y punto de venta',
      status: 'confirmed',
      basis: 'reported',
      visits: 21,
      evidence: [
        { id: 'e5', author: '@ejemplo.vale', when: 'ayer', value: 'Pago Móvil' },
        { id: 'e6', author: '@ejemplo.ana', when: 'hace 2 días', value: 'Zelle' },
      ],
    },
    {
      id: 'parking',
      claim: 'Estacionamiento vigilado',
      status: 'unconfirmed',
    },
    {
      id: 'delivery',
      claim: 'Delivery a 3 zonas',
      detail: 'Las Mercedes, Chacao, Altamira',
      status: 'unknown',
    },
  ],
  whatsapp: '+584120000000',
};

export function getDemoPlace(slug: string): PlaceProfile | null {
  return slug === DEMO_PLACE_SLUG ? demoPlace : null;
}
