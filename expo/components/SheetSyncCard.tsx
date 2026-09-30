import React, { useState } from 'react';
import { StyleSheet, Text, View, TextInput, Alert } from 'react-native';
import { Cloud, RefreshCw, Link, Unlink } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { useSyncStore } from '@/store/syncStore';

// The Post's sync web app (Apps Script deployment owned by americanlegionchapala@gmail.com).
// Pre-filled so a new tablet only needs the sync token. The token is NOT built
// in: the APK and this repository are public, and the token grants full access
// to the member data. It lives in the Post's private "App Sync Configuration" doc.
const DEFAULT_SYNC_URL =
  'https://script.google.com/macros/s/AKfycbz4zZhNSmh9aBAlPQCq2TdzAJzfSpEA3MWwaQrP2PpJEE-9Q-v92K_UnCI3XieHcRX5/exec';

export default function SheetSyncCard() {
  const {
    endpointUrl,
    token,
    lastSyncAt,
    lastError,
    isSyncing,
    configure,
    disconnect,
    testConnection,
    syncNow,
  } = useSyncStore();

  const [urlInput, setUrlInput] = useState(endpointUrl || DEFAULT_SYNC_URL);
  const [tokenInput, setTokenInput] = useState(token);
  const [isConnecting, setIsConnecting] = useState(false);

  const isConnected = Boolean(endpointUrl && token);

  const handleConnect = async () => {
    if (!urlInput.trim().startsWith('https://script.google.com/')) {
      Alert.alert('Invalid URL', 'Paste the Apps Script web app URL. It starts with https://script.google.com/ and ends with /exec.');
      return;
    }
    if (!tokenInput.trim()) {
      Alert.alert('Missing Token', 'Enter the sync token shown when you ran setup() in the Apps Script editor.');
      return;
    }

    setIsConnecting(true);
    try {
      await testConnection(urlInput, tokenInput);
      configure(urlInput, tokenInput);
      const result = await syncNow();
      Alert.alert(
        'Connected',
        result
          ? `Sync is on. Sent ${result.pushed} records and received ${result.pulled}.`
          : 'Sync is on.'
      );
    } catch (error) {
      Alert.alert('Connection Failed', error instanceof Error ? error.message : String(error));
    } finally {
      setIsConnecting(false);
    }
  };

  const handleSyncNow = async () => {
    try {
      const result = await syncNow();
      if (result) {
        Alert.alert(
          'Sync Complete',
          `Sent ${result.pushed} changes, received ${result.pulled}, backed up ${result.photos} photos.`
        );
      }
    } catch (error) {
      Alert.alert('Sync Failed', error instanceof Error ? error.message : String(error));
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Turn Off Sync',
      'This device will stop syncing. Data on this device and in the Google Sheet is kept.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Turn Off',
          style: 'destructive',
          onPress: () => {
            disconnect();
            setUrlInput(DEFAULT_SYNC_URL);
            setTokenInput('');
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Cloud size={24} color={Colors.light.primary} style={styles.icon} />
        <Text style={styles.title}>Google Sheets Sync</Text>
      </View>

      <Text style={styles.description}>
        All data is stored on this device and works without internet. When connected, changes sync to
        the Post's Google Sheet in the background and photos are backed up to Google Drive.
      </Text>

      {isConnected ? (
        <>
          <View style={styles.statusBox}>
            <Text style={styles.statusText}>
              {isSyncing
                ? 'Syncing...'
                : lastSyncAt
                  ? `Last synced: ${new Date(lastSyncAt).toLocaleString()}`
                  : 'Not synced yet'}
            </Text>
            {lastError && !isSyncing && (
              <Text style={styles.errorText}>Last attempt failed: {lastError}</Text>
            )}
          </View>

          <View style={styles.buttons}>
            <Button
              title={isSyncing ? 'Syncing...' : 'Sync Now'}
              onPress={handleSyncNow}
              disabled={isSyncing}
              icon={<RefreshCw size={16} color="#fff" />}
              style={styles.button}
            />
            <Button
              title="Turn Off"
              onPress={handleDisconnect}
              variant="outline"
              icon={<Unlink size={16} color={Colors.light.primary} />}
              style={styles.button}
            />
          </View>
        </>
      ) : (
        <>
          <Text style={styles.label}>Web App URL</Text>
          <TextInput
            style={styles.input}
            value={urlInput}
            onChangeText={setUrlInput}
            placeholder="https://script.google.com/macros/s/.../exec"
            placeholderTextColor={Colors.light.subtext}
            autoCapitalize="none"
            autoCorrect={false}
            keyboardType="url"
          />

          <Text style={styles.label}>Sync Token</Text>
          <TextInput
            style={styles.input}
            value={tokenInput}
            onChangeText={setTokenInput}
            placeholder="Token from setup()"
            placeholderTextColor={Colors.light.subtext}
            autoCapitalize="none"
            autoCorrect={false}
            secureTextEntry
          />

          <Button
            title={isConnecting ? 'Connecting...' : 'Connect'}
            onPress={handleConnect}
            disabled={isConnecting}
            icon={<Link size={16} color="#fff" />}
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  description: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 16,
    lineHeight: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
  },
  statusBox: {
    backgroundColor: Colors.light.secondary,
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  statusText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontStyle: 'italic',
  },
  errorText: {
    fontSize: 13,
    color: Colors.light.error,
    marginTop: 4,
  },
  buttons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    flex: 1,
    marginHorizontal: 4,
  },
});
