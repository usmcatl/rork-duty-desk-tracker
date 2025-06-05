import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Equipment } from '@/types/equipment';
import Colors from '@/constants/colors';
import { Info, CheckCircle, AlertCircle } from 'lucide-react-native';

interface EquipmentCardProps {
  equipment: Equipment;
}

export default function EquipmentCard({ equipment }: EquipmentCardProps) {
  const router = useRouter();
  
  const handlePress = () => {
    router.push(`/equipment/${equipment.id}`);
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
    >
      <Image 
        source={{ uri: equipment.imageUri }} 
        style={styles.image}
        resizeMode="cover"
      />
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {equipment.name}
        </Text>
        
        <Text style={styles.description} numberOfLines={2}>
          {equipment.description}
        </Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.metaItem}>
            <Info size={14} color={Colors.light.subtext} />
            <Text style={styles.metaText}>{equipment.category}</Text>
          </View>
        </View>
      </View>
      
      <View style={[
        styles.statusBadge, 
        equipment.status === 'available' ? styles.availableBadge : styles.checkedOutBadge
      ]}>
        {equipment.status === 'available' ? (
          <CheckCircle size={14} color={Colors.light.success} />
        ) : (
          <AlertCircle size={14} color={Colors.light.error} />
        )}
        <Text style={[
          styles.statusText,
          equipment.status === 'available' ? styles.availableText : styles.checkedOutText
        ]}>
          {equipment.status === 'available' ? 'Available' : 'Checked Out'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 160,
    backgroundColor: '#E1E1E1',
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 12,
  },
  metaContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginLeft: 4,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  availableBadge: {
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
  },
  checkedOutBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  availableText: {
    color: Colors.light.success,
  },
  checkedOutText: {
    color: Colors.light.error,
  },
});