import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { CheckoutRecord } from '@/types/equipment';
import { Equipment } from '@/types/equipment';
import { useMemberStore } from '@/store/memberStore';
import { CheckSquare, Package, User } from 'lucide-react-native';

interface CheckoutHistoryItemProps {
  record: CheckoutRecord;
  equipment: Equipment;
  showEquipmentName?: boolean;
  showMemberName?: boolean;
}

export default function CheckoutHistoryItem({ 
  record, 
  equipment, 
  showEquipmentName = false,
  showMemberName = false 
}: CheckoutHistoryItemProps) {
  const router = useRouter();
  const { getMemberById } = useMemberStore();
  
  const member = getMemberById(record.memberId);
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };
  
  const formatMemberDisplay = (memberData: any) => {
    let display = memberData.name;
    if (memberData.aliases && memberData.aliases.length > 0) {
      display += ` "${memberData.aliases.join('", "')}"`;
    }
    return display;
  };
  
  const handleEquipmentPress = () => {
    router.push(`/equipment/${equipment.id}`);
  };
  
  const handleMemberPress = () => {
    if (member) {
      router.push(`/member/${member.id}`);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        {record.returnDate ? (
          <Package size={20} color={Colors.light.success} />
        ) : (
          <CheckSquare size={20} color={Colors.light.primary} />
        )}
      </View>
      
      <View style={styles.content}>
        {showEquipmentName && (
          <TouchableOpacity onPress={handleEquipmentPress}>
            <Text style={[styles.equipmentName, styles.linkText]}>{equipment.name}</Text>
          </TouchableOpacity>
        )}
        
        {showMemberName && member && (
          <TouchableOpacity onPress={handleMemberPress}>
            <Text style={[styles.memberName, styles.linkText]}>
              {formatMemberDisplay(member)}
            </Text>
          </TouchableOpacity>
        )}
        
        <Text style={styles.dateText}>
          Checked out: {formatDate(record.checkoutDate)}
        </Text>
        
        {record.returnDate && (
          <Text style={styles.returnText}>
            Returned: {formatDate(record.returnDate)}
          </Text>
        )}
        
        {record.checkoutNotes && (
          <Text style={styles.notesText}>Checkout notes: {record.checkoutNotes}</Text>
        )}
        
        {record.returnNotes && (
          <Text style={styles.notesText}>Return notes: {record.returnNotes}</Text>
        )}
      </View>
      
      <View style={[
        styles.statusBadge,
        record.returnDate ? styles.returnedBadge : styles.checkedOutBadge
      ]}>
        <Text style={[
          styles.statusText,
          record.returnDate ? styles.returnedText : styles.checkedOutText
        ]}>
          {record.returnDate ? 'Returned' : 'Checked Out'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  equipmentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  linkText: {
    color: Colors.light.primary,
    textDecorationLine: 'underline',
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 2,
  },
  returnText: {
    fontSize: 14,
    color: Colors.light.success,
    marginBottom: 2,
  },
  notesText: {
    fontSize: 12,
    color: Colors.light.subtext,
    fontStyle: 'italic',
    marginTop: 4,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  checkedOutBadge: {
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
  },
  returnedBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  checkedOutText: {
    color: Colors.light.flagRed,
  },
  returnedText: {
    color: Colors.light.success,
  },
});