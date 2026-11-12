import { router, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { DemoPlaceView } from '@/features/places/components/demo-place-view';
import { PlaceView } from '@/features/places/components/place-view';
import { getDemoPlace } from '@/features/places/demo-place';
import { usePlace } from '@/features/places/queries';
import { space, useColors } from '@/theme';

export default function PlaceScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const demo = getDemoPlace(slug);
  const { data: place, isPending, isError, refetch } = usePlace(demo ? undefined : slug);
  const c = useColors();

  if (demo) return <DemoPlaceView place={demo} />;

  if (isPending) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <ActivityIndicator color={c.textMuted} accessibilityLabel="Cargando el lugar" />
      </View>
    );
  }

  if (isError || !place) {
    return (
      <View style={[styles.center, { backgroundColor: c.background }]}>
        <Text variant="title" style={styles.centerText}>
          {isError ? 'No pudimos cargar este lugar' : 'No encontramos este lugar'}
        </Text>
        <Text tone="textMuted" style={styles.centerText}>
          {isError
            ? 'Revisa tu conexión e inténtalo de nuevo.'
            : 'Puede que el enlace esté incompleto o que lo hayan quitado.'}
        </Text>
        <View style={styles.actions}>
          {isError ? (
            <Button label="Reintentar" variant="inverse" onPress={() => refetch()} />
          ) : (
            <Button
              label="Volver"
              variant="outline"
              onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
            />
          )}
        </View>
      </View>
    );
  }

  return <PlaceView place={place} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: space.xl,
  },
  centerText: { textAlign: 'center' },
  actions: { flexDirection: 'row', marginTop: space.md },
});
