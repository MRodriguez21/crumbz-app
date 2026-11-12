import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft } from 'lucide-react-native';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { ProfileForm } from '@/features/profile/components/profile-form';
import { useMyProfile } from '@/features/profile/queries';
import { space, useColors } from '@/theme';

const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;

export default function EditProfileScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { data: profile } = useMyProfile();
  if (!profile) return null;

  return (
    <KeyboardAvoidingView
      style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.appBar}>
        <IconButton icon={BackIcon} accessibilityLabel="Volver" onPress={() => router.back()} />
        <Text variant="title" accessibilityRole="header">
          Editar perfil
        </Text>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
      >
        <ProfileForm mode="edit" profile={profile} onDone={() => router.back()} />
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
  content: { paddingHorizontal: space.lg, paddingTop: space.md },
});
