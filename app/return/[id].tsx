import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Alert,
  Platform,
  Switch,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useMemberStore } from '@/store/memberStore';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import { FileText, CheckCircle, DollarSign, AlertCircle, User, Shield, RefreshCw, ArrowLeft, Eye } from 'lucide-react-native';

export default function ReturnScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { equipment, checkoutRecords, returnEquipment, renewEquipmentLease, getDutyOfficers } = useEquipmentStore();
  const { getMemberById } = useMemberStore();
  
  const item = equipment.find(e => e.id === id);
  
  const [returnNotes, setReturnNotes] = useState('');
  const [depositReturned, setDepositReturned] = useState(true);
  const [returnReason, setReturnReason] = useState('');
  const [collectedBy, setCollectedBy] = useState('');
  const [showRenewalDialog, setShowRenewalDialog] = useState(false);
  const [equipmentInspected, setEquipmentInspected] = useState(false);
  
  // Get duty officers from settings
  const dutyOfficers = getDutyOfficers();
  
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
  
  const handleRenewalDialogOpen = () => {
    setShowRenewalDialog(true);
    setEquipmentInspected(false); // Reset inspection checkbox
  };
  
  const handleRenewalConfirm = () => {
    if (!equipmentInspected) {
      Alert.alert(
        "Inspection Required",
        "Please confirm that the equipment has been inspected before renewing the lease."
      );
      return;
    }
    
    const success = renewEquipmentLease(id, 'Lease renewed via return screen - Equipment inspected and approved for continued use');
    if (success) {
      setShowRenewalDialog(false);
      Alert.alert(
        "Lease Renewed",
        "Equipment lease has been extended by 60 days. The equipment has been marked as inspected.",
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
    } else {
      Alert.alert("Error", "Failed to renew equipment lease");
    }
  };
  
  const handleRenewalCancel = () => {
    setShowRenewalDialog(false);
    setEquipmentInspected(false);
  };

  const handleReturnFromDialog = () => {
    setShowRenewalDialog(false);
    setEquipmentInspected(false);
    // Process the return immediately
    processReturn();
  };
  
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
    // If there's a deposit and it's being returned, require who collected it
    if (depositReturned && activeCheckout.depositCollected && activeCheckout.depositCollected > 0) {
      if (!collectedBy.trim()) {
        Alert.alert("Error", "Please select who collected the deposit");
        return;
      }
    }
    
    // Combine notes with deposit reason if applicable
    let finalNotes = returnNotes.trim();
    if (!depositReturned && returnReason.trim()) {
      finalNotes = `${finalNotes}

Deposit not returned reason: ${returnReason.trim()}`;
    }
    
    returnEquipment(id, finalNotes, depositReturned, collectedBy.trim() || undefined);
    router.back();
  };
  
  // Check if the equipment is overdue - fix TypeScript error
  const isOverdue = activeCheckout.expectedReturnDate && 
    new Date() > new Date(activeCheckout.expectedReturnDate);
  
  // Helper function to safely format expected return date
  const formatExpectedReturnDate = () => {
    if (!activeCheckout.expectedReturnDate) {
      return 'Unknown Date';
    }
    try {
      // Fix: Ensure we have a valid date before creating new Date
      const returnDate = activeCheckout.expectedReturnDate instanceof Date 
        ? activeCheckout.expectedReturnDate 
        : new Date(activeCheckout.expectedReturnDate);
      return returnDate.toLocaleDateString();
    } catch (error) {
      return 'Invalid Date';
    }
  };
  
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
      
      {/* Renewal Dialog Modal */}
      <Modal
        visible={showRenewalDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={handleRenewalCancel}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <RefreshCw size={24} color={Colors.light.primary} />
              <Text style={styles.modalTitle}>Renew Equipment Lease?</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Would you like to renew the equipment lease for another 60 days instead of returning it?
            </Text>
            
            {/* Equipment Inspection Acknowledgment */}
            <View style={styles.inspectionContainer}>
              <View style={styles.inspectionHeader}>
                <Eye size={20} color={Colors.light.primary} />
                <Text style={styles.inspectionTitle}>Equipment Inspection</Text>
              </View>
              
              <View style={styles.inspectionToggleContainer}>
                <Text style={styles.inspectionToggleLabel}>
                  I confirm that the equipment has been inspected and is in good working condition
                </Text>
                <Switch
                  value={equipmentInspected}
                  onValueChange={setEquipmentInspected}
                  trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
                  thumbColor="#fff"
                />
              </View>
              
              {!equipmentInspected && (
                <Text style={styles.inspectionWarning}>
                  Equipment inspection is required before renewing the lease
                </Text>
              )}
            </View>
            
            <View style={styles.modalButtons}>
              <Button
                title="Return Equipment"
                onPress={handleReturnFromDialog}
                style={[styles.modalButton, styles.cancelButton]}
                textStyle={styles.cancelButtonText}
                icon={<ArrowLeft size={18} color={Colors.light.subtext} />}
              />
              <Button
                title="Renew Lease"
                onPress={handleRenewalConfirm}
                style={[
                  styles.modalButton, 
                  styles.confirmButton,
                  !equipmentInspected && styles.disabledButton
                ]}
                icon={<RefreshCw size={18} color="#fff" />}
                disabled={!equipmentInspected}
              />
            </View>
          </View>
        </View>
      </Modal>
      
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
                {formatExpectedReturnDate()}
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
            
            {depositReturned && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Collected By *</Text>
                <Dropdown
                  options={dutyOfficers}
                  value={collectedBy}
                  onSelect={setCollectedBy}
                  placeholder="Select duty officer"
                />
              </View>
            )}
            
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
              This equipment was due to be returned on {formatExpectedReturnDate()}.
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
          title="Return Equipment"
          onPress={handleRenewalDialogOpen}
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
    marginBottom: 12,
  },
  depositToggleLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  inspectionContainer: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  inspectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  inspectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  inspectionToggleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  inspectionToggleLabel: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
    marginRight: 12,
    lineHeight: 20,
  },
  inspectionWarning: {
    fontSize: 12,
    color: Colors.light.error,
    fontStyle: 'italic',
    marginTop: 4,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
  },
  cancelButton: {
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  cancelButtonText: {
    color: Colors.light.subtext,
  },
  confirmButton: {
    backgroundColor: Colors.light.primary,
  },
  disabledButton: {
    backgroundColor: Colors.light.border,
    opacity: 0.6,
  },
});