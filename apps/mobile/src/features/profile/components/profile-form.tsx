import {
  BIO_MAX,
  DISPLAY_NAME_MAX,
  bioSchema,
  displayNameSchema,
  usernameSchema,
} from '@crumbz/shared';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { Text } from '@/components/text';
import { TextField } from '@/components/text-field';
import { useSession } from '@/features/auth/auth-provider';
import { space } from '@/theme';

import { avatarUrl, uploadAvatar } from '../avatar';
import {
  useCreateProfile,
  useUpdateProfile,
  useUsernameAvailability,
  type Profile,
} from '../queries';
import { AvatarPicker } from './avatar-picker';
import { CityPicker } from './city-picker';
import { UsernameField } from './username-field';

type Props =
  | { mode: 'create'; initialDisplayName: string; defaultCityId: number | null; onDone: () => void }
  | { mode: 'edit'; profile: Profile; onDone: () => void };

type Touched = Partial<Record<'username' | 'displayName' | 'bio', boolean>>;

const issue = (r: { success: boolean; error?: { issues: { message: string }[] } }) =>
  r.success ? undefined : r.error?.issues[0]?.message;

/**
 * Shared profile form for onboarding (create) and editing. Validates each field on blur,
 * everything on submit, and keeps errors under their field.
 */
export function ProfileForm(props: Props) {
  const { session } = useSession();
  const editing = props.mode === 'edit' ? props.profile : null;

  const [username, setUsername] = useState(editing?.username ?? '');
  const [displayName, setDisplayName] = useState(
    editing?.display_name ?? (props.mode === 'create' ? props.initialDisplayName : ''),
  );
  const [bio, setBio] = useState(editing?.bio ?? '');
  const [cityId, setCityId] = useState<number | null>(
    editing ? editing.home_city_id : props.mode === 'create' ? props.defaultCityId : null,
  );
  // undefined = unchanged, null = removed, string = new local file to upload.
  const [avatarLocal, setAvatarLocal] = useState<string | null | undefined>(undefined);
  const [touched, setTouched] = useState<Touched>({});
  const [formError, setFormError] = useState<string>();
  const [saving, setSaving] = useState(false);

  const availability = useUsernameAvailability(username, editing?.username);
  const create = useCreateProfile();
  const update = useUpdateProfile();

  const errors = {
    username: touched.username ? issue(usernameSchema.safeParse(username)) : undefined,
    displayName: touched.displayName ? issue(displayNameSchema.safeParse(displayName)) : undefined,
    bio: touched.bio ? issue(bioSchema.safeParse(bio)) : undefined,
  };

  const shownAvatar = avatarLocal === undefined ? avatarUrl(editing?.avatar_path) : avatarLocal;

  const submit = async () => {
    setTouched({ username: true, displayName: true, bio: true });
    setFormError(undefined);

    const u = usernameSchema.safeParse(username);
    const d = displayNameSchema.safeParse(displayName);
    const b = bioSchema.safeParse(bio);
    if (!u.success || !d.success || !b.success || !cityId) {
      if (!cityId) setFormError('Elige tu ciudad.');
      return;
    }
    if (availability.status === 'taken') return;

    setSaving(true);
    try {
      let avatarPath: string | null | undefined;
      if (typeof avatarLocal === 'string')
        avatarPath = await uploadAvatar(session!.user.id, avatarLocal);
      else if (avatarLocal === null) avatarPath = null;

      if (props.mode === 'create') {
        await create.mutateAsync({
          username: u.data,
          displayName: d.data,
          homeCityId: cityId,
          avatarPath,
        });
      } else {
        await update.mutateAsync({
          username: u.data,
          displayName: d.data,
          bio: b.data,
          homeCityId: cityId,
          avatarPath,
        });
      }
      props.onDone();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'No pudimos guardar tu perfil.');
    } finally {
      setSaving(false);
    }
  };

  const blockSubmit =
    availability.status === 'checking' || availability.status === 'taken' || saving;

  return (
    <View style={styles.form}>
      <AvatarPicker
        uri={shownAvatar ?? null}
        name={displayName}
        onPick={setAvatarLocal}
        onRemove={() => setAvatarLocal(null)}
      />

      <UsernameField
        value={username}
        onChangeText={setUsername}
        onBlur={() => setTouched((t) => ({ ...t, username: true }))}
        status={availability.status}
        error={errors.username}
      />

      <TextField
        label="Nombre visible"
        value={displayName}
        onChangeText={setDisplayName}
        onBlur={() => setTouched((t) => ({ ...t, displayName: true }))}
        autoCapitalize="words"
        autoComplete="name"
        textContentType="name"
        maxLength={DISPLAY_NAME_MAX}
        helper="Así apareces en tus visitas."
        error={errors.displayName}
      />

      {props.mode === 'edit' ? (
        <TextField
          label="Bio"
          value={bio}
          onChangeText={setBio}
          onBlur={() => setTouched((t) => ({ ...t, bio: true }))}
          multiline
          minLines={3}
          maxLength={BIO_MAX}
          counter={`${bio.length}/${BIO_MAX}`}
          placeholder="Qué te gusta comer y dónde"
          error={errors.bio}
        />
      ) : null}

      <CityPicker value={cityId} onChange={setCityId} />

      {formError ? (
        <Text variant="bodySmall" tone="danger" accessibilityLiveRegion="assertive">
          {formError}
        </Text>
      ) : null}

      <View style={styles.actions}>
        <Button
          label={props.mode === 'create' ? 'Crear perfil' : 'Guardar cambios'}
          variant="inverse"
          onPress={submit}
          loading={saving}
          disabled={blockSubmit && !saving}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: space.xl },
  actions: { flexDirection: 'row' },
});
