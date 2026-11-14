import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useRef, type ComponentRef } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { usePlace } from '@/features/places/queries';
import { VisitForm } from '@/features/posts/components/visit-form';
import { space, useColors } from '@/theme';

const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;

/** Publish a visit to the place in the URL. */
export default function NewVisitScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: place, isPending, isError, refetch } = usePlace(slug);
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const formTop = useRef(0);

  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.appBar}>
        <IconButton icon={BackIcon} accessibilityLabel="Volver" onPress={back} />
      </View>

      {isPending ? (
        <View style={styles.center}>
          <ActivityIndicator color={c.textMuted} accessibilityLabel="Cargando el lugar" />
        </View>
      ) : isError || !place ? (
        <View style={styles.center}>
          <Text variant="title" style={styles.centerText}>
            {isError ? 'No pudimos cargar el lugar' : 'No encontramos este lugar'}
          </Text>
          <View style={styles.row}>
            {isError ? (
              <Button label="Reintentar" variant="inverse" onPress={() => refetch()} />
            ) : (
              <Button label="Volver" variant="outline" onPress={back} />
            )}
          </View>
        </View>
      ) : (
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
        >
          <View onLayout={(e) => (formTop.current = e.nativeEvent.layout.y)}>
            <VisitForm
              place={{
                id: place.id,
                slug: place.slug,
                name: place.name,
                serviceModes: place.service_modes,
              }}
              onScrollTo={(y) => scrollRef.current?.scrollTo({ y: formTop.current + y })}
              // Stored on the phone: show the place, where the pending visit is listed.
              onQueued={() => router.replace(`/place/${place.slug}`)}
            />
          </View>
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appBar: { flexDirection: 'row', paddingHorizontal: space.xs },
  content: { paddingHorizontal: space.lg, paddingTop: space.sm },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.md,
    padding: space.xl,
  },
  centerText: { textAlign: 'center' },
  row: { flexDirection: 'row' },
});
