import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { useRef, type ComponentRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { PlaceForm } from '@/features/places/components/place-form';
import { useCurrentCityId } from '@/features/places/queries';
import { space, useColors } from '@/theme';

const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;

export default function NewPlaceScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { name } = useLocalSearchParams<{ name?: string }>();
  const cityId = useCurrentCityId();
  const scrollRef = useRef<ComponentRef<typeof ScrollView>>(null);
  const formTop = useRef(0);

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* DESIGN: the top app bar carries only navigation; the title opens the content. */}
      <View style={styles.appBar}>
        <IconButton icon={BackIcon} accessibilityLabel="Volver" onPress={() => router.back()} />
      </View>
      <ScrollView
        ref={scrollRef}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
      >
        {cityId == null ? (
          <Text tone="textMuted">Cargando…</Text>
        ) : (
          <View onLayout={(e) => (formTop.current = e.nativeEvent.layout.y)}>
            <PlaceForm
              // Areas belong to a city: start clean if the city ever changes.
              key={cityId}
              initialName={name ?? ''}
              cityId={cityId}
              onScrollTo={(y) => scrollRef.current?.scrollTo({ y: formTop.current + y })}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.xs,
  },
  content: { paddingHorizontal: space.lg, paddingTop: space.sm },
});
