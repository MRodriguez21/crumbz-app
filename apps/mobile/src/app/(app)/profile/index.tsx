import { router } from 'expo-router';
import { ArrowLeft, ChevronLeft, Pencil } from 'lucide-react-native';
import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/avatar';
import { Button } from '@/components/button';
import { ConfirmDialog } from '@/components/confirm-dialog';
import { IconButton } from '@/components/icon-button';
import { Text } from '@/components/text';
import { useSignOut } from '@/features/auth/use-sign-out';
import { avatarUrl } from '@/features/profile/avatar';
import { useCities, useMyProfile } from '@/features/profile/queries';
import { space, useColors } from '@/theme';

const BackIcon = Platform.OS === 'ios' ? ChevronLeft : ArrowLeft;

export default function MyProfileScreen() {
  const c = useColors();
  const insets = useSafeAreaInsets();
  const { data: profile } = useMyProfile();
  const { data: cities } = useCities();
  const signOut = useSignOut();
  const [confirmingSignOut, setConfirmingSignOut] = useState(false);

  // Guards guarantee a profile here; render nothing during the brief refetch gap.
  if (!profile) return null;

  const city = cities?.find((x) => x.id === profile.home_city_id)?.name;
  const back = () => (router.canGoBack() ? router.back() : router.replace('/'));

  const stats = [
    { label: 'visitas', value: profile.posts_count },
    { label: 'seguidores', value: profile.followers_count },
    { label: 'siguiendo', value: profile.following_count },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: c.background, paddingTop: insets.top }]}>
      <View style={styles.appBar}>
        <IconButton icon={BackIcon} accessibilityLabel="Volver" onPress={back} />
        <IconButton
          icon={Pencil}
          accessibilityLabel="Editar perfil"
          onPress={() => router.push('/profile/edit')}
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + space.xl }]}
      >
        <View style={styles.identity}>
          <Avatar uri={avatarUrl(profile.avatar_path)} name={profile.display_name} size={88} />
          <View style={styles.names}>
            <Text variant="headline" accessibilityRole="header">
              {profile.display_name}
            </Text>
            <Text variant="bodySmall" tone="textMuted">
              {`@${profile.username}${city ? ` · ${city}` : ''}`}
            </Text>
          </View>
          {profile.bio ? <Text>{profile.bio}</Text> : null}
        </View>

        <View style={[styles.stats, { borderColor: c.line }]}>
          {stats.map((s, i) => (
            <View
              key={s.label}
              accessible
              accessibilityLabel={`${s.value} ${s.label}`}
              style={[styles.stat, i > 0 && { borderLeftWidth: 1, borderLeftColor: c.line }]}
            >
              <Text variant="title" tabular>
                {s.value}
              </Text>
              <Text variant="label" tone="textMuted">
                {s.label}
              </Text>
            </View>
          ))}
        </View>

        {profile.posts_count === 0 ? (
          <View style={styles.empty}>
            <Text variant="title">Todavía no has publicado visitas</Text>
            <Text variant="bodySmall" tone="textMuted">
              Tu primera visita ayuda a que otros sepan dónde comer, cuánto gastar y cómo pagar.
            </Text>
            {/* TODO(phase-3): open the publish-visit flow. */}
            <Text variant="label" tone="textMuted">
              Publicar visitas llega muy pronto.
            </Text>
          </View>
        ) : null}

        <View style={[styles.signOut, { borderTopColor: c.line }]}>
          <Button
            label="Cerrar sesión"
            variant="outline"
            onPress={() => setConfirmingSignOut(true)}
          />
        </View>
      </ScrollView>

      <ConfirmDialog
        visible={confirmingSignOut}
        title="¿Cerrar sesión?"
        message="Puedes volver a entrar cuando quieras."
        confirmLabel="Cerrar sesión"
        onCancel={() => setConfirmingSignOut(false)}
        onConfirm={() => {
          setConfirmingSignOut(false);
          void signOut();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  appBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: space.xs,
  },
  content: { paddingHorizontal: space.lg, gap: space.xl },
  identity: { gap: space.md },
  names: { gap: space.xxs },
  stats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderBottomWidth: 1,
  },
  stat: { flex: 1, paddingVertical: space.md, alignItems: 'center', gap: space.xxs },
  empty: { gap: space.xs },
  signOut: { flexDirection: 'row', borderTopWidth: 1, paddingTop: space.xl },
});
