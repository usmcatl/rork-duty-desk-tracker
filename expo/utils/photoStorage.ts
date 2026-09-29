import { Platform } from 'react-native';
import * as FileSystem from 'expo-file-system';

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
