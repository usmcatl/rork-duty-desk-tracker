import React, { useState, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Alert,
  Platform,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useShiftStore } from '@/store/shiftStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import { 
  Tablet, 
  Key, 
  CheckSquare, 
  User, 
  Clock, 
  FileText,
  Shield,
  AlertTriangle,
  Package
} from 'lucide-react-native';
import * as LocalAuthentication from 'expo-local-authentication';

export default function TabletChangeoverScreen() {
  const router = useRouter();
  const { currentShift, startShift, endCurrentShift } = useShiftStore();
  const { equipment, getDutyOfficers } = useEquipmentStore();
  
  const [incomingOfficer, setIncomingOfficer] = useState('');
  const [tabletAcknowledged, setTabletAcknowledged] = useState(false);
  const [keysAcknowledged, setKeysAcknowledged] = useState(false);
  const [equipmentInspected, setEquipmentInspected] = useState(false);
  const [handoverNotes, setHandoverNotes] = useState('');
  const [endShiftNotes, setEndShiftNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSignatureModal, setShowSignatureModal] = useState(false);
  const [biometricConfirmed, setBiometricConfirmed] = useState(false);
  
  const dutyOfficers = getDutyOfficers();
  const totalEquipment = equipment.length;
  const checkedOutCount = equipment.filter(item => item.status === 'checked-out').length;
  const availableCount = totalEquipment - checkedOutCount;
  
  const authenticateUser = async (): Promise<boolean> => {
    if (Platform.OS === 'web') {
      // For web, just confirm with alert
      return new Promise((resolve) => {
        Alert.alert(
          "Confirm Identity",
          "Please confirm you are authorized to perform this tablet changeover.",
          [
            { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
            { text: "Confirm", onPress: () => resolve(true) }
          ]
        );
      });
    }
    
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      
      if (!hasHardware || !isEnrolled) {
        return new Promise((resolve) => {
          Alert.alert(
            "Confirm Identity",
            "Biometric authentication is not available. Please confirm you are authorized to perform this tablet changeover.",
            [
              { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
              { text: "Confirm", onPress: () => resolve(true) }
            ]
          );
        });
      }
      
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Authenticate to confirm tablet changeover',
        fallbackLabel: 'Use Passcode',
        cancelLabel: 'Cancel',
      });
      
      return result.success;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };
  
  const handleSubmit = async () => {
    if (!incomingOfficer.trim()) {
      Alert.alert("Error", "Please select the incoming duty officer");
      return;
    }
    
    if (!tabletAcknowledged) {
      Alert.alert("Error", "Please acknowledge receipt of the tablet");
      return;
    }
    
    if (!keysAcknowledged) {
      Alert.alert("Error", "Please acknowledge receipt of the keys");
      return;
    }
    
    if (!equipmentInspected) {
      Alert.alert("Error", "Please confirm that equipment has been inspected");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Authenticate the user
      const authenticated = await authenticateUser();
      if (!authenticated) {
        setIsSubmitting(false);
        return;
      }
      
      setBiometricConfirmed(true);
      
      // End current shift if one exists
      if (currentShift) {
        endCurrentShift(endShiftNotes);
      }
      
      // Start new shift
      const shiftNotes = [
        handoverNotes,
        `Equipment Status: ${availableCount} available, ${checkedOutCount} checked out`,
        currentShift ? `Handover from: ${currentShift.dutyOfficer}` : 'Initial shift start'
      ].filter(Boolean).join('\n\n');
      
      startShift({
        dutyOfficer: incomingOfficer,
        previousOfficer: currentShift?.dutyOfficer,
        tabletAcknowledged: true,
        keysAcknowledged: true,
        equipmentInspected: true,
        notes: shiftNotes,
        biometricConfirmed: true,
      });
      
      Alert.alert(
        "Changeover Complete",
        `Tablet changeover completed successfully. ${incomingOfficer} is now on duty.`,
        [
          {
            text: "OK",
            onPress: () => router.back()
          }
        ]
      );
      
    } catch (error) {
      console.error('Changeover error:', error);
      Alert.alert("Error", "There was an error completing the changeover. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleCancel = () => {
    Alert.alert(
      "Cancel Changeover",
      "Are you sure you want to cancel the tablet changeover?",
      [
        { text: "Continue Changeover", style: "cancel" },
        { 
          text: "Cancel", 
          style: "destructive",
          onPress: () => router.back()
        }
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Tablet size={32} color={Colors.light.primary} />
          </View>
          <Text style={styles.title}>Tablet Changeover</Text>
          <Text style={styles.subtitle}>
            Complete the duty officer changeover process
          </Text>
        </View>
        
        {/* Current Shift Info */}
        {currentShift && (
          <View style={styles.currentShiftCard}>
            <View style={styles.currentShiftHeader}>
              <Clock size={20} color={Colors.light.primary} />
              <Text style={styles.currentShiftTitle}>Current Shift</Text>
            </View>
            
            <View style={styles.currentShiftInfo}>
              <Text style={styles.currentShiftOfficer}>
                {currentShift.dutyOfficer}
              </Text>
              <Text style={styles.currentShiftTime}>
                Started: {new Date(currentShift.startTime).toLocaleString()}
              </Text>
              <Text style={styles.currentShiftDuration}>
                Duration: {Math.floor((new Date().getTime() - new Date(currentShift.startTime).getTime()) / (1000 * 60 * 60))} hours
              </Text>
            </View>
            
            {currentShift && (
              <View style={styles.endShiftSection}>
                <Text style={styles.sectionLabel}>End of Shift Notes (Optional)</Text>
                <TextInput
                  style={styles.textArea}
                  value={endShiftNotes}
                  onChangeText={setEndShiftNotes}
                  placeholder="Any issues, observations, or notes for the incoming officer..."
                  placeholderTextColor={Colors.light.subtext}
                  multiline
                  numberOfLines={3}
                />
              </View>
            )}
          </View>
        )}
        
        {/* Equipment Status */}
        <View style={styles.statusCard}>
          <View style={styles.statusHeader}>
            <Package size={20} color={Colors.light.primary} />
            <Text style={styles.statusTitle}>Equipment Status</Text>
          </View>
          
          <View style={styles.statusGrid}>
            <View style={styles.statusItem}>
              <Text style={styles.statusNumber}>{totalEquipment}</Text>
              <Text style={styles.statusLabel}>Total Equipment</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusNumber, { color: Colors.light.success }]}>
                {availableCount}
              </Text>
              <Text style={styles.statusLabel}>Available</Text>
            </View>
            <View style={styles.statusItem}>
              <Text style={[styles.statusNumber, { color: Colors.light.flagRed }]}>
                {checkedOutCount}
              </Text>
              <Text style={styles.statusLabel}>Checked Out</Text>
            </View>
          </View>
        </View>
        
        {/* Incoming Officer Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Incoming Duty Officer</Text>
          <Dropdown
            label="Select Duty Officer"
            value={incomingOfficer}
            onSelect={setIncomingOfficer}
            options={dutyOfficers}
            placeholder="Choose the incoming duty officer"
          />
        </View>
        
        {/* Acknowledgments */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Acknowledgments</Text>
          
          <TouchableOpacity 
            style={styles.checkboxItem}
            onPress={() => setTabletAcknowledged(!tabletAcknowledged)}
          >
            <View style={[styles.checkbox, tabletAcknowledged && styles.checkboxChecked]}>
              {tabletAcknowledged && <CheckSquare size={16} color="#fff" />}
            </View>
            <View style={styles.checkboxContent}>
              <View style={styles.checkboxHeader}>
                <Tablet size={20} color={Colors.light.primary} />
                <Text style={styles.checkboxTitle}>Tablet Received</Text>
              </View>
              <Text style={styles.checkboxDescription}>
                I acknowledge receipt of the duty desk tablet and confirm it is in working condition
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.checkboxItem}
            onPress={() => setKeysAcknowledged(!keysAcknowledged)}
          >
            <View style={[styles.checkbox, keysAcknowledged && styles.checkboxChecked]}>
              {keysAcknowledged && <CheckSquare size={16} color="#fff" />}
            </View>
            <View style={styles.checkboxContent}>
              <View style={styles.checkboxHeader}>
                <Key size={20} color={Colors.light.primary} />
                <Text style={styles.checkboxTitle}>Keys Received</Text>
              </View>
              <Text style={styles.checkboxDescription}>
                I acknowledge receipt of all necessary keys and access cards for the duty desk
              </Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.checkboxItem}
            onPress={() => setEquipmentInspected(!equipmentInspected)}
          >
            <View style={[styles.checkbox, equipmentInspected && styles.checkboxChecked]}>
              {equipmentInspected && <CheckSquare size={16} color="#fff" />}
            </View>
            <View style={styles.checkboxContent}>
              <View style={styles.checkboxHeader}>
                <AlertTriangle size={20} color={Colors.light.primary} />
                <Text style={styles.checkboxTitle}>Equipment Inspected</Text>
              </View>
              <Text style={styles.checkboxDescription}>
                I confirm that I have inspected the equipment status and reviewed any outstanding issues
              </Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Handover Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Handover Notes</Text>
          <TextInput
            style={styles.textArea}
            value={handoverNotes}
            onChangeText={setHandoverNotes}
            placeholder="Any important information for the incoming officer (optional)..."
            placeholderTextColor={Colors.light.subtext}
            multiline
            numberOfLines={4}
          />
        </View>
        
        {/* Authentication Status */}
        {biometricConfirmed && (
          <View style={styles.authStatus}>
            <Shield size={20} color={Colors.light.success} />
            <Text style={styles.authStatusText}>Identity Confirmed</Text>
          </View>
        )}
      </ScrollView>
      
      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <Button
          title="Cancel"
          onPress={handleCancel}
          variant="outline"
          style={styles.actionButton}
        />
        <Button
          title={isSubmitting ? "Completing..." : "Complete Changeover"}
          onPress={handleSubmit}
          disabled={isSubmitting || !incomingOfficer || !tabletAcknowledged || !keysAcknowledged || !equipmentInspected}
          style={styles.actionButton}
        />
      </View>
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
    paddingBottom: 100,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: Colors.light.subtext,
    textAlign: 'center',
  },
  currentShiftCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  currentShiftHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  currentShiftTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  currentShiftInfo: {
    marginBottom: 16,
  },
  currentShiftOfficer: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  currentShiftTime: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 2,
  },
  currentShiftDuration: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  endShiftSection: {
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    paddingTop: 16,
  },
  statusCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  statusGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusItem: {
    alignItems: 'center',
  },
  statusNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.primary,
    marginBottom: 4,
  },
  statusLabel: {
    fontSize: 12,
    color: Colors.light.subtext,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  checkboxChecked: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  checkboxContent: {
    flex: 1,
  },
  checkboxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  checkboxTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  checkboxDescription: {
    fontSize: 14,
    color: Colors.light.subtext,
    lineHeight: 20,
  },
  textArea: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  authStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  authStatusText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.success,
    marginLeft: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingTop: 12,
    backgroundColor: Colors.light.background,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});