import { POST_PHOTOS_MAX } from '@crumbz/shared';
import { randomUUID } from 'expo-crypto';
import { Directory, File, Paths } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { supabase } from '@/lib/supabase';

export const POSTS_BUCKET = 'posts';

/** Long side of the full photo and of the feed thumbnail, in px (CLAUDE.md §10). */
const FULL_SIZE = 1600;
const THUMB_SIZE = 400;
const QUALITY = 0.7;

/** A photo as picked, before it is compressed. */
export type PickedPhoto = { id: string; uri: string; width: number; height: number };

/**
 * A photo compressed and stored where the OS will not purge it, ready to upload.
 * Only file names are stored: absolute paths change on iOS when the app updates.
 */
export type QueuedPhoto = {
  id: string;
  ext: PhotoExt;
  width: number;
  height: number;
  uploaded: boolean;
};

export type PhotoExt = 'webp' | 'jpg';

// WebP saves data on Android (most of our users); iOS encodes JPEG reliably.
const EXT: PhotoExt = Platform.OS === 'ios' ? 'jpg' : 'webp';
const FORMAT = EXT === 'jpg' ? SaveFormat.JPEG : SaveFormat.WEBP;
const CONTENT_TYPE: Record<PhotoExt, string> = { webp: 'image/webp', jpg: 'image/jpeg' };

/** A queued photo whose local file is gone: retrying cannot help. */
export class MissingPhotoError extends Error {}

const toPicked = (assets: ImagePicker.ImagePickerAsset[]): PickedPhoto[] =>
  assets.map((a) => ({ id: randomUUID(), uri: a.uri, width: a.width, height: a.height }));

export async function pickFromLibrary(remaining: number): Promise<PickedPhoto[]> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: Math.min(remaining, POST_PHOTOS_MAX),
    quality: 1,
  });
  return result.canceled ? [] : toPicked(result.assets).slice(0, remaining);
}

export type CameraResult =
  { ok: true; photos: PickedPhoto[] } | { ok: false; canOpenSettings: boolean };

export async function takePhoto(): Promise<CameraResult> {
  const permission = await ImagePicker.requestCameraPermissionsAsync();
  if (!permission.granted) return { ok: false, canOpenSettings: !permission.canAskAgain };
  const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  return { ok: true, photos: result.canceled ? [] : toPicked(result.assets) };
}

const queueDir = (postId: string) => new Directory(Paths.document, 'publish-queue', postId);

const localFile = (postId: string, photoId: string, ext: PhotoExt, thumb = false) =>
  new File(queueDir(postId), `${photoId}${thumb ? '_thumb' : ''}.${ext}`);

async function resizeTo(uri: string, longSide: number, width: number, height: number) {
  const context = ImageManipulator.manipulate(uri);
  // Never upscale; keep the aspect ratio by constraining the long side only.
  if (Math.max(width, height) > longSide) {
    context.resize(width >= height ? { width: longSide } : { height: longSide });
  }
  const rendered = await context.renderAsync();
  return rendered.saveAsync({ format: FORMAT, compress: QUALITY });
}

/**
 * Compresses on device (data is expensive) and copies the result into the app's
 * documents, so a pending visit keeps its photos even if the OS clears the cache.
 */
export async function preparePhotos(postId: string, picked: PickedPhoto[]): Promise<QueuedPhoto[]> {
  const dir = queueDir(postId);
  dir.create({ intermediates: true, idempotent: true });

  const prepared: QueuedPhoto[] = [];
  for (const photo of picked) {
    const full = await resizeTo(photo.uri, FULL_SIZE, photo.width, photo.height);
    const thumb = await resizeTo(photo.uri, THUMB_SIZE, photo.width, photo.height);
    await new File(full.uri).copy(localFile(postId, photo.id, EXT), { overwrite: true });
    await new File(thumb.uri).copy(localFile(postId, photo.id, EXT, true), { overwrite: true });
    prepared.push({
      id: photo.id,
      ext: EXT,
      width: full.width,
      height: full.height,
      uploaded: false,
    });
  }
  return prepared;
}

/** Removes the local copies once the visit was published or discarded. */
export function deleteQueuedPhotos(postId: string) {
  try {
    const dir = queueDir(postId);
    if (dir.exists) dir.delete();
  } catch {
    // Leftover files are harmless; never fail a publish over cleanup.
  }
}

export const photoPath = (userId: string, postId: string, photo: Pick<QueuedPhoto, 'id' | 'ext'>) =>
  `${userId}/${postId}/${photo.id}.${photo.ext}`;

/** Thumbnails live next to the photo: `{id}.webp` → `{id}_thumb.webp`. */
export const thumbPath = (path: string) => path.replace(/\.(webp|jpg)$/, '_thumb.$1');

export function photoUrl(path: string): string {
  return supabase.storage.from(POSTS_BUCKET).getPublicUrl(path).data.publicUrl;
}

/** Uploads the photo and its thumbnail. Upsert makes a retry after a lost response safe. */
export async function uploadPhoto(userId: string, postId: string, photo: QueuedPhoto) {
  const path = photoPath(userId, postId, photo);
  const targets: [string, File][] = [
    [path, localFile(postId, photo.id, photo.ext)],
    [thumbPath(path), localFile(postId, photo.id, photo.ext, true)],
  ];
  for (const [target, file] of targets) {
    if (!file.exists) throw new MissingPhotoError(target);
    const body = await file.arrayBuffer();
    const { error } = await supabase.storage
      .from(POSTS_BUCKET)
      .upload(target, body, { contentType: CONTENT_TYPE[photo.ext], upsert: true });
    if (error) throw error;
  }
  return path;
}

/** Best effort: removes photos already uploaded for a visit that will never be published. */
export async function deleteUploadedPhotos(userId: string, postId: string, photos: QueuedPhoto[]) {
  const paths = photos
    .filter((p) => p.uploaded)
    .flatMap((p) => {
      const path = photoPath(userId, postId, p);
      return [path, thumbPath(path)];
    });
  if (paths.length) await supabase.storage.from(POSTS_BUCKET).remove(paths);
}
