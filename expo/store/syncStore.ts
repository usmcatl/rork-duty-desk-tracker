import { useEffect } from 'react';
import { AppState, Platform } from 'react-native';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useMemberStore } from '@/store/memberStore';
import { usePackageStore } from '@/store/packageStore';
import { useShiftStore } from '@/store/shiftStore';

/**
 * Offline-first sync with a Google Sheet (via a Google Apps Script web app,
 * see /google-sheets-sync/Code.gs).
 *
 * The device is always the source of truth for the UI. A sync:
 *   1. pushes every record whose content changed since the last sync, plus
 *      deletions (records that were synced before and are now gone),
 *   2. pulls every record another device changed since our last pull,
 *   3. backs up any photos not yet uploaded to the Drive folder.
 * Conflicts resolve as last-writer-wins at the sheet.
 */

export type SyncTable = 'equipment' | 'checkouts' | 'members' | 'packages' | 'shifts' | 'settings';

const TABLES: SyncTable[] = ['equipment', 'checkouts', 'members', 'packages', 'shifts', 'settings'];
const AUTO_SYNC_INTERVAL_MS = 5 * 60 * 1000;
const CHANGE_DEBOUNCE_MS = 20 * 1000;
const PHOTOS_PER_SYNC = 10;
const REQUEST_TIMEOUT_MS = 60 * 1000;

interface RemoteRow {
  table: SyncTable;
  id: string;
  deleted: boolean;
  device: string;
  data: any;
}

interface SyncResponse {
  ok: boolean;
  error?: string;
  serverTime?: number;
  rows?: RemoteRow[];
  fileId?: string;
}

export interface SyncResult {
  pushed: number;
  pulled: number;
  photos: number;
}

interface SyncState {
  endpointUrl: string;
  token: string;
  deviceId: string;
  lastPulledAt: number;
  syncedHashes: Record<string, number>;
  uploadedPhotos: Record<string, string>;
  lastSyncAt: string | null;
  lastError: string | null;
  isSyncing: boolean;
  configure: (endpointUrl: string, token: string) => void;
  disconnect: () => void;
  resetSyncState: () => void;
  testConnection: (endpointUrl: string, token: string) => Promise<void>;
  syncNow: () => Promise<SyncResult | null>;
}

const hashString = (value: string): number => {
  let hash = 5381;
  for (let i = 0; i < value.length; i++) {
    hash = ((hash << 5) + hash + value.charCodeAt(i)) | 0;
  }
  return hash;
};

const hashRecord = (record: unknown) => hashString(JSON.stringify(record));

const recordKey = (table: SyncTable, id: string) => `${table}:${id}`;

const newDeviceId = () =>
  `${Platform.OS}-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 8)}`;

/** Snapshot every syncable record on this device, keyed by table and id. */
function collectLocalRecords(): Record<SyncTable, Map<string, any>> {
  const equipmentState = useEquipmentStore.getState();
  const tables: Record<SyncTable, any[]> = {
    equipment: equipmentState.equipment,
    checkouts: equipmentState.checkoutRecords,
    members: useMemberStore.getState().members,
    packages: usePackageStore.getState().packages,
    shifts: useShiftStore.getState().shiftHistory,
    settings: [{ id: 'dutyOfficers', officers: equipmentState.dutyOfficers }],
  };

  const result = {} as Record<SyncTable, Map<string, any>>;
  for (const table of TABLES) {
    // Round-trip through JSON so Dates become the ISO strings the sheet stores.
    result[table] = new Map(
      tables[table].map((record) => [record.id, JSON.parse(JSON.stringify(record))])
    );
  }
  return result;
}

function mergeRows<T extends { id: string }>(current: T[], rows: RemoteRow[]): T[] {
  const byId = new Map(current.map((record) => [record.id, record]));
  for (const row of rows) {
    if (row.deleted) {
      byId.delete(row.id);
    } else {
      byId.set(row.id, row.data);
    }
  }
  return Array.from(byId.values());
}

/** Write rows pulled from the sheet into the local stores. */
function applyRemoteRows(rows: RemoteRow[]) {
  const byTable = (table: SyncTable) => rows.filter((row) => row.table === table);

  const equipmentRows = byTable('equipment');
  if (equipmentRows.length) {
    const state = useEquipmentStore.getState();
    state.setEquipment(mergeRows(state.equipment, equipmentRows));
  }

  const checkoutRows = byTable('checkouts');
  if (checkoutRows.length) {
    const state = useEquipmentStore.getState();
    state.setCheckoutRecords(mergeRows(state.checkoutRecords, checkoutRows));
  }

  const memberRows = byTable('members');
  if (memberRows.length) {
    const state = useMemberStore.getState();
    state.setMembers(mergeRows(state.members, memberRows));
  }

  const packageRows = byTable('packages');
  if (packageRows.length) {
    const state = usePackageStore.getState();
    state.setPackages(mergeRows(state.packages, packageRows));
  }

  const shiftRows = byTable('shifts');
  if (shiftRows.length) {
    const state = useShiftStore.getState();
    state.setShiftHistory(mergeRows(state.shiftHistory, shiftRows));
  }

  const officers = byTable('settings').find((row) => row.id === 'dutyOfficers' && !row.deleted);
  if (officers && Array.isArray(officers.data?.officers)) {
    useEquipmentStore.getState().setDutyOfficers(officers.data.officers);
  }
}

/** Local photo files referenced by any record, which should be backed up to Drive. */
function collectLocalPhotoUris(): string[] {
  if (Platform.OS === 'web' || !FileSystem.documentDirectory) {
    return [];
  }
  const photoDir = `${FileSystem.documentDirectory}photos/`;
  const uris = new Set<string>();
  for (const item of useEquipmentStore.getState().equipment) {
    if (item.imageUri) uris.add(item.imageUri);
  }
  for (const pkg of usePackageStore.getState().packages) {
    [pkg.packagePhotoUri, pkg.labelPhotoUri, pkg.storagePhotoUri].forEach((uri) => uri && uris.add(uri));
  }
  return Array.from(uris).filter((uri) => uri.startsWith(photoDir));
}

async function postToSheet(endpointUrl: string, body: Record<string, unknown>): Promise<SyncResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(endpointUrl, {
      method: 'POST',
      // text/plain keeps Apps Script from rejecting the request as a CORS preflight on web.
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const text = await response.text();
    let parsed: SyncResponse;
    try {
      parsed = JSON.parse(text);
    } catch {
      throw new Error('The sync URL did not return a valid response. Check that it is the Apps Script web app URL ending in /exec.');
    }
    if (!parsed.ok) {
      throw new Error(parsed.error || 'Sync failed');
    }
    return parsed;
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Downloads a backed-up photo from the Post's Drive folder by file name.
 * Returns base64 data, or null when sync isn't connected or the photo was
 * never backed up.
 */
export async function fetchPhotoFromDrive(name: string): Promise<string | null> {
  const { endpointUrl, token } = useSyncStore.getState();
  if (!endpointUrl || !token) return null;
  try {
    const response = await postToSheet(endpointUrl, { action: 'getPhoto', token, name });
    return (response as SyncResponse & { data?: string }).data || null;
  } catch {
    return null;
  }
}

/** Marks a photo as already in Drive so the uploader skips it. */
export function markPhotoBackedUp(uri: string) {
  useSyncStore.setState((state) => ({ uploadedPhotos: { ...state.uploadedPhotos, [uri]: 'drive' } }));
}

function waitForHydration(): Promise<void> {
  const stores = [useEquipmentStore, useMemberStore, usePackageStore, useShiftStore, useSyncStore];
  return Promise.all(
    stores.map(
      (store) =>
        new Promise<void>((resolve) => {
          if (store.persist.hasHydrated()) {
            resolve();
            return;
          }
          const unsubscribe = store.persist.onFinishHydration(() => {
            unsubscribe();
            resolve();
          });
        })
    )
  ).then(() => undefined);
}

export const useSyncStore = create<SyncState>()(
  persist(
    (set, get) => ({
      endpointUrl: '',
      token: '',
      deviceId: newDeviceId(),
      lastPulledAt: 0,
      syncedHashes: {},
      uploadedPhotos: {},
      lastSyncAt: null,
      lastError: null,
      isSyncing: false,

      configure: (endpointUrl, token) => {
        set({
          endpointUrl: endpointUrl.trim(),
          token: token.trim(),
          lastPulledAt: 0,
          syncedHashes: {},
          lastError: null,
        });
      },

      disconnect: () => {
        set({
          endpointUrl: '',
          token: '',
          lastPulledAt: 0,
          syncedHashes: {},
          uploadedPhotos: {},
          lastSyncAt: null,
          lastError: null,
        });
      },

      // Forget what was synced so the next sync re-downloads everything instead
      // of treating locally missing records as deletions.
      resetSyncState: () => {
        set({ lastPulledAt: 0, syncedHashes: {} });
      },

      testConnection: async (endpointUrl, token) => {
        await postToSheet(endpointUrl.trim(), { action: 'ping', token: token.trim() });
      },

      syncNow: async () => {
        await waitForHydration();
        const { endpointUrl, token, deviceId, isSyncing } = get();
        if (!endpointUrl || !token || isSyncing) {
          return null;
        }

        set({ isSyncing: true });
        try {
          const { lastPulledAt, syncedHashes } = get();
          const local = collectLocalRecords();

          const changes: { table: SyncTable; id: string; data: any }[] = [];
          const deletes: { table: SyncTable; id: string }[] = [];
          const pushedHashes: Record<string, number | null> = {};

          for (const table of TABLES) {
            for (const [id, data] of local[table]) {
              const key = recordKey(table, id);
              const hash = hashRecord(data);
              if (syncedHashes[key] !== hash) {
                changes.push({ table, id, data });
                pushedHashes[key] = hash;
              }
            }
          }
          for (const key of Object.keys(syncedHashes)) {
            const separator = key.indexOf(':');
            const table = key.substring(0, separator) as SyncTable;
            const id = key.substring(separator + 1);
            if (!local[table]?.has(id)) {
              deletes.push({ table, id });
              pushedHashes[key] = null;
            }
          }

          const response = await postToSheet(endpointUrl, {
            action: 'sync',
            token,
            device: deviceId,
            since: lastPulledAt,
            changes,
            deletes,
          });

          // Rows this device wrote are already reflected locally; re-applying them
          // could overwrite edits made while the request was in flight.
          const remoteRows = (response.rows || []).filter((row) => row.device !== deviceId);
          applyRemoteRows(remoteRows);

          const nextHashes = { ...get().syncedHashes };
          for (const [key, hash] of Object.entries(pushedHashes)) {
            if (hash === null) delete nextHashes[key];
            else nextHashes[key] = hash;
          }
          for (const row of remoteRows) {
            const key = recordKey(row.table, row.id);
            if (row.deleted) delete nextHashes[key];
            else nextHashes[key] = hashRecord(row.data);
          }

          set({
            syncedHashes: nextHashes,
            lastPulledAt: response.serverTime ?? lastPulledAt,
          });

          const photos = await uploadPendingPhotos();

          set({ lastSyncAt: new Date().toISOString(), lastError: null });
          return { pushed: changes.length + deletes.length, pulled: remoteRows.length, photos };
        } catch (error) {
          const message = error instanceof Error ? error.message : String(error);
          set({ lastError: message });
          throw error;
        } finally {
          set({ isSyncing: false });
        }
      },
    }),
    {
      name: 'sync-storage',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        endpointUrl: state.endpointUrl,
        token: state.token,
        deviceId: state.deviceId,
        lastPulledAt: state.lastPulledAt,
        syncedHashes: state.syncedHashes,
        uploadedPhotos: state.uploadedPhotos,
        lastSyncAt: state.lastSyncAt,
        lastError: state.lastError,
      }),
    }
  )
);

async function uploadPendingPhotos(): Promise<number> {
  const { endpointUrl, token, uploadedPhotos } = useSyncStore.getState();
  const pending = collectLocalPhotoUris().filter((uri) => !uploadedPhotos[uri]);

  let uploaded = 0;
  for (const uri of pending) {
    if (uploaded >= PHOTOS_PER_SYNC) break;
    // Records synced from other devices reference photos that only exist there.
    const info = await FileSystem.getInfoAsync(uri);
    if (!info.exists) continue;

    const name = uri.split('/').pop() || `photo-${Date.now()}.jpg`;
    const data = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
    const response = await postToSheet(endpointUrl, {
      action: 'photo',
      token,
      name,
      mimeType: name.endsWith('.png') ? 'image/png' : 'image/jpeg',
      data,
    });

    useSyncStore.setState((state) => ({
      uploadedPhotos: { ...state.uploadedPhotos, [uri]: response.fileId || 'uploaded' },
    }));
    uploaded++;
  }
  return uploaded;
}

/**
 * Keeps the device in sync in the background: on launch, when the app returns
 * to the foreground, shortly after local edits, and on a fixed interval.
 * Failures (usually no internet) are recorded in lastError and retried later.
 */
export function useAutoSync() {
  useEffect(() => {
    let debounce: ReturnType<typeof setTimeout> | null = null;

    const run = () => {
      useSyncStore
        .getState()
        .syncNow()
        .catch(() => {
          // Offline or misconfigured; the error is shown in Settings.
        });
    };

    const scheduleSoon = () => {
      if (debounce) clearTimeout(debounce);
      debounce = setTimeout(run, CHANGE_DEBOUNCE_MS);
    };

    run();
    const interval = setInterval(run, AUTO_SYNC_INTERVAL_MS);
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') run();
    });
    const unsubscribers = [
      useEquipmentStore.subscribe(scheduleSoon),
      useMemberStore.subscribe(scheduleSoon),
      usePackageStore.subscribe(scheduleSoon),
      useShiftStore.subscribe(scheduleSoon),
    ];

    return () => {
      if (debounce) clearTimeout(debounce);
      clearInterval(interval);
      appStateSubscription.remove();
      unsubscribers.forEach((unsubscribe) => unsubscribe());
    };
  }, []);
}
