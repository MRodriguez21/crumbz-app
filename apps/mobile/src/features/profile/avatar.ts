import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { supabase } from '@/lib/supabase';

const BUCKET = 'avatars';
const AVATAR_SIZE = 512;

/** Lets the user pick a square photo. Returns a local URI, or null if cancelled. */
export async function pickAvatar(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 1,
  });
  return result.canceled ? null : (result.assets[0]?.uri ?? null);
}

/**
 * Compresses on device (512 px, WebP ~0.7) before upload — data is expensive in Venezuela.
 * Returns the storage path to save in profiles.avatar_path.
 */
export async function uploadAvatar(userId: string, localUri: string): Promise<string> {
  const context = ImageManipulator.manipulate(localUri);
  context.resize({ width: AVATAR_SIZE, height: AVATAR_SIZE });
  const rendered = await context.renderAsync();
  const saved = await rendered.saveAsync({ format: SaveFormat.WEBP, compress: 0.7 });

  const body = await (await fetch(saved.uri)).arrayBuffer();
  const path = `${userId}/${Date.now()}.webp`;
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, body, { contentType: 'image/webp', upsert: false });
  if (error) throw new Error('No pudimos subir tu foto. Inténtalo de nuevo.');
  return path;
}

export function avatarUrl(path: string | null | undefined): string | null {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}
