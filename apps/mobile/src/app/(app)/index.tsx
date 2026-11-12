import { router } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { DEMO_PLACE_SLUG } from '@/features/places/demo-place';
import { avatarUrl } from '@/features/profile/avatar';
import { useMyProfile } from '@/features/profile/queries';
import { space, touchTarget, useColors } from '@/theme';

// Placeholder until the feed (phase 6) lands.
export default function HomeScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { data: profile } = useMyProfile();
  const firstName = profile?.display_name.split(' ')[0];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: c.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom + space.xl,
        },
      ]}
    >
      <View style={styles.appBar}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Mi perfil"
          onPress={() => router.push('/profile')}
          style={styles.profileButton}
          hitSlop={4}
        >
          <Avatar
            uri={avatarUrl(profile?.avatar_path)}
            name={profile?.display_name ?? ''}
            size={36}
          />
        </Pressable>
      </View>

      <View style={styles.body}>
        <View style={styles.copy}>
          <Text variant="headline" accessibilityRole="header">
            {firstName ? `Hola, ${firstName}` : 'Hola'}
          </Text>
          <Text tone="textMuted">
            Muy pronto vas a ver aquí las visitas de la gente que sigues.
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            label="Ver un lugar de ejemplo"
            variant="inverse"
            onPress={() => router.push(`/place/${DEMO_PLACE_SLUG}`)}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: space.lg },
  appBar: { flexDirection: 'row', justifyContent: 'flex-end' },
  profileButton: {
    width: touchTarget,
    height: touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1, justifyContent: 'flex-end', gap: space.xl },
  copy: { gap: space.sm },
  actions: { flexDirection: 'row' },
});
