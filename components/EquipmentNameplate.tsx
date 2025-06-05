import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Equipment } from '@/types/equipment';
import Colors from '@/constants/colors';
import { CheckCircle, AlertCircle, Package } from 'lucide-react-native';

interface EquipmentNameplateProps {
  equipment: Equipment;
}

export default function EquipmentNameplate({ equipment }: EquipmentNameplateProps) {
  const router = useRouter();
  
  const handlePress = () => {
    router.push(`/equipment/${equipment.id}`);
  };
  
  return (
    <TouchableOpacity 
      style={styles.container}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <Package size={24} color={Colors.light.primary} />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>
          {equipment.name}
        </Text>
        
        <Text style={styles.description} numberOfLines={1}>
          {equipment.category}
        </Text>
      </View>
      
      <View style={[
        styles.statusContainer, 
        equipment.status === 'available' ? styles.availableStatus : styles.checkedOutStatus
      ]}>
        {equipment.status === 'available' ? (
          <CheckCircle size={16} color={Colors.light.success} />
        ) : (
          <AlertCircle size={16} color={Colors.light.error} />
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
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginLeft: 8,
  },
  availableStatus: {
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
  },
  checkedOutStatus: {
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