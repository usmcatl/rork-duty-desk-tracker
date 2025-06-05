import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Alert,
  Platform,
  Switch
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useMemberStore } from '@/store/memberStore';
import Button from '@/components/Button';
import { FileText, CheckCircle, DollarSign, AlertCircle, User } from 'lucide-react-native';

export default function ReturnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { equipment, checkoutRecords, returnEquipment } = useEquipmentStore();
  const { getMemberById } = useMemberStore();
  
  const item = equipment.find(e => e.id === id);
  
  const [returnNotes, setReturnNotes] = useState('');
  const [depositReturned, setDepositReturned] = useState(true);
  const [returnReason, setReturnReason] = useState('');
  
  if (!item) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Equipment not found</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.button}
        />
      </View>
    );
  }
  
  if (item.status === 'available') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>This equipment is not checked out</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.button}
        />
      </View>
    );
  }
  
  // Find the active checkout record
  const activeCheckout = checkoutRecords.find(
    record => record.equipmentId === id && !record.returnDate
  );
  
  if (!activeCheckout) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No active checkout found for this equipment</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.button}
        />
      </View>
    );
  }
  
  // Get member information
  const member = getMemberById(activeCheckout.memberId);
  
  // Calculate refund amount (75% of original deposit)
  const originalDeposit = activeCheckout.depositCollected || 0;
  const refundAmount = originalDeposit * 0.75;
  
  const handleReturn = () => {
    // If deposit is not being returned, require a reason
    if (!depositReturned && activeCheckout.depositCollected && activeCheckout.depositCollected > 0) {
      if (!returnReason.trim()) {
        Alert.alert("Error", "Please provide a reason for not returning the deposit");
        return;
      }
      
      // Confirm with the user
      Alert.alert(
        "Confirm Deposit Withholding",
        `You are about to withhold a deposit refund of $${refundAmount.toFixed(2)}. Continue?`,
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Confirm",
            onPress: () => processReturn()
          }
        ]
      );
    } else {
      processReturn();
    }
  };
  
  const processReturn = () => {
    // Combine notes with deposit reason if applicable
    let finalNotes = returnNotes.trim();
    if (!depositReturned && returnReason.trim()) {
      finalNotes = `${finalNotes}

Deposit not returned reason: ${returnReason.trim()}`;
    }
    
    returnEquipment(id, finalNotes, depositReturned);
    router.back();
  };
  
  // Check if the equipment is overdue
  const isOverdue = activeCheckout.expectedReturnDate && 
    new Date() > new Date(activeCheckout.expectedReturnDate);
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Return Equipment",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.primary,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.equipmentInfo}>
          <Text style={styles.equipmentInfoTitle}>
            Returning: <Text style={styles.equipmentName}>{item.name}</Text>
          </Text>
        </View>
        
        <View style={styles.memberInfo}>
          <View style={styles.memberInfoHeader}>
            <User size={20} color={Colors.light.primary} />
            <Text style={styles.memberInfoTitle}>Member Information</Text>
          </View>
          
          <View style={styles.memberDetails}>
            <Text style={styles.memberName}>
              {member ? member.name : 'Unknown Member'}
            </Text>
            {member && (
              <>
                <Text style={styles.memberId}>ID: {member.memberId}</Text>
                {member.phone && (
                  <Text style={styles.memberPhone}>Phone: {member.phone}</Text>
                )}
              </>
            )}
          </View>
        </View>
        
        <View style={styles.checkoutInfo}>
          <Text style={styles.checkoutInfoTitle}>Checkout Information</Text>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Checkout Date:</Text>
            <Text style={styles.infoValue}>
              {new Date(activeCheckout.checkoutDate).toLocaleDateString()}
            </Text>
          </View>
          
          {activeCheckout.expectedReturnDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Expected Return:</Text>
              <Text style={[
                styles.infoValue,
                isOverdue && styles.overdueText
              ]}>
                {new Date(activeCheckout.expectedReturnDate).toLocaleDateString()}
                {isOverdue && " (OVERDUE)"}
              </Text>
            </View>
          )}
          
          {activeCheckout.checkoutNotes && (
            <View style={styles.notesRow}>
              <Text style={styles.notesLabel}>Checkout Notes:</Text>
              <Text style={styles.notesValue}>{activeCheckout.checkoutNotes}</Text>
            </View>
          )}
        </View>
        
        {activeCheckout.depositCollected !== undefined && activeCheckout.depositCollected > 0 && (
          <View style={styles.depositContainer}>
            <View style={styles.depositHeader}>
              <DollarSign size={20} color={Colors.light.primary} />
              <Text style={styles.depositLabel}>
                Deposit Information
              </Text>
            </View>
            
            <View style={styles.depositDetails}>
              <View style={styles.depositRow}>
                <Text style={styles.depositItemLabel}>Original Deposit:</Text>
                <Text style={styles.depositItemValue}>${originalDeposit.toFixed(2)}</Text>
              </View>
              
              <View style={styles.depositRow}>
                <Text style={styles.depositItemLabel}>Refund Amount (75%):</Text>
                <Text style={styles.depositItemValue}>${refundAmount.toFixed(2)}</Text>
              </View>
            </View>
            
            <View style={styles.depositToggleContainer}>
              <Text style={styles.depositToggleLabel}>
                Return deposit to borrower?
              </Text>
              <Switch
                value={depositReturned}
                onValueChange={setDepositReturned}
                trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                thumbColor="#fff"
              />
            </View>
            
            {!depositReturned && (
              <>
                <Text style={styles.depositWarning}>
                  Please provide a reason for not returning the deposit:
                </Text>
                <TextInput
                  style={styles.reasonInput}
                  value={returnReason}
                  onChangeText={setReturnReason}
                  placeholder="Equipment damaged, missing parts, etc."
                  placeholderTextColor={Colors.light.subtext}
                  multiline
                  textAlignVertical="top"
                />
              </>
            )}
          </View>
        )}
        
        {isOverdue && (
          <View style={styles.overdueContainer}>
            <View style={styles.overdueHeader}>
              <AlertCircle size={20} color={Colors.light.error} />
              <Text style={styles.overdueTitle}>Equipment is Overdue</Text>
            </View>
            <Text style={styles.overdueDescription}>
              This equipment was due to be returned on {new Date(activeCheckout.expectedReturnDate).toLocaleDateString()}.
              Consider discussing late fees or deposit withholding with the borrower.
            </Text>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <FileText size={20} color={Colors.light.primary} />
            <Text style={styles.inputLabel}>Return Notes (Optional)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={returnNotes}
            onChangeText={setReturnNotes}
            placeholder="Add any notes about the condition of the equipment or other return details"
            placeholderTextColor={Colors.light.subtext}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <Button
          title="Confirm Return"
          onPress={handleReturn}
          style={styles.returnButton}
          icon={<CheckCircle size={20} color="#fff" />}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  equipmentInfo: {
    backgroundColor: Colors.light.secondary,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  equipmentInfoTitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  equipmentName: {
    fontWeight: '600',
    color: Colors.light.primary,
  },
  memberInfo: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  memberInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  memberInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  memberDetails: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  memberId: {
    fontSize: 14,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  memberPhone: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  checkoutInfo: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  checkoutInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.subtext,
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  overdueText: {
    color: Colors.light.error,
    fontWeight: '500',
  },
  notesRow: {
    marginTop: 8,
  },
  notesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.subtext,
    marginBottom: 4,
  },
  notesValue: {
    fontSize: 14,
    color: Colors.light.text,
    backgroundColor: Colors.light.background,
    padding: 8,
    borderRadius: 8,
  },
  depositContainer: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  depositHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  depositLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  depositDetails: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  depositRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  depositItemLabel: {
    fontSize: 14,
    color: Colors.light.text,
  },
  depositItemValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  depositToggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  depositToggleLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  depositWarning: {
    fontSize: 14,
    color: Colors.light.error,
    fontWeight: '500',
    marginBottom: 8,
  },
  reasonInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 60,
    borderWidth: 1,
    borderColor: Colors.light.error,
  },
  overdueContainer: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.error,
  },
  overdueHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  overdueTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.error,
    marginLeft: 8,
  },
  overdueDescription: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 8,
  },
  notesInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  returnButton: {
    marginTop: 12,
    marginBottom: 24,
  },
  errorText: {
    fontSize: 18,
    color: Colors.light.error,
    textAlign: 'center',
    marginBottom: 16,
    marginTop: 24,
  },
  button: {
    alignSelf: 'center',
  },
});