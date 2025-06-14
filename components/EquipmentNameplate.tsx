import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Equipment } from '@/types/equipment';
import Colors from '@/constants/colors';
import { CheckCircle, AlertCircle, Package, AlertTriangle, Calendar } from 'lucide-react-native';
import { useEquipmentStore } from '@/store/equipmentStore';

interface EquipmentNameplateProps {
  equipment: Equipment;
  showOverdueIndicator?: boolean;
}

export default function EquipmentNameplate({ equipment, showOverdueIndicator = false }: EquipmentNameplateProps) {
  const router = useRouter();
  const { checkoutRecords } = useEquipmentStore();
  
  const handlePress = () => {
    router.push(`/equipment/${equipment.id}`);
  };
  
  // Get the active checkout record for this equipment
  const activeCheckout = checkoutRecords.find(
    record => record.equipmentId === equipment.id && !record.returnDate
  );
  
  // Check if equipment is overdue
  const isOverdue = activeCheckout && activeCheckout.expectedReturnDate && 
    new Date(activeCheckout.expectedReturnDate) < new Date();
  
  const formatReturnDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isOverdue && showOverdueIndicator && styles.overdueContainer
      ]}
      onPress={handlePress}
    >
      <View style={styles.iconContainer}>
        <Package size={24} color={Colors.light.primary} />
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={1}>
            {equipment.name}
          </Text>
          {isOverdue && showOverdueIndicator && (
            <AlertTriangle size={16} color={Colors.light.flagRed} style={styles.overdueIcon} />
          )}
        </View>
        
        <Text style={styles.description} numberOfLines={1}>
          {equipment.category}
        </Text>
        
        {/* Show return date for checked-out equipment */}
        {equipment.status === 'checked-out' && activeCheckout?.expectedReturnDate && (
          <View style={styles.returnDateContainer}>
            <Calendar size={12} color={isOverdue ? Colors.light.flagRed : Colors.light.subtext} />
            <Text style={[
              styles.returnDateText,
              isOverdue && styles.overdueText
            ]}>
              Due: {formatReturnDate(activeCheckout.expectedReturnDate)}
            </Text>
          </View>
        )}
      </View>
      
      <View style={[
        styles.statusContainer, 
        equipment.status === 'available' ? styles.availableStatus : 
        isOverdue ? styles.overdueStatus : styles.checkedOutStatus
      ]}>
        {equipment.status === 'available' ? (
          <CheckCircle size={16} color={Colors.light.success} />
        ) : isOverdue ? (
          <AlertTriangle size={16} color={Colors.light.flagRed} />
        ) : (
          <AlertCircle size={16} color={Colors.light.error} />
        )}
        <Text style={[
          styles.statusText,
          equipment.status === 'available' ? styles.availableText : 
          isOverdue ? styles.overdueText : styles.checkedOutText
        ]}>
          {equipment.status === 'available' ? 'Available' : 
           isOverdue ? 'Overdue' : 'Checked Out'}
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
  overdueContainer: {
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.flagRed,
    backgroundColor: 'rgba(220, 20, 60, 0.05)',
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  overdueIcon: {
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 4,
  },
  returnDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  returnDateText: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginLeft: 4,
    fontWeight: '500',
  },
  overdueText: {
    color: Colors.light.flagRed,
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
  overdueStatus: {
    backgroundColor: 'rgba(220, 20, 60, 0.15)',
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