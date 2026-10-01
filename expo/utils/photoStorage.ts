import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';
import { fetchPhotoFromDrive, markPhotoBackedUp } from '@/store/syncStore';

const PHOTO_DIR = `${FileSystem.documentDirectory}photos/`;

/**
 * Camera and image-picker results live in the cache directory, which Android
 * may clear at any time. Copy them into the app's document directory so the
 * photo survives for as long as the record that references it.
 */
export async function persistPhoto(tempUri: string, prefix: string): Promise<string> {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return tempUri;
  }

  const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
  }

  const extension = tempUri.split('.').pop()?.split('?')[0] || 'jpg';
  const destination = `${PHOTO_DIR}${prefix}-${Date.now()}.${extension}`;
  await FileSystem.copyAsync({ from: tempUri, to: destination });
  return destination;
}

const inFlight = new Map<string, Promise<string | null>>();

/**
 * Returns a URI that can be displayed for a stored photo. If the file isn't
 * on this tablet (taken on another tablet, or the app was reinstalled), it
 * is downloaded from the Post's Drive backup and saved locally. Returns null
 * when the photo can't be found anywhere.
 */
export function resolvePhoto(uri?: string): Promise<string | null> {
  if (!uri) return Promise.resolve(null);
  if (Platform.OS === 'web' || !FileSystem.documentDirectory || !uri.startsWith('file://')) {
    return Promise.resolve(uri);
  }
  const name = uri.split('/').pop() || '';
  const existing = inFlight.get(name);
  if (existing) return existing;

  const task = (async () => {
    if ((await FileSystem.getInfoAsync(uri)).exists) return uri;
    const local = `${PHOTO_DIR}${name}`;
    if ((await FileSystem.getInfoAsync(local)).exists) return local;

    const data = await fetchPhotoFromDrive(name);
    if (!data) return null;
    const dirInfo = await FileSystem.getInfoAsync(PHOTO_DIR);
    if (!dirInfo.exists) await FileSystem.makeDirectoryAsync(PHOTO_DIR, { intermediates: true });
    await FileSystem.writeAsStringAsync(local, data, { encoding: FileSystem.EncodingType.Base64 });
    markPhotoBackedUp(local);
    markPhotoBackedUp(uri);
    return local;
  })().finally(() => inFlight.delete(name));

  inFlight.set(name, task);
  return task;
}
