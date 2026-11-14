import {
  PAYMENT_METHOD_LABELS,
  PAYMENT_METHODS,
  POST_BODY_MAX,
  SERVICE_MODE_LABELS,
  SERVICE_MODES,
  caracasDay,
  formatVisitDay,
  parseUsd,
  postCreateSchema,
  type PaymentMethod,
  type ServiceMode,
} from '@crumbz/shared';
import { randomUUID } from 'expo-crypto';
import { useState, type ReactNode } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ChoiceList } from '@/components/choice-list';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useSession } from '@/features/auth/auth-provider';
import { space, useColors } from '@/theme';

import { deleteQueuedPhotos, preparePhotos, type PickedPhoto } from '../photos';
import { enqueueVisit } from '../queue';
import { DishPicker, type DraftDish } from './dish-picker';
import { PhotoPicker } from './photo-picker';
import { RatingPicker } from './rating-picker';

export type VisitPlace = {
  id: string;
  slug: string;
  name: string;
  serviceModes: ServiceMode[];
};

type Props = {
  place: VisitPlace;
  /** Called once the visit is safely stored on the phone (publishing continues in background). */
  onQueued: () => void;
  onScrollTo?: (y: number) => void;
};

// Body length and dish names are bounded by their inputs, so only these can fail on submit.
type Field = 'rating' | 'mode' | 'spendUsd';
const FIELD_ORDER: Field[] = ['rating', 'mode', 'spendUsd'];

/** "Otro día" offers the week before yesterday. */
const EARLIER_DAYS = [2, 3, 4, 5, 6, 7];
const TODAY = 0;
const YESTERDAY = -1;
const OTHER_DAY = 1;

type Parking = 'yes' | 'no' | 'unknown';

/**
 * Publish a visit: one page, only the score and how it went are required. Practical facts
 * (how you paid, parking) are an optional block; per the founder, no generator question.
 */
export function VisitForm({ place, onQueued, onScrollTo }: Props) {
  const c = useColors();
  const { session } = useSession();
  // One id per form: it is also the visit's id on the server, so retries never duplicate.
  const [postId] = useState(() => randomUUID());

  const offered = SERVICE_MODES.filter((m) => place.serviceModes.includes(m));
  const [rating, setRating] = useState<number | null>(null);
  const [mode, setMode] = useState<ServiceMode | null>(offered.length === 1 ? offered[0]! : null);
  const [dayChoice, setDayChoice] = useState<number>(TODAY);
  const [earlierDay, setEarlierDay] = useState<number>(EARLIER_DAYS[0]!);
  const [spend, setSpend] = useState('');
  const [dishes, setDishes] = useState<DraftDish[]>([]);
  const [photos, setPhotos] = useState<PickedPhoto[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [parking, setParking] = useState<Parking>('unknown');
  const [body, setBody] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string>();

  const visitedOn = caracasDay(
    new Date(),
    dayChoice === OTHER_DAY ? -earlierDay : dayChoice === YESTERDAY ? -1 : 0,
  );
  const spendValue = spend.trim() ? parseUsd(spend) : null;
  const spendInvalid = spend.trim() !== '' && spendValue === null;

  const parsed = postCreateSchema.safeParse({
    placeId: place.id,
    rating,
    mode,
    spendUsd: spendValue,
    visitedOn,
    body,
    paymentMethods: payments,
    hasParking: parking === 'unknown' ? null : parking === 'yes',
    dishes,
  });
  const issues = new Map<string, string>();
  if (spendInvalid) issues.set('spendUsd', 'Escribe solo el monto, por ejemplo 12,50.');
  if (!parsed.success) {
    for (const i of parsed.error.issues) {
      const key = String(i.path[0]);
      if (!issues.has(key)) issues.set(key, i.message);
    }
  }
  const errorFor = (f: Field) => (submitted ? issues.get(f) : undefined);
  const firstInvalid = FIELD_ORDER.find((f) => issues.has(f));

  // Field tops relative to the form, to bring the first error into view.
  const [fieldY] = useState(() => new Map<Field, number>());
  const track = (f: Field) => ({
    onLayout: (e: { nativeEvent: { layout: { y: number } } }) => {
      fieldY.set(f, e.nativeEvent.layout.y);
    },
  });

  const submit = async () => {
    setSubmitted(true);
    setSaveError(undefined);
    if (firstInvalid || !parsed.success || !session) {
      if (firstInvalid) {
        onScrollTo?.(Math.max(0, (fieldY.get(firstInvalid) ?? 0) - space.lg));
        AccessibilityInfo.announceForAccessibility(issues.get(firstInvalid)!);
      }
      return;
    }
    setSaving(true);
    try {
      const prepared = await preparePhotos(postId, photos);
      await enqueueVisit(postId, session.user.id, {
        post: parsed.data,
        placeName: place.name,
        placeSlug: place.slug,
        photos: prepared,
      });
      onQueued();
    } catch {
      // Leave nothing half-copied, so "Publicar" can simply be tried again.
      deleteQueuedPhotos(postId);
      setSaveError('No pudimos guardar tu visita en el teléfono. Inténtalo de nuevo.');
      setSaving(false);
    }
  };

  return (
    <View style={styles.form}>
      <View style={styles.header}>
        <Text variant="headline" accessibilityRole="header">
          Tu visita
        </Text>
        <Text variant="bodySmall" tone="textMuted">
          {place.name}
        </Text>
      </View>

      <View {...track('rating')}>
        <RatingPicker value={rating} onChange={setRating} error={errorFor('rating')} />
      </View>

      <View {...track('mode')}>
        <ChoiceList
          label="¿Cómo fue?"
          value={mode}
          onChange={setMode}
          choices={offered.map((m) => ({ value: m, label: SERVICE_MODE_LABELS[m] }))}
          error={errorFor('mode')}
        />
      </View>

      <ChoiceList
        label="¿Cuándo?"
        value={dayChoice}
        onChange={setDayChoice}
        choices={[
          { value: TODAY, label: 'Hoy' },
          { value: YESTERDAY, label: 'Ayer' },
          { value: OTHER_DAY, label: 'Otro día' },
        ]}
      />
      {dayChoice === OTHER_DAY ? (
        <ChoiceList
          label="¿Qué día?"
          value={earlierDay}
          onChange={setEarlierDay}
          choices={EARLIER_DAYS.map((d) => ({
            value: d,
            label: formatVisitDay(caracasDay(new Date(), -d)),
          }))}
        />
      ) : null}

      <View {...track('spendUsd')}>
        <TextField
          label="Gasto por persona"
          value={spend}
          onChangeText={setSpend}
          keyboardType="decimal-pad"
          placeholder="$12,50"
          helper="En dólares. Opcional."
          error={errorFor('spendUsd')}
        />
      </View>

      <Block title="Platos">
        <DishPicker placeId={place.id} value={dishes} onChange={setDishes} />
      </Block>

      <Block title="Fotos">
        <PhotoPicker value={photos} onChange={setPhotos} />
      </Block>

      <Block title="Lo práctico" note="Opcional. Ayuda a otros a saber qué esperar.">
        <ChoiceList
          multiple
          label="¿Cómo pagaste?"
          value={payments}
          onChange={setPayments}
          choices={PAYMENT_METHODS.map((p) => ({ value: p, label: PAYMENT_METHOD_LABELS[p] }))}
        />
        {mode === 'dine_in' ? (
          <ChoiceList
            label="¿Había estacionamiento?"
            value={parking}
            onChange={setParking}
            choices={[
              { value: 'yes', label: 'Sí' },
              { value: 'no', label: 'No' },
              { value: 'unknown', label: 'No me fijé' },
            ]}
          />
        ) : null}
      </Block>

      <Block title="Cuéntanos">
        <TextField
          label="Comentario"
          value={body}
          onChangeText={setBody}
          multiline
          minLines={3}
          maxLength={POST_BODY_MAX}
          counter={
            body.length > POST_BODY_MAX - 200 ? `${body.length}/${POST_BODY_MAX}` : undefined
          }
          placeholder="Qué pediste, cómo te atendieron, si volverías"
          helper="Opcional."
        />
      </Block>

      {saveError || (submitted && firstInvalid) ? (
        <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="assertive">
          {saveError ?? 'Revisa los campos marcados.'}
        </Text>
      ) : null}

      <View style={[styles.row, { borderTopColor: c.line }]}>
        <Button label="Publicar visita" variant="inverse" onPress={submit} loading={saving} />
      </View>
      <Text variant="label" tone="textMuted">
        Si no tienes conexión, la guardamos en tu teléfono y se publica sola cuando vuelva.
      </Text>
    </View>
  );
}

function Block({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  const c = useColors();
  return (
    <View style={[styles.block, { borderTopColor: c.line }]}>
      <View style={styles.blockHeader}>
        <Text variant="title" accessibilityRole="header">
          {title}
        </Text>
        {note ? (
          <Text variant="label" tone="textMuted">
            {note}
          </Text>
        ) : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl },
  header: { gap: space.xxs },
  block: { gap: space.lg, borderTopWidth: 1, paddingTop: space.xl },
  blockHeader: { gap: space.xxs },
  row: { flexDirection: 'row', borderTopWidth: 1, paddingTop: space.xl },
});
