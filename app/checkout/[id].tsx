import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity,
  Alert,
  Platform,
  Switch,
  FlatList,
  Modal
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useMemberStore } from '@/store/memberStore';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import { Calendar, User, Phone, FileText, DollarSign, Search, ChevronRight, AlertTriangle } from 'lucide-react-native';

export default function CheckoutScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { equipment, checkoutEquipment, getDutyOfficers } = useEquipmentStore();
  const { members } = useMemberStore();
  
  const item = equipment.find(e => e.id === id);
  const dutyOfficers = getDutyOfficers();
  
  // Set default expected return date to 60 days from now (updated from 7 days)
  const defaultReturnDate = new Date();
  defaultReturnDate.setDate(defaultReturnDate.getDate() + 60);
  defaultReturnDate.setHours(23, 59, 59, 0);
  
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [showAdvisoryDialog, setShowAdvisoryDialog] = useState(false);
  const [notes, setNotes] = useState('');
  const [expectedReturnDate, setExpectedReturnDate] = useState<Date>(defaultReturnDate);
  const [selectedOfficer, setSelectedOfficer] = useState(dutyOfficers[0] || '');
  const [depositCollected, setDepositCollected] = useState(true);
  
  // Filter members based on search
  const filteredMembers = members.filter(member => {
    return searchQuery === '' || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone && member.phone.includes(searchQuery));
  });
  
  // Get selected member
  const selectedMember = members.find(m => m.id === selectedMemberId);
  
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
  
  if (item.status === 'checked-out') {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>This equipment is already checked out</Text>
        <Button 
          title="Go Back" 
          onPress={() => router.back()} 
          style={styles.button}
        />
      </View>
    );
  }
  
  const handleCheckout = () => {
    // Validate inputs
    if (!selectedMemberId) {
      Alert.alert("Error", "Please select a member");
      return;
    }
    
    if (!expectedReturnDate) {
      Alert.alert("Error", "Expected return date is required");
      return;
    }
    
    if (!selectedOfficer) {
      Alert.alert("Error", "Duty officer is required");
      return;
    }
    
    // Check if checkout period exceeds 180 days
    const checkoutDays = Math.ceil((expectedReturnDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    if (checkoutDays > 180) {
      Alert.alert("Error", "Equipment cannot be checked out for more than 180 days. Please select an earlier return date.");
      return;
    }
    
    if (!depositCollected && item.depositAmount) {
      Alert.alert(
        "Missing Deposit",
        "Are you sure you want to proceed without collecting the required deposit?",
        [
          {
            text: "Cancel",
            style: "cancel"
          },
          {
            text: "Proceed Anyway",
            style: "destructive",
            onPress: () => processCheckout(false)
          }
        ]
      );
    } else {
      processCheckout(depositCollected);
    }
  };
  
  const processCheckout = (depositWasCollected: boolean) => {
    // Create checkout record
    checkoutEquipment({
      equipmentId: id,
      memberId: selectedMemberId!,
      expectedReturnDate,
      checkoutNotes: notes.trim(),
      dutyOfficer: selectedOfficer,
      depositCollected: depositWasCollected && item.depositAmount ? item.depositAmount : 0,
    });
    
    // Navigate back to equipment details
    router.back();
  };
  
  const handleSetTomorrow = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(23, 59, 59, 0);
    setExpectedReturnDate(tomorrow);
  };
  
  const handleSetNextWeek = () => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(23, 59, 59, 0);
    setExpectedReturnDate(nextWeek);
  };
  
  const handleSet60Days = () => {
    const sixtyDays = new Date();
    sixtyDays.setDate(sixtyDays.getDate() + 60);
    sixtyDays.setHours(23, 59, 59, 0);
    setExpectedReturnDate(sixtyDays);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  };
  
  const handleSelectMember = (memberId: string) => {
    setSelectedMemberId(memberId);
    setShowMemberSearch(false);
  };
  
  const handleAddNewMemberAttempt = () => {
    setShowAdvisoryDialog(true);
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Check Out Equipment",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.primary,
        }} 
      />
      
      {/* Advisory Dialog */}
      <Modal
        visible={showAdvisoryDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAdvisoryDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={24} color={Colors.light.flagRed} />
              <Text style={styles.modalTitle}>Feature Pending Department Advisory</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Member management features are currently pending department advisory approval.
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="Understood"
                onPress={() => setShowAdvisoryDialog(false)}
                style={styles.modalButton}
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
            Checking Out: <Text style={styles.equipmentName}>{item.name}</Text>
          </Text>
        </View>
        
        {/* Member Selection */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <User size={20} color={Colors.light.primary} />
            <Text style={styles.inputLabel}>Select Member*</Text>
          </View>
          
          {selectedMember ? (
            <View style={styles.selectedMemberContainer}>
              <View style={styles.selectedMemberInfo}>
                <Text style={styles.selectedMemberName}>{selectedMember.name}</Text>
                <Text style={styles.selectedMemberId}>ID: {selectedMember.memberId}</Text>
                {selectedMember.phone && (
                  <Text style={styles.selectedMemberPhone}>
                    Phone: {selectedMember.phone}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                style={styles.changeMemberButton}
                onPress={() => setShowMemberSearch(true)}
              >
                <Text style={styles.changeMemberButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              style={styles.selectMemberButton}
              onPress={() => setShowMemberSearch(true)}
            >
              <Text style={styles.selectMemberButtonText}>
                Select a Member
              </Text>
              <ChevronRight size={20} color={Colors.light.primary} />
            </TouchableOpacity>
          )}
        </View>
        
        {showMemberSearch && (
          <View style={styles.memberSearchContainer}>
            <View style={styles.searchInputContainer}>
              <Search size={20} color={Colors.light.subtext} style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search members..."
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholderTextColor={Colors.light.subtext}
                autoFocus
              />
            </View>
            
            <FlatList
              data={filteredMembers}
              keyExtractor={(item) => item.id}
              style={styles.membersList}
              contentContainerStyle={styles.membersListContent}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.memberItem}
                  onPress={() => handleSelectMember(item.id)}
                >
                  <View>
                    <Text style={styles.memberItemName}>{item.name}</Text>
                    <Text style={styles.memberItemId}>ID: {item.memberId}</Text>
                  </View>
                  <ChevronRight size={20} color={Colors.light.subtext} />
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyMembersList}>
                  <Text style={styles.emptyMembersText}>
                    No members found. Try a different search.
                  </Text>
                  <Text style={styles.emptyMembersSubtext}>
                    Member creation is pending department advisory.
                  </Text>
                </View>
              }
            />
            
            <View style={styles.memberSearchActions}>
              <Button
                title="Cancel"
                onPress={() => setShowMemberSearch(false)}
                variant="outline"
                style={styles.memberSearchButton}
              />
              <Button
                title="Add New Member"
                onPress={handleAddNewMemberAttempt}
                style={[styles.memberSearchButton, styles.disabledButton]}
                disabled={true}
              />
            </View>
          </View>
        )}
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Calendar size={20} color={Colors.light.primary} />
            <Text style={styles.inputLabel}>Expected Return Date*</Text>
          </View>
          
          <View style={styles.dateOptions}>
            <TouchableOpacity 
              style={styles.dateOption}
              onPress={handleSetTomorrow}
            >
              <Text style={[
                styles.dateOptionText,
                new Date(expectedReturnDate).toDateString() === 
                new Date(new Date().setDate(new Date().getDate() + 1)).toDateString() && 
                styles.selectedDateOption
              ]}>
                Tomorrow
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateOption}
              onPress={handleSetNextWeek}
            >
              <Text style={[
                styles.dateOptionText,
                new Date(expectedReturnDate).toDateString() === 
                new Date(new Date().setDate(new Date().getDate() + 7)).toDateString() && 
                styles.selectedDateOption
              ]}>
                Next Week
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.dateOption}
              onPress={handleSet60Days}
            >
              <Text style={[
                styles.dateOptionText,
                new Date(expectedReturnDate).toDateString() === 
                new Date(new Date().setDate(new Date().getDate() + 60)).toDateString() && 
                styles.selectedDateOption
              ]}>
                60 Days (Standard)
              </Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.calendarButton}
            onPress={() => {
              // In a real implementation, this would open a date picker
              Alert.alert(
                "Select Date",
                "In a production app, this would open a calendar date picker. For this demo, we're using preset dates."
              );
            }}
          >
            <View style={styles.selectedDate}>
              <Calendar size={20} color={Colors.light.primary} style={styles.calendarIcon} />
              <Text style={styles.selectedDateText}>
                {formatDate(expectedReturnDate)}
              </Text>
            </View>
          </TouchableOpacity>
          
          <Text style={styles.dateHelp}>
            Standard checkout period is 60 days. Maximum allowed is 180 days.
          </Text>
        </View>
        
        <View style={styles.depositContainer}>
          <View style={styles.depositHeader}>
            <DollarSign size={20} color={Colors.light.primary} />
            <Text style={styles.depositLabel}>
              Required Deposit: ${item.depositAmount?.toFixed(2) || '0.00'}
            </Text>
          </View>
          
          <View style={styles.depositToggleContainer}>
            <Text style={styles.depositToggleLabel}>
              Deposit collected?
            </Text>
            <Switch
              value={depositCollected}
              onValueChange={setDepositCollected}
              trackColor={{ false: Colors.light.border, true: Colors.light.primary }}
              thumbColor="#fff"
            />
          </View>
          
          {!depositCollected && (
            <Text style={styles.depositWarning}>
              Warning: Equipment should not be checked out without collecting the deposit.
            </Text>
          )}
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <FileText size={20} color={Colors.light.primary} />
            <Text style={styles.inputLabel}>Notes (Optional)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes about this checkout"
            placeholderTextColor={Colors.light.subtext}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Duty Officer*</Text>
          <Dropdown
            options={dutyOfficers}
            value={selectedOfficer}
            onSelect={setSelectedOfficer}
            placeholder="Select duty officer"
          />
        </View>
        
        <Button
          title="Check Out Equipment"
          onPress={handleCheckout}
          style={styles.checkoutButton}
          disabled={!selectedMemberId}
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
    marginBottom: 24,
  },
  equipmentInfoTitle: {
    fontSize: 16,
    color: Colors.light.text,
  },
  equipmentName: {
    fontWeight: '600',
    color: Colors.light.primary,
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
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
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
  dateOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  dateOption: {
    marginRight: 8,
    marginBottom: 8,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dateOptionText: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  selectedDateOption: {
    color: Colors.light.primary,
    fontWeight: '600',
  },
  calendarButton: {
    marginBottom: 8,
  },
  selectedDate: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calendarIcon: {
    marginRight: 8,
  },
  selectedDateText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  dateHelp: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginTop: 4,
    fontStyle: 'italic',
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
    fontStyle: 'italic',
  },
  checkoutButton: {
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
  selectMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectMemberButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
  },
  selectedMemberContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  selectedMemberInfo: {
    flex: 1,
  },
  selectedMemberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  selectedMemberId: {
    fontSize: 14,
    color: Colors.light.primary,
    marginBottom: 2,
  },
  selectedMemberPhone: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  changeMemberButton: {
    backgroundColor: Colors.light.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  changeMemberButtonText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  memberSearchContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 20,
    padding: 12,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.light.text,
  },
  membersList: {
    maxHeight: 300,
  },
  membersListContent: {
    paddingBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  memberItemId: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  emptyMembersList: {
    padding: 16,
    alignItems: 'center',
  },
  emptyMembersText: {
    fontSize: 14,
    color: Colors.light.subtext,
    textAlign: 'center',
    marginBottom: 4,
  },
  emptyMembersSubtext: {
    fontSize: 12,
    color: Colors.light.error,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  memberSearchActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  memberSearchButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  disabledButton: {
    opacity: 0.5,
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
    fontSize: 18,
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
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    minWidth: 100,
  },
});