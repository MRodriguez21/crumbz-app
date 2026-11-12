// places: Google Places (New) lookups for the place search screen.
//
//   POST { action: 'search', input, sessionToken, cityId?, lat?, lng? }
//     -> { suggestions: [{ googlePlaceId, name, secondary, existing?: { slug } }] }
//   POST { action: 'import', googlePlaceId, sessionToken, cityId }
//     -> { slug, created }
//
// The Google key never leaves the server. Without GOOGLE_PLACES_API_KEY every call
// answers 503 { error: 'google_not_configured' } and the app hides the Google results,
// so the catalog and manual creation keep working.
//
// Google terms: we store only the place ID long term; coordinates are refreshed within
// 30 days (location_fetched_at), and the name shown is confirmed by the user.

import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@4';

const GOOGLE_KEY = Deno.env.get('GOOGLE_PLACES_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const PUBLISHABLE_KEY = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') ?? '{}').default;
const SECRET_KEY = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? '{}').default;

const CARACAS = { latitude: 10.4806, longitude: -66.9036 };
// Places API (New) allows up to 5 included primary types.
const FOOD_TYPES = ['restaurant', 'cafe', 'bar', 'bakery', 'meal_takeaway'];

const searchBody = z.object({
  action: z.literal('search'),
  input: z.string().trim().min(2).max(100),
  sessionToken: z.string().uuid(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
});

const importBody = z.object({
  action: z.literal('import'),
  googlePlaceId: z.string().min(1).max(300),
  sessionToken: z.string().uuid(),
  cityId: z.number().int().positive(),
});

const body = z.discriminatedUnion('action', [searchBody, importBody]);

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { ...cors, 'Content-Type': 'application/json' },
  });

// TODO(scale): per-user rate limit. Until then, cap the daily quota in Google Cloud.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'method_not_allowed' }, 405);

  // verify_jwt is off (new API keys); authorize the user here.
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return json({ error: 'unauthorized' }, 401);
  const userClient = createClient(SUPABASE_URL, PUBLISHABLE_KEY, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: auth, error: authError } = await userClient.auth.getUser(token);
  if (authError || !auth.user) return json({ error: 'unauthorized' }, 401);

  const parsed = body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return json({ error: 'invalid_request' }, 400);

  if (!GOOGLE_KEY) return json({ error: 'google_not_configured' }, 503);

  try {
    if (parsed.data.action === 'search') {
      return json(await search(parsed.data, userClient));
    }
    return json(await importPlace(parsed.data, auth.user.id));
  } catch (e) {
    console.error('places error', e instanceof Error ? e.message : e);
    return json({ error: 'google_failed' }, 502);
  }
});

async function google(path: string, init: RequestInit & { fieldMask?: string }) {
  const res = await fetch(`https://places.googleapis.com/v1/${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_KEY!,
      ...(init.fieldMask && { 'X-Goog-FieldMask': init.fieldMask }),
    },
  });
  if (!res.ok) throw new Error(`google ${res.status}: ${await res.text()}`);
  return res.json();
}

type Prediction = {
  placeId: string;
  structuredFormat?: { mainText?: { text: string }; secondaryText?: { text: string } };
  text?: { text: string };
};

async function search(
  { input, sessionToken, lat, lng }: z.infer<typeof searchBody>,
  userClient: ReturnType<typeof createClient>,
) {
  const center =
    lat !== undefined && lng !== undefined ? { latitude: lat, longitude: lng } : CARACAS;
  const data = await google('places:autocomplete', {
    method: 'POST',
    body: JSON.stringify({
      input,
      sessionToken,
      languageCode: 'es',
      includedRegionCodes: ['ve'],
      includedPrimaryTypes: FOOD_TYPES,
      locationBias: { circle: { center, radius: 30000 } },
    }),
  });

  const predictions: Prediction[] = (data.suggestions ?? [])
    .map((s: { placePrediction?: Prediction }) => s.placePrediction)
    .filter(Boolean);

  // Flag the ones already in our catalog so the app opens them instead of importing.
  const ids = predictions.map((p) => p.placeId);
  const { data: existing, error: existingError } = ids.length
    ? await userClient.from('places').select('slug, google_place_id').in('google_place_id', ids)
    : { data: [], error: null };
  // Not fatal: import is idempotent, so an unflagged place still resolves to the same row.
  if (existingError) console.error('places existing lookup failed', existingError.message);
  const bySlug = new Map((existing ?? []).map((r) => [r.google_place_id, r.slug]));

  return {
    suggestions: predictions.map((p) => ({
      googlePlaceId: p.placeId,
      name: p.structuredFormat?.mainText?.text ?? p.text?.text ?? '',
      secondary: p.structuredFormat?.secondaryText?.text ?? null,
      existing: bySlug.has(p.placeId) ? { slug: bySlug.get(p.placeId) } : null,
    })),
  };
}

const KIND_BY_TYPE: Record<string, string> = {
  cafe: 'cafe',
  coffee_shop: 'cafe',
  bar: 'bar',
  pub: 'bar',
  wine_bar: 'bar',
  bakery: 'bakery',
};

async function importPlace(
  { googlePlaceId, sessionToken, cityId }: z.infer<typeof importBody>,
  userId: string,
) {
  // Ends the autocomplete session (billed as one session).
  const place = await google(
    `places/${encodeURIComponent(googlePlaceId)}?sessionToken=${sessionToken}&languageCode=es`,
    { method: 'GET', fieldMask: 'id,displayName,location,formattedAddress,primaryType' },
  );
  if (!place.location) throw new Error('place without location');

  const admin = createClient(SUPABASE_URL, SECRET_KEY, { auth: { persistSession: false } });
  const { data, error } = await admin
    .rpc('import_google_place', {
      p_user_id: userId,
      p_google_place_id: place.id,
      p_name: place.displayName?.text ?? 'Lugar sin nombre',
      p_lat: place.location.latitude,
      p_lng: place.location.longitude,
      p_address: place.formattedAddress ?? null,
      p_city_id: cityId,
      p_kind: KIND_BY_TYPE[place.primaryType] ?? 'restaurant',
    })
    .single();
  if (error) throw error;
  return { slug: data.slug, created: data.created };
}
