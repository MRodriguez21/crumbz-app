import type { PlaceCreateInput } from '@crumbz/shared';
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { FunctionsHttpError } from '@supabase/supabase-js';

import { useCities, useMyProfile } from '@/features/profile/queries';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { supabase } from '@/lib/supabase';

export const placeKeys = {
  tags: ['tags'] as const,
  areas: (cityId: number | null) => ['areas', cityId] as const,
  search: (q: string, cityId: number | null) => ['places', 'search', cityId, q] as const,
  google: (q: string) => ['places', 'google', q] as const,
  detail: (slug: string) => ['places', 'detail', slug] as const,
};

const MIN_QUERY = 2;
const normalize = (q: string) => q.trim().replace(/\s+/g, ' ');

/** City for new places and searches: the user's home city, else the only launch city. */
export function useCurrentCityId(): number | null {
  const { data: profile } = useMyProfile();
  const { data: cities } = useCities();
  return profile?.home_city_id ?? cities?.[0]?.id ?? null;
}

export function useTags() {
  return useQuery({
    queryKey: placeKeys.tags,
    staleTime: 24 * 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase.from('tags').select('id, name, slug').order('name');
      if (error) throw error;
      return data;
    },
  });
}

export function useAreas(cityId: number | null) {
  return useQuery({
    queryKey: placeKeys.areas(cityId),
    enabled: cityId != null,
    staleTime: 24 * 60 * 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('areas')
        .select('id, name, slug')
        .eq('city_id', cityId!)
        .order('name');
      if (error) throw error;
      return data;
    },
  });
}

/** Typo- and accent-tolerant search in our own catalog (search_places RPC). */
export function useSearchPlaces(input: string, cityId: number | null, delayMs = 300) {
  const q = useDebouncedValue(normalize(input), delayMs);
  const enabled = cityId != null && q.length >= MIN_QUERY;
  const query = useQuery({
    queryKey: placeKeys.search(q, cityId),
    enabled,
    staleTime: 30_000,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase.rpc('search_places', {
        q,
        p_city_id: cityId!,
        max_results: 20,
      });
      if (error) throw error;
      return data;
    },
  });
  return { ...query, query: q, enabled, settling: normalize(input) !== q };
}

export type GoogleSuggestion = {
  googlePlaceId: string;
  name: string;
  secondary: string | null;
  existing: { slug: string } | null;
};

type GoogleSearchResult =
  | { available: true; suggestions: GoogleSuggestion[] }
  /** The server has no Google key yet: hide the section, don't show an error. */
  | { available: false };

const isNotConfigured = async (error: unknown) => {
  if (!(error instanceof FunctionsHttpError)) return false;
  const res = error.context as Response;
  if (res.status !== 503) return false;
  const body = await res.json().catch(() => null);
  return body?.error === 'google_not_configured';
};

/** Google Places suggestions through the `places` Edge Function. */
export function useGoogleSearch(
  input: string,
  sessionToken: string,
  location: { lat: number; lng: number } | null,
) {
  const q = useDebouncedValue(normalize(input), 400);
  return useQuery<GoogleSearchResult>({
    queryKey: placeKeys.google(q),
    enabled: q.length >= MIN_QUERY,
    staleTime: 5 * 60_000,
    retry: false,
    placeholderData: keepPreviousData,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('places', {
        body: { action: 'search', input: q, sessionToken, ...location },
      });
      if (error) {
        if (await isNotConfigured(error)) return { available: false };
        throw error;
      }
      return { available: true, suggestions: data.suggestions as GoogleSuggestion[] };
    },
  });
}

export function useImportGooglePlace() {
  return useMutation({
    mutationFn: async (input: { googlePlaceId: string; sessionToken: string; cityId: number }) => {
      const { data, error } = await supabase.functions.invoke('places', {
        body: { action: 'import', ...input },
      });
      if (error) throw new Error('No pudimos traer este lugar de Google. Inténtalo de nuevo.');
      return data as { slug: string; created: boolean };
    },
  });
}

export function useCreatePlace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (p: PlaceCreateInput) => {
      const { data, error } = await supabase
        .rpc('create_place', {
          p_name: p.name,
          p_kind: p.kind,
          p_service_modes: p.serviceModes,
          p_city_id: p.cityId,
          p_area_id: p.areaId ?? undefined,
          p_lat: p.location?.lat,
          p_lng: p.location?.lng,
          p_address: p.address,
          p_instagram: p.instagram,
          p_whatsapp: p.whatsapp,
          p_payment_methods: p.paymentMethods,
          p_has_generator: p.hasGenerator ?? undefined,
          p_has_parking: p.hasParking ?? undefined,
          p_tag_ids: p.tagIds,
          p_service_area_ids: p.serviceAreaIds,
        })
        .single();
      if (error) throw new Error('No pudimos crear el lugar. Inténtalo de nuevo.');
      return data;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['places', 'search'] }),
  });
}

// places reaches areas twice (area_id and place_service_areas): name the FK explicitly.
const PLACE_SELECT = `
  id, slug, name, kind, service_modes, address, whatsapp, instagram, posts_count,
  city:cities(name, slug),
  area:areas!places_area_id_fkey(name),
  tags:place_tags(tag:tags(name, slug)),
  service_areas:place_service_areas(area:areas(name))
`;

export function usePlace(slug: string | undefined) {
  return useQuery({
    queryKey: placeKeys.detail(slug ?? ''),
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('places')
        .select(PLACE_SELECT)
        .eq('slug', slug!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export type PlaceDetail = NonNullable<ReturnType<typeof usePlace>['data']>;
