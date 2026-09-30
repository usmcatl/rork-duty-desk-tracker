import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system';
import * as IntentLauncher from 'expo-intent-launcher';

/**
 * In-app updates from GitHub Releases. New versions are published with
 * `npm run release`, which attaches the APK to a release tagged v<version>.
 * The repository is public, so no credentials are needed to check or download.
 */
const LATEST_RELEASE_URL = 'https://api.github.com/repos/usmcatl/duty-desk-tracker/releases/latest';
const FLAG_GRANT_READ_URI_PERMISSION = 1;

export interface AvailableUpdate {
  version: string;
  apkUrl: string;
  apkName: string;
  notes: string;
}

export const currentAppVersion = () => Constants.expoConfig?.version ?? '0.0.0';

/** Compares dotted versions: >0 if a is newer than b. */
export function compareVersions(a: string, b: string): number {
  const pa = a.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  const pb = b.replace(/^v/i, '').split('.').map((n) => parseInt(n, 10) || 0);
  for (let i = 0; i < Math.max(pa.length, pb.length); i++) {
    const diff = (pa[i] ?? 0) - (pb[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

/** Returns the newer release if there is one, otherwise null. */
export async function checkForUpdate(): Promise<AvailableUpdate | null> {
  const response = await fetch(LATEST_RELEASE_URL, { headers: { Accept: 'application/vnd.github+json' } });
  if (response.status === 404) {
    return null; // No release published yet.
  }
  if (!response.ok) {
    throw new Error(`GitHub returned ${response.status}. Check the internet connection and try again.`);
  }
  const release = await response.json();
  const version = String(release.tag_name || '').replace(/^v/i, '');
  const apk = (release.assets || []).find((asset: { name: string }) => asset.name.toLowerCase().endsWith('.apk'));
  if (!version || !apk || compareVersions(version, currentAppVersion()) <= 0) {
    return null;
  }
  return { version, apkUrl: apk.browser_download_url, apkName: apk.name, notes: release.body || '' };
}

/**
 * Downloads the APK and opens Android's installer. The first time, Android
 * asks to allow "Install unknown apps" for Duty Desk Tracker.
 */
export async function downloadAndInstall(update: AvailableUpdate, onProgress?: (fraction: number) => void) {
  if (Platform.OS !== 'android') {
    throw new Error('Updates can only be installed on Android.');
  }
  const target = `${FileSystem.cacheDirectory}${update.apkName}`;
  await FileSystem.deleteAsync(target, { idempotent: true });

  const download = FileSystem.createDownloadResumable(update.apkUrl, target, {}, (progress) => {
    if (onProgress && progress.totalBytesExpectedToWrite > 0) {
      onProgress(progress.totalBytesWritten / progress.totalBytesExpectedToWrite);
    }
  });
  const result = await download.downloadAsync();
  if (!result || result.status !== 200) {
    throw new Error('The download did not complete. Please try again.');
  }

  const contentUri = await FileSystem.getContentUriAsync(result.uri);
  await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
    data: contentUri,
    type: 'application/vnd.android.package-archive',
    flags: FLAG_GRANT_READ_URI_PERMISSION,
  });
}
