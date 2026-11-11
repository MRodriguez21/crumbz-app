import { APP_NAME } from '@crumbz/shared';
import { router } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { DEMO_PLACE_SLUG } from '@/features/places/demo-place';
import { space, useColors } from '@/theme';

// Placeholder until auth (phase 1) and the feed (phase 6) land.
export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: c.background, paddingBottom: insets.bottom + space.xl },
      ]}
    >
      <View style={styles.copy}>
        <Text variant="headline" accessibilityRole="header">
          {APP_NAME}
        </Text>
        <Text tone="textMuted">Dónde comer en Caracas, dicho por gente que fue.</Text>
      </View>
      <View style={styles.actions}>
        <Button
          label="Ver un perfil de ejemplo"
          variant="inverse"
          onPress={() => router.push(`/place/${DEMO_PLACE_SLUG}`)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'flex-end', paddingHorizontal: space.lg, gap: space.xl },
  copy: { gap: space.sm },
  actions: { flexDirection: 'row' },
});
