import { fontFamily, typography } from '@crumbz/ui';
import { randomUUID } from 'expo-crypto';
import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, Plus, Search, X } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { PlaceRow } from '@/features/places/components/place-row';
import {
  useCurrentCityId,
  useGoogleSearch,
  useImportGooglePlace,
  useSearchPlaces,
} from '@/features/places/queries';
import { radius, space, touchTarget, useColors } from '@/theme';

const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;

/**
 * Find a place before creating one: our catalog first, Google below (only when the
 * server has a Google key), and always a way to create it by hand.
 * TODO(phase-4): track search_performed; bias Google results to the user's location.
 */
export default function SearchPlaceScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const cityId = useCurrentCityId();
  const [input, setInput] = useState('');
  // One Google billing session per search-then-pick.
  const [sessionToken, setSessionToken] = useState(() => randomUUID());

  const catalog = useSearchPlaces(input, cityId);
  const google = useGoogleSearch(input, sessionToken, null);
  const importPlace = useImportGooglePlace();
  const [importingId, setImportingId] = useState<string>();
  const [importError, setImportError] = useState<string>();

  const q = catalog.query;
  const searching = q.length >= 2;
  const places = searching ? (catalog.data ?? []) : [];
  const catalogPending = searching && (catalog.isPending || catalog.settling);
  const googleSuggestions = google.data?.available ? google.data.suggestions : [];

  const openGoogle = async (googlePlaceId: string, existingSlug?: string) => {
    if (existingSlug) return router.push(`/place/${existingSlug}`);
    if (cityId == null) return;
    setImportingId(googlePlaceId);
    setImportError(undefined);
    try {
      const { slug } = await importPlace.mutateAsync({ googlePlaceId, sessionToken, cityId });
      setSessionToken(randomUUID());
      router.push(`/place/${slug}`);
    } catch (e) {
      setImportError(e instanceof Error ? e.message : undefined);
    } finally {
      setImportingId(undefined);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.appBar}>
        <IconButton icon={BackIcon} accessibilityLabel="Volver" onPress={() => router.back()} />
        <View style={[styles.search, { backgroundColor: c.surfaceRaised, borderColor: c.line }]}>
          <Search size={20} color={c.textMuted} strokeWidth={2} />
          <TextInput
            value={input}
            onChangeText={setInput}
            autoFocus
            autoCorrect={false}
            // Keep the OS autofill bubble from covering the results.
            autoComplete="off"
            importantForAutofill="no"
            returnKeyType="search"
            placeholder="Busca un lugar"
            placeholderTextColor={c.textMuted}
            selectionColor={c.text}
            accessibilityLabel="Busca un lugar"
            style={[styles.searchInput, { color: c.text }]}
          />
          {input ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Borrar búsqueda"
              onPress={() => setInput('')}
              style={styles.clear}
            >
              <X size={18} color={c.textMuted} strokeWidth={2} />
            </Pressable>
          ) : null}
        </View>
      </View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
      >
        {!searching ? (
          <Text variant="bodySmall" tone="textMuted">
            Escribe el nombre del lugar. Primero buscamos en crumbz.
          </Text>
        ) : (
          <View style={styles.section}>
            <Text variant="labelStrong" accessibilityRole="header">
              En crumbz
            </Text>
            {catalog.isError ? (
              <Text variant="bodySmall" tone="danger">
                No pudimos buscar ahora. Revisa tu conexión.
              </Text>
            ) : places.length > 0 ? (
              <View accessibilityLiveRegion="polite">
                {places.map((p, i) => (
                  <PlaceRow
                    key={p.id}
                    first={i === 0}
                    name={p.name}
                    kind={p.kind}
                    serviceModes={p.service_modes}
                    areaName={p.area_name}
                    onPress={() => router.push(`/place/${p.slug}`)}
                  />
                ))}
              </View>
            ) : catalogPending ? (
              <Text variant="bodySmall" tone="textMuted">
                Buscando…
              </Text>
            ) : (
              <Text variant="bodySmall" tone="textMuted" accessibilityLiveRegion="polite">
                {`No encontramos «${q}» en crumbz.`}
              </Text>
            )}
          </View>
        )}

        {searching && googleSuggestions.length > 0 ? (
          <View style={styles.section}>
            <Text variant="labelStrong" accessibilityRole="header">
              En Google
            </Text>
            <View>
              {googleSuggestions.map((s, i) => (
                <PlaceRow
                  key={s.googlePlaceId}
                  first={i === 0}
                  name={s.name}
                  secondary={s.secondary}
                  busy={importingId === s.googlePlaceId}
                  disabled={!!importingId && importingId !== s.googlePlaceId}
                  onPress={() => openGoogle(s.googlePlaceId, s.existing?.slug)}
                />
              ))}
            </View>
            {importError ? (
              <Text variant="label" tone="danger" accessibilityLiveRegion="polite">
                {importError}
              </Text>
            ) : null}
          </View>
        ) : searching && google.isError ? (
          <Text variant="label" tone="textMuted">
            No pudimos buscar en Google ahora.
          </Text>
        ) : null}

        <Pressable
          accessibilityRole="button"
          onPress={() =>
            router.push({ pathname: '/add-place/new', params: { name: input.trim() } })
          }
          android_ripple={{ color: c.pressed }}
          style={({ pressed }) => [
            styles.create,
            { borderColor: c.line },
            pressed && { backgroundColor: c.pressed },
          ]}
        >
          <Plus size={20} color={c.text} strokeWidth={2} />
          <View style={styles.createText}>
            <Text variant="body">¿No aparece? Créalo</Text>
            <Text variant="label" tone="textMuted">
              Para emprendimientos sin local y lugares nuevos.
            </Text>
          </View>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const body = typography.body;

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingLeft: space.xs,
    paddingRight: space.lg,
    paddingBottom: space.sm,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    minHeight: touchTarget,
    borderWidth: 1,
    borderRadius: radius.md,
    paddingLeft: space.md,
  },
  searchInput: {
    flex: 1,
    minHeight: touchTarget,
    fontFamily: fontFamily.native.regular,
    fontSize: body.size,
  },
  clear: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: { paddingHorizontal: space.lg, paddingTop: space.md, gap: space.xl },
  section: { gap: space.xs },
  create: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: touchTarget + space.md,
    paddingVertical: space.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  createText: { flex: 1, gap: space.xxs },
});
