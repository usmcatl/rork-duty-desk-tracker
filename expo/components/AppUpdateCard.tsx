import React, { useState } from 'react';
import { StyleSheet, Text, View, Alert, Platform } from 'react-native';
import { Download } from 'lucide-react-native';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { AvailableUpdate, checkForUpdate, currentAppVersion, downloadAndInstall } from '@/utils/appUpdate';

export default function AppUpdateCard() {
  const [isChecking, setIsChecking] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);

  const install = async (update: AvailableUpdate) => {
    setProgress(0);
    try {
      await downloadAndInstall(update, setProgress);
    } catch (error) {
      Alert.alert('Update Failed', error instanceof Error ? error.message : String(error));
    } finally {
      setProgress(null);
    }
  };

  const handleCheck = async () => {
    setIsChecking(true);
    try {
      const update = await checkForUpdate();
      if (!update) {
        Alert.alert('Up to Date', `You have the latest version (${currentAppVersion()}).`);
        return;
      }
      Alert.alert(
        'Update Available',
        `Version ${update.version} is available (you have ${currentAppVersion()}). Download and install it now? Your data and sync settings are kept.`,
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Update', onPress: () => install(update) },
        ]
      );
    } catch (error) {
      Alert.alert('Could Not Check', error instanceof Error ? error.message : String(error));
    } finally {
      setIsChecking(false);
    }
  };

  const busy = isChecking || progress !== null;
  const title = progress !== null
    ? `Downloading... ${Math.round(progress * 100)}%`
    : isChecking ? 'Checking...' : 'Check for Updates';

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Download size={24} color={Colors.light.primary} style={styles.icon} />
        <Text style={styles.title}>App Updates</Text>
      </View>
      <Text style={styles.description}>
        Installed version: {currentAppVersion()}. Checks for a newer version and installs it. The first time,
        Android asks you to allow installing apps from Duty Desk Tracker.
      </Text>
      <Button
        title={title}
        onPress={handleCheck}
        disabled={busy || Platform.OS !== 'android'}
        icon={<Download size={16} color="#fff" />}
      />
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
});
