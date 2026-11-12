import {
  PLACE_KIND_LABELS,
  PLACE_KINDS,
  PLACE_NAME_MAX,
  PLACE_TAGS_MAX,
  SERVICE_MODE_LABELS,
  SERVICE_MODES,
  placeCreateSchema,
  type PlaceKind,
  type ServiceMode,
} from '@crumbz/shared';
import { router } from 'expo-router';
import { Check, LocateFixed } from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Linking, Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceList } from '@/components/choice-list';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { radius, space, touchTarget, useColors } from '@/theme';

import { getCurrentLocation, type Coords } from '../location';
import { useAreas, useCreatePlace, useSearchPlaces, useTags } from '../queries';
import { PlaceRow } from './place-row';

type Props = {
  initialName: string;
  cityId: number;
  /** Scrolls the screen so `y` (relative to the form's top) is in view. */
  onScrollTo?: (y: number) => void;
};

type Field =
  | 'name'
  | 'kind'
  | 'tagIds'
  | 'serviceModes'
  | 'location'
  | 'serviceAreaIds'
  | 'whatsapp'
  | 'instagram';

/** A likely duplicate scores at least this in search_places (0–1). */
const DUPLICATE_SCORE = 0.5;

/** Top-to-bottom order of the fields, for scrolling to the first error. */
const FIELD_ORDER: Field[] = [
  'name',
  'kind',
  'tagIds',
  'serviceModes',
  'location',
  'serviceAreaIds',
  'whatsapp',
  'instagram',
];

/** Choice value for "no area" (area ids are positive). */
const NO_AREA = 0;

/**
 * Manual place creation, one page in three blocks. Practical facts (payments, generator,
 * parking) are not asked here: visits confirm them (phase 3).
 */
export function PlaceForm({ initialName, cityId, onScrollTo }: Props) {
  const c = useColors();
  const tags = useTags();
  const areas = useAreas(cityId);
  const create = useCreatePlace();

  const [name, setName] = useState(initialName);
  const [kind, setKind] = useState<PlaceKind | null>(null);
  const [tagIds, setTagIds] = useState<number[]>([]);
  const [serviceModes, setServiceModes] = useState<ServiceMode[]>([]);
  const [location, setLocation] = useState<Coords | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationIssue, setLocationIssue] = useState<{ message: string; settings?: boolean }>();
  const [areaId, setAreaId] = useState<number | null>(null);
  const [serviceAreaIds, setServiceAreaIds] = useState<number[]>([]);
  const [whatsapp, setWhatsapp] = useState('');
  const [instagram, setInstagram] = useState('');
  const [touched, setTouched] = useState<Partial<Record<Field, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string>();

  // Field tops relative to the form, to bring the first invalid one into view on submit.
  const fieldY = useRef<Partial<Record<Field, number>>>({});
  const sectionY = useRef<Record<string, number>>({});
  const track = (f: Field, section: string) => ({
    onLayout: (e: { nativeEvent: { layout: { y: number } } }) => {
      fieldY.current[f] = (sectionY.current[section] ?? 0) + e.nativeEvent.layout.y;
    },
  });

  const deliveryOnly = kind === 'delivery_only';
  const dineIn = serviceModes.includes('dine_in');
  const delivery = serviceModes.includes('delivery');

  const parsed = placeCreateSchema.safeParse({
    name,
    kind,
    serviceModes,
    cityId,
    areaId: dineIn ? areaId : null,
    location: dineIn && location ? { lat: location.lat, lng: location.lng } : null,
    instagram,
    whatsapp,
    paymentMethods: [],
    hasGenerator: null,
    hasParking: null,
    tagIds,
    serviceAreaIds: delivery ? serviceAreaIds : [],
  });
  const issues = new Map<string, string>();
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      const key = String(i.path[0]);
      if (!issues.has(key)) issues.set(key, i.message);
    }
  }
  const errorFor = (f: Field) => (submitted || touched[f] ? issues.get(f) : undefined);
  const touch = (f: Field) => setTouched((t) => ({ ...t, [f]: true }));

  // Non-blocking duplicate hint while typing the name.
  const similar = useSearchPlaces(name, cityId, 500);
  const duplicates = (similar.data ?? [])
    .filter((p) => p.match_score >= DUPLICATE_SCORE)
    .slice(0, 3);

  const chooseKind = (k: PlaceKind) => {
    setKind(k);
    touch('kind');
    if (k === 'delivery_only') setServiceModes((m) => m.filter((x) => x !== 'dine_in'));
  };

  const locate = async () => {
    setLocating(true);
    setLocationIssue(undefined);
    const result = await getCurrentLocation();
    setLocating(false);
    if (result.ok) setLocation(result.coords);
    else setLocationIssue({ message: result.message, settings: result.canOpenSettings });
  };

  const submit = async () => {
    setSubmitted(true);
    setServerError(undefined);
    if (!parsed.success) {
      const first = FIELD_ORDER.find((f) => issues.has(f));
      if (first) {
        onScrollTo?.(Math.max(0, (fieldY.current[first] ?? 0) - space.lg));
        AccessibilityInfo.announceForAccessibility(issues.get(first)!);
      }
      return;
    }
    try {
      const place = await create.mutateAsync(parsed.data);
      router.replace(`/place/${place.slug}`);
    } catch (e) {
      setServerError(e instanceof Error ? e.message : 'No pudimos crear el lugar.');
    }
  };

  const locationError = errorFor('location');
  // Derived, so it disappears as soon as the marked fields are fixed.
  const invalidCount = FIELD_ORDER.filter((f) => issues.has(f)).length;
  const formError =
    serverError ??
    (submitted && invalidCount > 0
      ? invalidCount === 1
        ? 'Revisa el campo marcado.'
        : `Revisa los ${invalidCount} campos marcados.`
      : undefined);

  return (
    <View style={styles.form}>
      <Text variant="headline" accessibilityRole="header">
        Nuevo lugar
      </Text>
      <Section title="El lugar" onLayoutY={(y) => (sectionY.current['place'] = y)}>
        <View style={styles.field} {...track('name', 'place')}>
          <TextField
            label="Nombre"
            value={name}
            onChangeText={setName}
            onBlur={() => touch('name')}
            autoCapitalize="words"
            maxLength={PLACE_NAME_MAX}
            placeholder="Ej. Tortas de Ana"
            error={errorFor('name')}
          />
          {duplicates.length > 0 ? (
            <View style={styles.duplicates} accessibilityLiveRegion="polite">
              <Text variant="bodySmall" tone="textMuted">
                ¿Es alguno de estos? Ya están en crumbz.
              </Text>
              <View>
                {duplicates.map((p, i) => (
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
            </View>
          ) : null}
        </View>

        <View {...track('kind', 'place')}>
          <ChoiceList
            label="Tipo"
            value={kind}
            onChange={chooseKind}
            choices={PLACE_KINDS.map((k) => ({ value: k, label: PLACE_KIND_LABELS[k] }))}
            error={errorFor('kind')}
          />
        </View>

        <View {...track('tagIds', 'place')}>
          <ChoiceList
            multiple
            label="Categorías"
            counter={`${tagIds.length} de ${PLACE_TAGS_MAX}`}
            max={PLACE_TAGS_MAX}
            value={tagIds}
            onChange={(ids) => {
              setTagIds(ids);
              touch('tagIds');
            }}
            choices={(tags.data ?? []).map((t) => ({ value: t.id, label: t.name }))}
            helper={tags.isError ? 'No pudimos cargar las categorías.' : 'Elige hasta tres.'}
            error={errorFor('tagIds')}
          />
        </View>
      </Section>

      <Section title="Cómo atiende" onLayoutY={(y) => (sectionY.current['modes'] = y)} ruled>
        <View {...track('serviceModes', 'modes')}>
          <ChoiceList
            multiple
            label="Formas de atender"
            value={serviceModes}
            onChange={(modes) => {
              setServiceModes(modes);
              touch('serviceModes');
            }}
            choices={SERVICE_MODES.map((m) => ({
              value: m,
              label: SERVICE_MODE_LABELS[m],
              disabled: m === 'dine_in' && deliveryOnly,
              description:
                m === 'dine_in' && deliveryOnly ? 'No aplica: no tiene local.' : undefined,
            }))}
            error={errorFor('serviceModes')}
          />
        </View>

        {dineIn ? (
          <View style={styles.field} {...track('location', 'modes')}>
            <Text variant="labelStrong">Ubicación del local</Text>
            {location ? (
              <View style={[styles.located, { borderColor: c.line }]}>
                <Check size={20} color={c.proof} strokeWidth={2} />
                <View style={styles.locatedText}>
                  <Text variant="body">Ubicación guardada</Text>
                  {location.accuracy != null ? (
                    <Text variant="label" tone="textMuted" tabular>
                      {`Precisión de ${Math.round(location.accuracy)} m`}
                    </Text>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  onPress={locate}
                  style={({ pressed }) => [
                    styles.textButton,
                    pressed && { backgroundColor: c.pressed },
                  ]}
                >
                  <Text variant="body">Actualizar ubicación</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.row}>
                <Button
                  label="Usar mi ubicación actual"
                  icon={LocateFixed}
                  variant="outline"
                  loading={locating}
                  onPress={locate}
                />
              </View>
            )}
            {locationIssue ? (
              <View>
                <Text variant="label" tone="danger" accessibilityLiveRegion="polite">
                  {locationIssue.message}
                </Text>
                {locationIssue.settings ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={() => Linking.openSettings()}
                    style={styles.inlineButton}
                  >
                    <Text variant="label" style={styles.underline}>
                      Abrir ajustes
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            ) : locationError && !location ? (
              <Text variant="label" tone="danger">
                {locationError}
              </Text>
            ) : location ? null : (
              <Text variant="label" tone="textMuted">
                Hazlo cuando estés en el lugar.
              </Text>
            )}
          </View>
        ) : null}

        {dineIn ? (
          <ChoiceList
            label="Zona"
            value={areaId ?? NO_AREA}
            onChange={(id) => setAreaId(id === NO_AREA ? null : id)}
            choices={[
              { value: NO_AREA, label: 'Sin zona' },
              ...(areas.data ?? []).map((a) => ({ value: a.id, label: a.name })),
            ]}
          />
        ) : null}

        {delivery ? (
          <View {...track('serviceAreaIds', 'modes')}>
            <ChoiceList
              multiple
              label="Zonas de delivery"
              value={serviceAreaIds}
              onChange={(ids) => {
                setServiceAreaIds(ids);
                touch('serviceAreaIds');
              }}
              choices={(areas.data ?? []).map((a) => ({ value: a.id, label: a.name }))}
              error={errorFor('serviceAreaIds')}
            />
          </View>
        ) : null}
      </Section>

      <Section title="Contacto" onLayoutY={(y) => (sectionY.current['contact'] = y)} ruled>
        <View {...track('whatsapp', 'contact')}>
          <TextField
            label="WhatsApp"
            value={whatsapp}
            onChangeText={setWhatsapp}
            onBlur={() => touch('whatsapp')}
            keyboardType="phone-pad"
            autoComplete="tel"
            textContentType="telephoneNumber"
            placeholder="0412 123 4567"
            helper={
              dineIn
                ? 'Opcional.'
                : 'Sin local, agrega WhatsApp o Instagram para que puedan pedirle.'
            }
            error={errorFor('whatsapp')}
          />
        </View>
        <View {...track('instagram', 'contact')}>
          <TextField
            label="Instagram"
            value={instagram}
            onChangeText={setInstagram}
            onBlur={() => touch('instagram')}
            autoCapitalize="none"
            autoCorrect={false}
            placeholder="@usuario"
            error={errorFor('instagram')}
          />
        </View>
      </Section>

      {formError ? (
        <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="assertive">
          {formError}
        </Text>
      ) : null}

      <View style={styles.row}>
        <Button label="Crear lugar" variant="inverse" onPress={submit} loading={create.isPending} />
      </View>
    </View>
  );
}

function Section({
  title,
  onLayoutY,
  ruled,
  children,
}: {
  title: string;
  /** Reports the section's top so fields can be located inside the form. */
  onLayoutY: (y: number) => void;
  ruled?: boolean;
  children: ReactNode;
}) {
  const c = useColors();
  return (
    <View
      onLayout={(e) => onLayoutY(e.nativeEvent.layout.y)}
      style={[styles.section, ruled && [styles.ruled, { borderTopColor: c.line }]]}
    >
      <Text variant="title" accessibilityRole="header">
        {title}
      </Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl },
  section: { gap: space.lg },
  ruled: { borderTopWidth: 1, paddingTop: space.xl },
  field: { gap: space.xs },
  row: { flexDirection: 'row' },
  duplicates: { gap: space.xs, paddingTop: space.xs },
  located: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    minHeight: touchTarget,
  },
  locatedText: { flex: 1, gap: space.xxs, paddingVertical: space.sm },
  textButton: {
    minHeight: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
  inlineButton: { minHeight: touchTarget, justifyContent: 'center', alignSelf: 'flex-start' },
  underline: { textDecorationLine: 'underline' },
});
