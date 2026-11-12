import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/text';
import { useSession } from '@/features/auth/auth-provider';
import { useSignOut } from '@/features/auth/use-sign-out';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { space, touchTarget, useColors } from '@/theme';

/** First-time profile setup. Saving flips the route guard straight into the app. */
export default function OnboardingScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { session } = useSession();
  const signOut = useSignOut();

  const meta = session?.user.user_metadata ?? {};
  const initialDisplayName = String(meta.full_name ?? meta.name ?? '');

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.xl },
        ]}
      >
        <View style={styles.header}>
          <Text variant="headline" accessibilityRole="header">
            Crea tu perfil
          </Text>
          <Text tone="textMuted">Así te van a ver cuando publiques tus visitas.</Text>
        </View>

        <ProfileForm
          mode="create"
          initialDisplayName={initialDisplayName}
          defaultCityId={null}
          onDone={() => undefined}
        />

        <Pressable accessibilityRole="button" onPress={signOut} style={styles.escape}>
          <Text variant="bodySmall" tone="textMuted">
            ¿No eres tú? Usar otra cuenta
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { paddingHorizontal: space.lg, gap: space.xl },
  header: { gap: space.xs },
  escape: { minHeight: touchTarget, justifyContent: 'center', alignSelf: 'center' },
});
