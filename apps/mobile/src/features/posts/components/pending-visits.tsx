import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { ConfirmDialog } from '@/components/confirm-dialog';
import { Text } from '@/components/text';
import { useSession } from '@/features/auth/auth-provider';
import { space, touchTarget, useColors } from '@/theme';

import { discardVisit, retryVisit, type QueuedVisit } from '../queue';
import { usePendingVisits } from '../use-publish-queue';

const statusText = (v: QueuedVisit) => {
  if (v.status === 'failed') return 'No se pudo publicar.';
  if (v.status === 'publishing' || v.attempts === 0) return 'Publicando…';
  return 'Se publicará cuando vuelva la conexión.';
};

/**
 * Visits still on the phone. A visit only leaves this list by being published or by the
 * user confirming the discard; failed ones offer "Reintentar".
 */
export function PendingVisits({ placeId }: { placeId?: string }) {
  const c = useColors();
  const { session } = useSession();
  const all = usePendingVisits();
  const visits = placeId ? all.filter((v) => v.payload.post.placeId === placeId) : all;
  const [discarding, setDiscarding] = useState<QueuedVisit | null>(null);

  if (visits.length === 0) return null;

  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <Text variant="labelStrong">
        {visits.length === 1 ? 'Visita por publicar' : `${visits.length} visitas por publicar`}
      </Text>
      <View style={[styles.list, { borderBottomColor: c.line }]}>
        {visits.map((v) => (
          <View key={v.id} style={[styles.row, { borderTopColor: c.line }]}>
            <View style={styles.text}>
              <Text variant="bodyStrong" numberOfLines={1}>
                {`${v.payload.placeName} · ${v.payload.post.rating}`}
              </Text>
              <Text variant="label" tone={v.status === 'failed' ? 'danger' : 'textMuted'}>
                {statusText(v)}
              </Text>
            </View>
            {v.status !== 'publishing' && session ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => void retryVisit(v.id, session.user.id)}
                style={({ pressed }) => [styles.action, pressed && { backgroundColor: c.pressed }]}
              >
                <Text variant="label">Reintentar</Text>
              </Pressable>
            ) : null}
            {v.status === 'failed' ? (
              <Pressable
                accessibilityRole="button"
                onPress={() => setDiscarding(v)}
                style={({ pressed }) => [styles.action, pressed && { backgroundColor: c.pressed }]}
              >
                <Text variant="label" tone="danger">
                  Descartar
                </Text>
              </Pressable>
            ) : null}
          </View>
        ))}
      </View>

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
  list: { borderBottomWidth: 1 },
  row: {
    minHeight: touchTarget + space.sm,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  text: { flex: 1, gap: space.xxs, paddingVertical: space.sm },
  action: {
    minHeight: touchTarget,
    justifyContent: 'center',
    paddingHorizontal: space.sm,
    borderRadius: 999,
  },
});
