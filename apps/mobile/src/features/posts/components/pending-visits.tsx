import { router } from 'expo-router';
import { useState, type ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Text } from '@/components/text';
import { useSession } from '@/features/auth/auth-provider';
import { space } from '@/theme';

import { localThumbUri } from '../photos';
import { discardVisit, retryVisit, type QueuedVisit } from '../queue';
import { useJustPublished, usePendingVisits } from '../use-publish-queue';
import { RowAction, VisitRow, visitMeta } from './visit-row';

/** Home has little room: show the oldest few and point to the profile for the rest. */
const DEFAULT_LIMIT = 2;

const statusOf = (v: QueuedVisit) => {
  if (v.status === 'failed') return { text: 'No se pudo publicar.', tone: 'danger' as const };
  if (v.status === 'publishing' || v.attempts === 0) {
    return { text: 'Publicando…', tone: 'textMuted' as const };
  }
  return { text: 'Se publicará cuando vuelva la conexión.', tone: 'textMuted' as const };
};

type Props = {
  /** Only this place's visits (place page): rows then skip the place name. */
  placeId?: string;
  /** Max rows before "y N más" (home). Unlimited when omitted with `showAll`. */
  limit?: number;
  showAll?: boolean;
};

/**
 * Visits still on the phone, in the same ledger form as published ones. A visit only
 * leaves this list by being published (shown as "Publicada" for a moment) or by the
 * user confirming the discard.
 */
export function PendingVisits({ placeId, limit = DEFAULT_LIMIT, showAll }: Props) {
  const { session } = useSession();
  const inPlace = (v: QueuedVisit) => !placeId || v.payload.post.placeId === placeId;
  const pending = usePendingVisits().filter(inPlace);
  const justPublished = useJustPublished().filter(inPlace);
  const [discarding, setDiscarding] = useState<QueuedVisit | null>(null);

  const total = pending.length + justPublished.length;
  if (total === 0) return null;

  const max = showAll || placeId ? Infinity : limit;
  const shown = pending.slice(0, max);
  const hidden = pending.length - shown.length;

  const heading =
    pending.length === 0
      ? 'Visita publicada'
      : pending.length === 1
        ? 'Visita por publicar'
        : `${pending.length} visitas por publicar`;

  const row = (
    v: QueuedVisit,
    i: number,
    status: { text: string; tone: 'danger' | 'textMuted' | 'proof' },
    actions?: ReactNode,
  ) => {
    const { post, placeName, photos } = v.payload;
    const cover = photos[0];
    return (
      <VisitRow
        key={v.id}
        first={i === 0}
        title={placeId ? undefined : placeName}
        meta={visitMeta(post.visitedOn, post.mode, post.spendUsd)}
        rating={post.rating}
        thumbUri={cover ? localThumbUri(v.id, cover) : null}
        status={status}
        actions={actions}
      />
    );
  };

  return (
    <View style={styles.wrap}>
      <Text variant="labelStrong">{heading}</Text>
      <View>
        {justPublished.map((v, i) => row(v, i, { text: 'Publicada.', tone: 'proof' }))}
        {shown.map((v, i) => {
          const status = statusOf(v);
          const canRetry = v.status === 'failed' || (v.status === 'pending' && v.attempts > 0);
          const actions =
            v.status === 'publishing' ? undefined : (
              <>
                {canRetry && session ? (
                  <RowAction
                    label="Reintentar"
                    onPress={() => void retryVisit(v.id, session.user.id)}
                  />
                ) : null}
                <RowAction label="Descartar" tone="danger" onPress={() => setDiscarding(v)} />
              </>
            );
          return row(v, justPublished.length + i, status, actions);
        })}
      </View>
      {hidden > 0 ? (
        <RowAction
          label={hidden === 1 ? 'Ver 1 más en tu perfil' : `Ver ${hidden} más en tu perfil`}
          onPress={() => router.push('/profile')}
        />
      ) : null}

      <ConfirmDialog
        visible={!!discarding}
        title="¿Descartar esta visita?"
        message="Se borra de tu teléfono y no se publicará. No se puede deshacer."
        confirmLabel="Descartar"
        destructive
        onCancel={() => setDiscarding(null)}
        onConfirm={() => {
          if (discarding) void discardVisit(discarding.id);
          setDiscarding(null);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: space.xs },
});
