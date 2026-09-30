import React, { useState, useEffect } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  TextInput,
  Platform,
  Linking
} from 'react-native';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useMemberStore } from '@/store/memberStore';
import { useShiftStore } from '@/store/shiftStore';
import { usePackageStore } from '@/store/packageStore';
import Button from '@/components/Button';
import SheetSyncCard from '@/components/SheetSyncCard';
import { useSyncStore } from '@/store/syncStore';
import { 
  Settings, 
  User, 
  Trash2, 
  Info, 
  ChevronRight, 
  Plus,
  X,
  Cloud,
  Users,
  Shield,
  Clock,
  Tablet,
  Calendar
} from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';
import Constants from 'expo-constants';

export default function SettingsScreen() {
  const { 
    equipment, 
    checkoutRecords, 
    getDutyOfficers, 
    setDutyOfficers,
    clearAllData
  } = useEquipmentStore();
  
  const {
    members,
    clearAllMembers
  } = useMemberStore();

  const clearPackages = usePackageStore((state) => state.clearAllData);
  
  const {
    currentShift,
    shiftHistory,
    getShiftHistory,
    clearShiftData
  } = useShiftStore();
  
  const dutyOfficers = useEquipmentStore((state) => state.dutyOfficers);
  const [newOfficer, setNewOfficer] = useState('');
  const [isAddingOfficer, setIsAddingOfficer] = useState(false);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [showShiftHistory, setShowShiftHistory] = useState(false);
  
  // Load duty officers when component mounts
  useEffect(() => {
    
    // Check for biometric authentication availability
    const checkBiometrics = async () => {
      if (Platform.OS !== 'web') {
        const hasHardware = await LocalAuthentication.hasHardwareAsync();
        const isEnrolled = await LocalAuthentication.isEnrolledAsync();
        
        if (hasHardware && isEnrolled) {
          const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();
          if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
            setBiometricType('Fingerprint');
          } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
            setBiometricType('Face ID');
          } else {
            setBiometricType('Biometric');
          }
        }
      }
    };
    
    checkBiometrics();
    
  }, [getDutyOfficers]);
  
  const totalEquipment = equipment.length;
  const checkedOutCount = equipment.filter(item => item.status === 'checked-out').length;
  const totalCheckouts = checkoutRecords.length;
  const totalMembers = members.length;
  const totalShifts = getShiftHistory().length + (currentShift ? 1 : 0);
  
  const authenticateUser = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // For web, authentication is not available, so cancel the action
      Alert.alert(
        "Authentication Required",
        "Device authentication is required for this action. This feature is not available on web.",
        [{ text: "OK" }]
      );
      return false;
    }
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        // Authentication not available, cancel the action
        Alert.alert(
          "Authentication Required",
          "Device authentication is required for this action. Please set up biometric authentication or passcode in your device settings.",
          [{ text: "OK" }]
        );
        return false;
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to continue',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });
      
      return result.success;
    } catch (error) {
      console.error('Authentication error:', error);
      Alert.alert(
        "Authentication Error",
        "An error occurred during authentication. Please try again.",
        [{ text: "OK" }]
      );
      return false;
    }
  };
  
  const handleAddOfficer = () => {
    if (!newOfficer.trim()) {
      Alert.alert("Error", "Officer name cannot be empty");
      return;
    }
    
    const updatedOfficers = [...dutyOfficers, newOfficer.trim()];
    setDutyOfficers(updatedOfficers);
    setNewOfficer('');
    setIsAddingOfficer(false);
  };
  
  const handleRemoveOfficer = (officer: string) => {
    Alert.alert(
      "Remove Officer",
      `Are you sure you want to remove ${officer} from the duty officers list?`,
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Remove", 
          style: "destructive",
          onPress: () => {
            const updatedOfficers = dutyOfficers.filter(o => o !== officer);
            setDutyOfficers(updatedOfficers);
          }
        }
      ]
    );
  };
  
  const handleClearData = async () => {
    // Require authentication for clearing data
    const authenticated = await authenticateUser();
    if (!authenticated) {
      return; // Cancel the action if authentication fails
    }
    
    const syncConnected = Boolean(useSyncStore.getState().endpointUrl);

    Alert.alert(
      "Clear All Data",
      syncConnected
        ? "This clears all equipment, checkout records, members, packages, and shift history from THIS DEVICE only. The Google Sheet is not changed, and the data will download again on the next sync. To stop that, turn off sync first."
        : "Are you sure you want to clear all equipment, checkout records, members, packages, and shift history? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Clear All Data",
          style: "destructive",
          onPress: () => {
            // Forget sync history first so the emptied device is not pushed as mass deletions.
            useSyncStore.getState().resetSyncState();
            clearAllData();
            clearAllMembers();
            clearPackages();
            clearShiftData();
            Alert.alert("Success", "All data has been cleared from this device.");
          }
        }
      ]
    );
  };
  
  const formatShiftDuration = (start: Date, end?: Date) => {
    const endTime = end || new Date();
    const duration = endTime.getTime() - start.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Stats Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Statistics</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalEquipment}</Text>
              <Text style={styles.statLabel}>Total Equipment</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{checkedOutCount}</Text>
              <Text style={styles.statLabel}>Checked Out</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalMembers}</Text>
              <Text style={styles.statLabel}>Members</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{totalShifts}</Text>
              <Text style={styles.statLabel}>Total Shifts</Text>
            </View>
          </View>
        </View>
        
        {/* Current Shift Section */}
        {currentShift && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Current Shift</Text>
            <View style={styles.currentShiftCard}>
              <View style={styles.currentShiftHeader}>
                <Tablet size={24} color={Colors.light.primary} style={styles.currentShiftIcon} />
                <Text style={styles.currentShiftTitle}>Active Duty Officer</Text>
              </View>
              
              <Text style={styles.currentShiftOfficer}>{currentShift.dutyOfficer}</Text>
              <Text style={styles.currentShiftTime}>
                Started: {new Date(currentShift.startTime).toLocaleString()}
              </Text>
              <Text style={styles.currentShiftDuration}>
                Duration: {formatShiftDuration(new Date(currentShift.startTime))}
              </Text>
              
              {currentShift.notes && (
                <View style={styles.currentShiftNotes}>
                  <Text style={styles.currentShiftNotesTitle}>Shift Notes:</Text>
                  <Text style={styles.currentShiftNotesText}>{currentShift.notes}</Text>
                </View>
              )}
            </View>
          </View>
        )}
        
        {/* Shift History Section */}
        <View style={styles.section}>
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={() => setShowShiftHistory(!showShiftHistory)}
          >
            <View style={styles.settingLeft}>
              <Clock size={20} color={Colors.light.text} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>Shift History</Text>
            </View>
            <ChevronRight 
              size={20} 
              color={Colors.light.subtext} 
              style={{ transform: [{ rotate: showShiftHistory ? '90deg' : '0deg' }] }}
            />
          </TouchableOpacity>
          
          {showShiftHistory && (
            <View style={styles.shiftHistoryContainer}>
              {getShiftHistory().length > 0 ? (
                getShiftHistory().slice(0, 5).map(shift => (
                  <View key={shift.id} style={styles.shiftHistoryItem}>
                    <View style={styles.shiftHistoryHeader}>
                      <Text style={styles.shiftHistoryOfficer}>{shift.dutyOfficer}</Text>
                      <Text style={styles.shiftHistoryDuration}>
                        {formatShiftDuration(new Date(shift.startTime), shift.endTime ? new Date(shift.endTime) : undefined)}
                      </Text>
                    </View>
                    <Text style={styles.shiftHistoryDate}>
                      {new Date(shift.startTime).toLocaleDateString()} • {new Date(shift.startTime).toLocaleTimeString()}
                      {shift.endTime && ` - ${new Date(shift.endTime).toLocaleTimeString()}`}
                    </Text>
                    {shift.notes && (
                      <Text style={styles.shiftHistoryNotes} numberOfLines={2}>
                        {shift.notes}
                      </Text>
                    )}
                  </View>
                ))
              ) : (
                <Text style={styles.emptyText}>No shift history available</Text>
              )}
              
              {getShiftHistory().length > 5 && (
                <Text style={styles.moreHistoryText}>
                  +{getShiftHistory().length - 5} more shifts
                </Text>
              )}
            </View>
          )}
        </View>
        
        {/* Security Section */}
        {biometricType && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.securityCard}>
              <View style={styles.securityHeader}>
                <Shield size={24} color={Colors.light.primary} style={styles.securityIcon} />
                <Text style={styles.securityTitle}>{biometricType} Authentication</Text>
              </View>
              <Text style={styles.securityDescription}>
                {biometricType} authentication is enabled for sensitive operations like data export and clearing all data.
              </Text>
            </View>
          </View>
        )}
        
        {/* Duty Officers Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Duty Officers</Text>
          
          {dutyOfficers.map((officer, index) => (
            <View key={index} style={styles.officerItem}>
              <View style={styles.officerLeft}>
                <User size={20} color={Colors.light.text} style={styles.officerIcon} />
                <Text style={styles.officerName}>{officer}</Text>
              </View>
              <TouchableOpacity
                onPress={() => handleRemoveOfficer(officer)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <X size={20} color={Colors.light.error} />
              </TouchableOpacity>
            </View>
          ))}
          
          {isAddingOfficer ? (
            <View style={styles.addOfficerContainer}>
              <TextInput
                style={styles.officerInput}
                value={newOfficer}
                onChangeText={setNewOfficer}
                placeholder="Enter officer name"
                placeholderTextColor={Colors.light.subtext}
                autoFocus
              />
              <View style={styles.addOfficerButtons}>
                <Button
                  title="Cancel"
                  onPress={() => {
                    setIsAddingOfficer(false);
                    setNewOfficer('');
                  }}
                  variant="outline"
                  size="small"
                  style={styles.addOfficerButton}
                />
                <Button
                  title="Add"
                  onPress={handleAddOfficer}
                  size="small"
                  style={styles.addOfficerButton}
                />
              </View>
            </View>
          ) : (
            <Button
              title="Add Duty Officer"
              onPress={() => setIsAddingOfficer(true)}
              variant="outline"
              icon={<Plus size={16} color={Colors.light.primary} />}
              style={styles.addButton}
            />
          )}
        </View>
        
        {/* Data Management Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>
          
          <SheetSyncCard />
          
          
          <TouchableOpacity 
            style={styles.settingItem}
            onPress={handleClearData}
          >
            <View style={styles.settingLeft}>
              <Trash2 size={20} color={Colors.light.error} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: Colors.light.error }]}>
                Clear All Data
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.light.subtext} />
          </TouchableOpacity>
        </View>
        
        {/* About Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingLeft}>
              <Info size={20} color={Colors.light.text} style={styles.settingIcon} />
              <Text style={styles.settingLabel}>About Post 7 Duty Desk Tracker</Text>
            </View>
            <ChevronRight size={20} color={Colors.light.subtext} />
          </TouchableOpacity>
          
          <View style={styles.aboutContainer}>
            <Text style={styles.aboutText}>
              Created by James Turner for use at the American Legion Post No. 7 Lake Chapala for Duty Desk Officers. Please use this email should you run into any complex challenges: turnerii.james@gmail.com
            </Text>
          </View>
          
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {Constants.expoConfig?.version ?? "unknown"}</Text>
          </View>
        </View>
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
  section: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
    marginTop: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statItem: {
    width: '50%',
    alignItems: 'center',
    marginBottom: 16,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  currentShiftCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
  },
  currentShiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentShiftIcon: {
    marginRight: 12,
  },
  currentShiftTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  currentShiftOfficer: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 8,
  },
  currentShiftTime: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 4,
  },
  currentShiftDuration: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 12,
  },
  currentShiftNotes: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 12,
  },
  currentShiftNotesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  currentShiftNotesText: {
    fontSize: 14,
    color: Colors.light.subtext,
    lineHeight: 20,
  },
  shiftHistoryContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  shiftHistoryItem: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 12,
    marginBottom: 12,
  },
  shiftHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  shiftHistoryOfficer: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  shiftHistoryDuration: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  shiftHistoryDate: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginBottom: 4,
  },
  shiftHistoryNotes: {
    fontSize: 12,
    color: Colors.light.subtext,
    fontStyle: 'italic',
  },
  moreHistoryText: {
    fontSize: 12,
    color: Colors.light.subtext,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.subtext,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
  },
  securityCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  securityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  securityIcon: {
    marginRight: 12,
  },
  securityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  securityDescription: {
    fontSize: 14,
    color: Colors.light.subtext,
    lineHeight: 20,
  },
  officerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  officerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  officerIcon: {
    marginRight: 12,
  },
  officerName: {
    fontSize: 16,
    color: Colors.light.text,
  },
  addButton: {
    marginTop: 8,
  },
  addOfficerContainer: {
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
  officerInput: {
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
  },
  addOfficerButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  addOfficerButton: {
    marginLeft: 8,
    minWidth: 80,
  },
  dataManagementCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  dataManagementHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dataManagementIcon: {
    marginRight: 12,
  },
  dataManagementTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
  },
  dataManagementDescription: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 16,
    lineHeight: 20,
  },
  lastBackupContainer: {
    backgroundColor: Colors.light.secondary,
    padding: 8,
    borderRadius: 8,
    marginBottom: 16,
  },
  lastBackupText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontStyle: 'italic',
  },
  dataManagementButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dataManagementButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  webNotice: {
    fontSize: 14,
    color: Colors.light.error,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: Colors.light.text,
  },
  aboutContainer: {
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 16,
  },
  aboutText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 20,
    textAlign: 'center',
  },
  versionContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 40,
  },
  versionText: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
});