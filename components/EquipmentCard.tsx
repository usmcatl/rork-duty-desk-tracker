import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { Equipment } from '@/types/equipment';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useMemberStore } from '@/store/memberStore';
import Colors from '@/constants/colors';
import { Info, CheckCircle, AlertCircle, AlertTriangle, Calendar, User } from 'lucide-react-native';

interface EquipmentCardProps {
  equipment: Equipment;
}

export default function EquipmentCard({ equipment }: EquipmentCardProps) {
  const router = useRouter();
  const { checkoutRecords } = useEquipmentStore();
  const { getMemberById } = useMemberStore();
  
  // Get current checkout record if equipment is checked out
  const currentCheckout = checkoutRecords.find(
    record => record.equipmentId === equipment.id && !record.returnDate
  );
  
  // Check if equipment is overdue
  const isOverdue = currentCheckout && new Date() > new Date(currentCheckout.expectedReturnDate);
  const daysOverdue = currentCheckout && isOverdue 
    ? Math.ceil((new Date().getTime() - new Date(currentCheckout.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  // Get member info if checked out
  const currentMember = currentCheckout ? getMemberById(currentCheckout.memberId) : null;
  
  const handlePress = () => {
    router.push(`/equipment/${equipment.id}`);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatMemberDisplay = (member: any) => {
    if (!member) return 'Unknown Member';
    
    let display = member.name;
    if (member.aliases && member.aliases.length > 0) {
      display += ` "${member.aliases[0]}"`;
    }
    return display;
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isOverdue && styles.overdueContainer
      ]}
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
        
        {/* Checkout Information */}
        {currentCheckout && (
          <View style={[
            styles.checkoutInfo,
            isOverdue && styles.overdueCheckoutInfo
          ]}>
            <View style={styles.checkoutRow}>
              <User size={14} color={isOverdue ? Colors.light.error : Colors.light.primary} />
              <Text style={[
                styles.checkoutText,
                isOverdue && styles.overdueText
              ]} numberOfLines={1}>
                {formatMemberDisplay(currentMember)}
              </Text>
            </View>
            
            <View style={styles.checkoutRow}>
              <Calendar size={14} color={isOverdue ? Colors.light.error : Colors.light.primary} />
              <Text style={[
                styles.checkoutText,
                isOverdue && styles.overdueText
              ]}>
                Due: {formatDate(currentCheckout.expectedReturnDate)}
              </Text>
              {isOverdue && (
                <Text style={styles.overdueDays}>
                  ({daysOverdue}d overdue)
                </Text>
              )}
            </View>
          </View>
        )}
      </View>
      
      <View style={[
        styles.statusBadge, 
        equipment.status === 'available' ? styles.availableBadge : 
        isOverdue ? styles.overdueBadge : styles.checkedOutBadge
      ]}>
        {equipment.status === 'available' ? (
          <CheckCircle size={14} color={Colors.light.success} />
        ) : isOverdue ? (
          <AlertTriangle size={14} color="#fff" />
        ) : (
          <AlertCircle size={14} color={Colors.light.error} />
        )}
        <Text style={[
          styles.statusText,
          equipment.status === 'available' ? styles.availableText : styles.checkedOutText
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
  overdueContainer: {
    borderWidth: 2,
    borderColor: Colors.light.error,
    shadowColor: Colors.light.error,
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
    marginBottom: 8,
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
  checkoutInfo: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
    padding: 12,
    marginTop: 8,
  },
  overdueCheckoutInfo: {
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(220, 20, 60, 0.3)',
  },
  checkoutRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkoutText: {
    fontSize: 12,
    color: Colors.light.text,
    marginLeft: 6,
    fontWeight: '500',
    flex: 1,
  },
  overdueText: {
    color: Colors.light.error,
  },
  overdueDays: {
    fontSize: 12,
    color: Colors.light.error,
    fontWeight: '600',
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
  overdueBadge: {
    backgroundColor: 'rgba(220, 20, 60, 0.95)',
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
    color: '#fff',
  },
});