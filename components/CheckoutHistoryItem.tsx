import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { CheckoutRecord } from '@/types/equipment';
import { Calendar, Phone, User, Clock, DollarSign } from 'lucide-react-native';
import { useMemberStore } from '@/store/memberStore';

interface CheckoutHistoryItemProps {
  record: CheckoutRecord;
  equipment?: { id: string; name: string };
  showEquipmentName?: boolean;
}

export default function CheckoutHistoryItem({ 
  record, 
  equipment,
  showEquipmentName = false
}: CheckoutHistoryItemProps) {
  const router = useRouter();
  const { getMemberById } = useMemberStore();
  
  const member = getMemberById(record.memberId);
  
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };
  
  const isActive = !record.returnDate;
  const refundAmount = record.depositCollected ? record.depositCollected * 0.75 : 0;
  
  const handleMemberPress = () => {
    if (member) {
      router.push(`/member/${member.id}`);
    }
  };
  
  const handleEquipmentPress = () => {
    if (equipment) {
      router.push(`/equipment/${equipment.id}`);
    }
  };
  
  return (
    <View style={[styles.container, isActive && styles.activeContainer]}>
      <View style={styles.header}>
        <Text style={styles.title}>
          {isActive ? 'Currently Checked Out' : 'Previous Checkout'}
        </Text>
        <Text style={styles.date}>
          {formatDate(record.checkoutDate)}
          {record.returnDate ? ` - ${formatDate(record.returnDate)}` : ''}
        </Text>
      </View>
      
      <View style={styles.infoContainer}>
        {showEquipmentName && equipment && (
          <TouchableOpacity 
            style={styles.infoItem}
            onPress={handleEquipmentPress}
          >
            <Calendar size={16} color={Colors.light.primary} />
            <Text style={[styles.infoText, styles.linkText]}>
              Equipment: {equipment.name}
            </Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.infoItem}
          onPress={handleMemberPress}
        >
          <User size={16} color={Colors.light.primary} />
          <Text style={[styles.infoText, styles.linkText]}>
            {member ? member.name : 'Unknown Member'} 
            {member ? ` (${member.memberId})` : ''}
          </Text>
        </TouchableOpacity>
        
        {member?.phone && (
          <View style={styles.infoItem}>
            <Phone size={16} color={Colors.light.primary} />
            <Text style={styles.infoText}>{member.phone}</Text>
          </View>
        )}
        
        <View style={styles.infoItem}>
          <Clock size={16} color={Colors.light.primary} />
          <Text style={styles.infoText}>
            {record.expectedReturnDate 
              ? `Expected Return: ${formatDate(record.expectedReturnDate)}`
              : 'No return date specified'}
          </Text>
        </View>
        
        {record.depositCollected !== undefined && record.depositCollected > 0 && (
          <View style={styles.infoItem}>
            <DollarSign size={16} color={Colors.light.primary} />
            <Text style={styles.infoText}>
              Deposit: ${record.depositCollected.toFixed(2)}
              {record.returnDate && (
                record.depositReturned 
                  ? ` (Refunded: $${refundAmount.toFixed(2)})` 
                  : ' (Not Returned)'
              )}
            </Text>
          </View>
        )}
      </View>
      
      {record.checkoutNotes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Checkout Notes:</Text>
          <Text style={styles.notesText}>{record.checkoutNotes}</Text>
        </View>
      )}
      
      {record.returnNotes && (
        <View style={styles.notesContainer}>
          <Text style={styles.notesLabel}>Return Notes:</Text>
          <Text style={styles.notesText}>{record.returnNotes}</Text>
        </View>
      )}
      
      <Text style={styles.officerText}>
        Duty Officer: {record.dutyOfficer}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  activeContainer: {
    borderLeftColor: Colors.light.primary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  date: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  infoContainer: {
    marginBottom: 12,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
  },
  linkText: {
    color: Colors.light.primary,
    textDecorationLine: 'underline',
  },
  notesContainer: {
    backgroundColor: Colors.light.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  officerText: {
    fontSize: 12,
    color: Colors.light.subtext,
    fontStyle: 'italic',
    textAlign: 'right',
  },
});