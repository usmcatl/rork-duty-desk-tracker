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
import Button from '@/components/Button';
import { 
  Settings, 
  User, 
  Trash2, 
  Info, 
  ChevronRight, 
  Plus,
  X,
  FileText,
  Download,
  Upload,
  Cloud,
  Users,
  Shield,
  Clock,
  Tablet,
  Calendar
} from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as DocumentPicker from 'expo-document-picker';
import * as WebBrowser from 'expo-web-browser';
import * as LocalAuthentication from 'expo-local-authentication';
import { convertToCSV, parseFromCSV, convertMembersToCSV, parseMembersFromCSV } from '@/utils/csvUtils';

// Import Sharing conditionally for platform compatibility
let Sharing: any = null;
if (Platform.OS !== 'web') {
  // Only import on native platforms
  Sharing = require('expo-sharing');
}

export default function SettingsScreen() {
  const { 
    equipment, 
    checkoutRecords, 
    getDutyOfficers, 
    setDutyOfficers,
    setEquipment,
    setCheckoutRecords,
    clearAllData
  } = useEquipmentStore();
  
  const {
    members,
    clearAllMembers
  } = useMemberStore();
  
  const {
    currentShift,
    shiftHistory,
    getShiftHistory,
    clearShiftData
  } = useShiftStore();
  
  const [dutyOfficers, setLocalDutyOfficers] = useState<string[]>([]);
  const [newOfficer, setNewOfficer] = useState('');
  const [isAddingOfficer, setIsAddingOfficer] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [lastBackupDate, setLastBackupDate] = useState<string | null>(null);
  const [biometricType, setBiometricType] = useState<string | null>(null);
  const [showShiftHistory, setShowShiftHistory] = useState(false);
  
  // Load duty officers when component mounts
  useEffect(() => {
    setLocalDutyOfficers(getDutyOfficers());
    
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
    
    // Check for last backup date in AsyncStorage
    const checkLastBackup = async () => {
      try {
        if (Platform.OS !== 'web') {
          const lastBackup = await FileSystem.readAsStringAsync(
            FileSystem.documentDirectory + 'lastBackup.txt'
          ).catch(() => null);
          
          if (lastBackup) {
            setLastBackupDate(lastBackup);
          }
        }
      } catch (error) {
        console.log('No previous backup found');
      }
    };
    
    checkLastBackup();
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
    setLocalDutyOfficers(updatedOfficers);
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
            setLocalDutyOfficers(updatedOfficers);
            setDutyOfficers(updatedOfficers);
          }
        }
      ]
    );
  };
  
  const handleExportData = async () => {
    // Require authentication for export
    const authenticated = await authenticateUser();
    if (!authenticated) {
      return; // Cancel the action if authentication fails
    }
    
    if (Platform.OS === 'web') {
      Alert.alert("Not Available", "Export functionality is not available on web");
      return;
    }
    
    try {
      setIsExporting(true);
      
      // Convert data to CSV
      const { equipmentCSV, checkoutRecordsCSV } = convertToCSV(equipment, checkoutRecords);
      const membersCSV = convertMembersToCSV(members);
      
      // Create temporary files
      const equipmentFilePath = `${FileSystem.cacheDirectory}equipment.csv`;
      const checkoutFilePath = `${FileSystem.cacheDirectory}checkouts.csv`;
      const membersFilePath = `${FileSystem.cacheDirectory}members.csv`;
      
      // Write data to files
      await FileSystem.writeAsStringAsync(equipmentFilePath, equipmentCSV);
      await FileSystem.writeAsStringAsync(checkoutFilePath, checkoutRecordsCSV);
      await FileSystem.writeAsStringAsync(membersFilePath, membersCSV);
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        // Share the files
        await Sharing.shareAsync(equipmentFilePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Equipment Data',
          UTI: 'public.comma-separated-values-text'
        });
        
        await Sharing.shareAsync(checkoutFilePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Checkout Records',
          UTI: 'public.comma-separated-values-text'
        });
        
        await Sharing.shareAsync(membersFilePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Export Members Data',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert("Export Failed", "There was an error exporting your data");
    } finally {
      setIsExporting(false);
    }
  };
  
  const handleImportData = async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Not Available", "Import functionality is not available on web");
      return;
    }
    
    Alert.alert(
      "Import Data",
      "This will replace all current data with the imported data. Continue?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Continue", 
          onPress: async () => {
            try {
              setIsImporting(true);
              
              // First, pick equipment CSV
              Alert.alert("Select Equipment CSV", "Please select the equipment CSV file");
              const equipmentResult = await DocumentPicker.getDocumentAsync({
                type: "text/csv",
                copyToCacheDirectory: true
              });
              
              if (equipmentResult.canceled) {
                setIsImporting(false);
                return;
              }
              
              // Then, pick checkout records CSV
              Alert.alert("Select Checkout Records CSV", "Please select the checkout records CSV file");
              const checkoutResult = await DocumentPicker.getDocumentAsync({
                type: "text/csv",
                copyToCacheDirectory: true
              });
              
              if (checkoutResult.canceled) {
                setIsImporting(false);
                return;
              }
              
              // Then, pick members CSV
              Alert.alert("Select Members CSV", "Please select the members CSV file");
              const membersResult = await DocumentPicker.getDocumentAsync({
                type: "text/csv",
                copyToCacheDirectory: true
              });
              
              if (membersResult.canceled) {
                setIsImporting(false);
                return;
              }
              
              // Read the files
              const equipmentCSV = await FileSystem.readAsStringAsync(equipmentResult.assets[0].uri);
              const checkoutRecordsCSV = await FileSystem.readAsStringAsync(checkoutResult.assets[0].uri);
              const membersCSV = await FileSystem.readAsStringAsync(membersResult.assets[0].uri);
              
              // Parse the CSV data
              const { equipment: newEquipment, checkoutRecords: newCheckoutRecords } = 
                parseFromCSV(equipmentCSV, checkoutRecordsCSV);
              
              const newMembers = parseMembersFromCSV(membersCSV);
              
              // Update the stores
              setEquipment(newEquipment);
              setCheckoutRecords(newCheckoutRecords);
              
              // Clear existing members and import new ones
              clearAllMembers();
              if (newMembers.length > 0) {
                // Import members one by one to generate new IDs
                newMembers.forEach(member => {
                  useMemberStore.getState().addMember({
                    memberId: member.memberId,
                    name: member.name,
                    phone: member.phone,
                    email: member.email,
                    address: member.address,
                    notes: member.notes,
                    joinDate: member.joinDate,
                    branch: member.branch,
                    status: member.status,
                    group: member.group
                  });
                });
              }
              
              Alert.alert("Import Successful", "Your data has been imported successfully");
            } catch (error) {
              console.error('Import error:', error);
              Alert.alert("Import Failed", "There was an error importing your data");
            } finally {
              setIsImporting(false);
            }
          }
        }
      ]
    );
  };
  
  const handleBackupToGoogleDrive = async () => {
    try {
      setIsBackingUp(true);
      
      if (Platform.OS === 'web') {
        Alert.alert("Not Available", "Google Drive backup is not available on web");
        return;
      }
      
      // Convert data to CSV
      const { equipmentCSV, checkoutRecordsCSV } = convertToCSV(equipment, checkoutRecords);
      const membersCSV = convertMembersToCSV(members);
      
      // Create temporary files
      const equipmentFilePath = `${FileSystem.documentDirectory}equipment_backup.csv`;
      const checkoutFilePath = `${FileSystem.documentDirectory}checkouts_backup.csv`;
      const membersFilePath = `${FileSystem.documentDirectory}members_backup.csv`;
      
      // Write data to files
      await FileSystem.writeAsStringAsync(equipmentFilePath, equipmentCSV);
      await FileSystem.writeAsStringAsync(checkoutFilePath, checkoutRecordsCSV);
      await FileSystem.writeAsStringAsync(membersFilePath, membersCSV);
      
      // Save backup timestamp
      const now = new Date().toLocaleString();
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + 'lastBackup.txt',
        now
      );
      setLastBackupDate(now);
      
      // Open Google Drive in browser to manually upload files
      // In a production app, you would use Google Drive API for direct upload
      Alert.alert(
        "Files Ready for Upload",
        "The backup files have been created. Would you like to open Google Drive to upload them?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Open Google Drive", 
            onPress: () => {
              WebBrowser.openBrowserAsync('https://drive.google.com');
              
              // After browser is opened, show instructions
              setTimeout(() => {
                Alert.alert(
                  "Upload Instructions",
                  "1. Sign in to your Google account\n2. Click '+ New' button\n3. Select 'File upload'\n4. Navigate to the app's documents folder\n5. Upload equipment_backup.csv, checkouts_backup.csv, and members_backup.csv files"
                );
              }, 1000);
            }
          }
        ]
      );
    } catch (error) {
      console.error('Backup error:', error);
      Alert.alert("Backup Failed", "There was an error creating your backup");
    } finally {
      setIsBackingUp(false);
    }
  };
  
  const handleRestoreFromGoogleDrive = async () => {
    try {
      setIsRestoring(true);
      
      if (Platform.OS === 'web') {
        Alert.alert("Not Available", "Google Drive restore is not available on web");
        return;
      }
      
      Alert.alert(
        "Restore from Google Drive",
        "This will replace all current data with the data from your Google Drive backup. Continue?",
        [
          { text: "Cancel", style: "cancel" },
          { 
            text: "Continue", 
            onPress: async () => {
              // In a production app, you would use Google Drive API for direct download
              // For this demo, we'll use DocumentPicker to select files downloaded from Google Drive
              
              // First, instruct user to download files from Google Drive
              Alert.alert(
                "Download Instructions",
                "1. Open Google Drive and download your backup files\n2. When prompted, select the files to restore",
                [
                  { text: "Cancel", style: "cancel" },
                  { 
                    text: "I've Downloaded the Files", 
                    onPress: async () => {
                      // First, pick equipment CSV
                      Alert.alert("Select Equipment CSV", "Please select the equipment backup CSV file");
                      const equipmentResult = await DocumentPicker.getDocumentAsync({
                        type: "text/csv",
                        copyToCacheDirectory: true
                      });
                      
                      if (equipmentResult.canceled) {
                        setIsRestoring(false);
                        return;
                      }
                      
                      // Then, pick checkout records CSV
                      Alert.alert("Select Checkout Records CSV", "Please select the checkout records backup CSV file");
                      const checkoutResult = await DocumentPicker.getDocumentAsync({
                        type: "text/csv",
                        copyToCacheDirectory: true
                      });
                      
                      if (checkoutResult.canceled) {
                        setIsRestoring(false);
                        return;
                      }
                      
                      // Then, pick members CSV
                      Alert.alert("Select Members CSV", "Please select the members backup CSV file");
                      const membersResult = await DocumentPicker.getDocumentAsync({
                        type: "text/csv",
                        copyToCacheDirectory: true
                      });
                      
                      if (membersResult.canceled) {
                        setIsRestoring(false);
                        return;
                      }
                      
                      // Read the files
                      const equipmentCSV = await FileSystem.readAsStringAsync(equipmentResult.assets[0].uri);
                      const checkoutRecordsCSV = await FileSystem.readAsStringAsync(checkoutResult.assets[0].uri);
                      const membersCSV = await FileSystem.readAsStringAsync(membersResult.assets[0].uri);
                      
                      // Parse the CSV data
                      const { equipment: newEquipment, checkoutRecords: newCheckoutRecords } = 
                        parseFromCSV(equipmentCSV, checkoutRecordsCSV);
                      
                      const newMembers = parseMembersFromCSV(membersCSV);
                      
                      // Update the stores
                      setEquipment(newEquipment);
                      setCheckoutRecords(newCheckoutRecords);
                      
                      // Clear existing members and import new ones
                      clearAllMembers();
                      if (newMembers.length > 0) {
                        // Import members one by one to generate new IDs
                        newMembers.forEach(member => {
                          useMemberStore.getState().addMember({
                            memberId: member.memberId,
                            name: member.name,
                            phone: member.phone,
                            email: member.email,
                            address: member.address,
                            notes: member.notes,
                            joinDate: member.joinDate,
                            branch: member.branch,
                            status: member.status,
                            group: member.group
                          });
                        });
                      }
                      
                      Alert.alert("Restore Successful", "Your data has been restored successfully");
                    }
                  }
                ]
              );
            }
          }
        ]
      );
    } catch (error) {
      console.error('Restore error:', error);
      Alert.alert("Restore Failed", "There was an error restoring your data");
    } finally {
      setIsRestoring(false);
    }
  };
  
  const handleClearData = async () => {
    // Require authentication for clearing data
    const authenticated = await authenticateUser();
    if (!authenticated) {
      return; // Cancel the action if authentication fails
    }
    
    Alert.alert(
      "Clear All Data",
      "Are you sure you want to clear all equipment, checkout records, member data, and shift history? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Clear All Data", 
          style: "destructive",
          onPress: () => {
            clearAllData();
            clearAllMembers();
            clearShiftData();
            Alert.alert("Success", "All data has been cleared.");
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
          
          {/* Google Drive Backup */}
          <View style={styles.dataManagementCard}>
            <View style={styles.dataManagementHeader}>
              <Cloud size={24} color={Colors.light.primary} style={styles.dataManagementIcon} />
              <Text style={styles.dataManagementTitle}>Google Drive Backup</Text>
            </View>
            
            <Text style={styles.dataManagementDescription}>
              Back up your equipment, checkout, and member data to your Google Drive account for safekeeping.
            </Text>
            
            {lastBackupDate && (
              <View style={styles.lastBackupContainer}>
                <Text style={styles.lastBackupText}>
                  Last backup: {lastBackupDate}
                </Text>
              </View>
            )}
            
            <View style={styles.dataManagementButtons}>
              <Button
                title={isBackingUp ? "Backing Up..." : "Backup to Drive"}
                onPress={handleBackupToGoogleDrive}
                disabled={isBackingUp || Platform.OS === 'web'}
                icon={<Upload size={16} color="#fff" />}
                style={styles.dataManagementButton}
              />
              
              <Button
                title={isRestoring ? "Restoring..." : "Restore from Drive"}
                onPress={handleRestoreFromGoogleDrive}
                disabled={isRestoring || Platform.OS === 'web'}
                variant="outline"
                icon={<Download size={16} color={Colors.light.primary} />}
                style={styles.dataManagementButton}
              />
            </View>
            
            {Platform.OS === 'web' && (
              <Text style={styles.webNotice}>
                Google Drive backup is not available on web. Please use the mobile app.
              </Text>
            )}
          </View>
          
          {/* CSV Export/Import */}
          <View style={styles.dataManagementCard}>
            <View style={styles.dataManagementHeader}>
              <FileText size={24} color={Colors.light.primary} style={styles.dataManagementIcon} />
              <Text style={styles.dataManagementTitle}>CSV Export/Import</Text>
            </View>
            
            <Text style={styles.dataManagementDescription}>
              Export your equipment, checkout, and member data to CSV files for backup or transfer to another device.
            </Text>
            
            <View style={styles.dataManagementButtons}>
              <Button
                title={isExporting ? "Exporting..." : "Export to CSV"}
                onPress={handleExportData}
                disabled={isExporting || Platform.OS === 'web'}
                icon={<Download size={16} color="#fff" />}
                style={styles.dataManagementButton}
              />
              
              <Button
                title={isImporting ? "Importing..." : "Import from CSV"}
                onPress={handleImportData}
                disabled={isImporting || Platform.OS === 'web'}
                variant="outline"
                icon={<Upload size={16} color={Colors.light.primary} />}
                style={styles.dataManagementButton}
              />
            </View>
            
            {Platform.OS === 'web' && (
              <Text style={styles.webNotice}>
                Export and import functionality is not available on web. Please use the mobile app.
              </Text>
            )}
          </View>
          
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
            <Text style={styles.versionText}>Version 1.0.0</Text>
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