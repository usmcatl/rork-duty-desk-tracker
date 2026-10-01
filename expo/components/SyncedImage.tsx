import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, ImageProps, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ImageOff } from 'lucide-react-native';
import Colors from '@/constants/colors';
import { resolvePhoto } from '@/utils/photoStorage';

type Props = Omit<ImageProps, 'source'> & { uri?: string };

/**
 * Shows a stored photo, fetching it from the Post's Drive backup when it was
 * taken on another tablet or before a reinstall.
 */
export default function SyncedImage({ uri, style, ...rest }: Props) {
  // undefined = still looking, null = not available anywhere
  const [resolved, setResolved] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    setResolved(undefined);
    resolvePhoto(uri)
      .then((result) => { if (!cancelled) setResolved(result); })
      .catch(() => { if (!cancelled) setResolved(null); });
    return () => { cancelled = true; };
  }, [uri]);

  if (resolved) {
    return <Image source={{ uri: resolved }} style={style} {...rest} />;
  }
  const boxStyle = [style as StyleProp<ViewStyle>, styles.placeholder];
  if (resolved === undefined) {
    return (
      <View style={boxStyle}>
        <ActivityIndicator color={Colors.light.primary} />
      </View>
    );
  }
  return (
    <View style={boxStyle}>
      <ImageOff size={24} color={Colors.light.subtext} />
      <Text style={styles.placeholderText}>Photo not available</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: Colors.light.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginTop: 4,
    textAlign: 'center',
  },
});
