import React, { useRef, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  Image,
  Modal,
  ActivityIndicator
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { usePackageStore } from '@/store/packageStore';
import { useMemberStore } from '@/store/memberStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import { Camera, X, User, Plus, ChevronDown, Check, AlertTriangle } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { persistPhoto } from '@/utils/photoStorage';
import { Member } from '@/types/member';
import { memberStatusColor, memberSubtitle, membershipWarningText, needsMembershipWarning } from '@/utils/memberUtils';

type PhotoType = 'package' | 'label' | 'storage';

const SENDER_OPTIONS = [
  'Amazon',
  'FedEx', 
  'UPS',
  'DHL',
  'USPS',
  'Walmart',
  'Mercado Libre',
  'Temu',
  'Other'
];

const STORAGE_LOCATIONS = ['Bar Storage', 'Package Cage'];

export default function AddPackageScreen() {
  const router = useRouter();
  const { addPackage } = usePackageStore();
  const { members, searchMembers } = useMemberStore();
  const { getDutyOfficers } = useEquipmentStore();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [recipientName, setRecipientName] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [description, setDescription] = useState('');
  const [sender, setSender] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [receivedBy, setReceivedBy] = useState('');
  
  // Photo states
  const [packagePhotoUri, setPackagePhotoUri] = useState('');
  const [labelPhotoUri, setLabelPhotoUri] = useState('');
  const [storagePhotoUri, setStoragePhotoUri] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType>('package');
  const [cameraReady, setCameraReady] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  
  // Member search and selection
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState(members);
  
  
  // Get duty officers from settings
  const dutyOfficers = getDutyOfficers();
  
  const handleMemberSearch = (query: string) => {
    setMemberSearchQuery(query);
    setRecipientName(query);
    
    if (query.trim()) {
      const results = searchMembers(query);
      setFilteredMembers(results);
      setShowMemberDropdown(true);
    } else {
      setFilteredMembers(members);
      setShowMemberDropdown(false);
    }
  };
  
  const applyMemberSelection = (member: Member) => {
    setSelectedMemberId(member.id);
    setRecipientName(member.name);
    setMemberSearchQuery(member.name);
    setShowMemberDropdown(false);
  };

  const handleMemberSelect = (member: Member) => {
    if (!needsMembershipWarning(member)) {
      applyMemberSelection(member);
      return;
    }
    setShowMemberDropdown(false);
    Alert.alert(
      'Membership Not Current',
      `${membershipWarningText(member)}\n\nYou can still log this package, but please remind them to renew when they pick it up.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Log Package Anyway', onPress: () => applyMemberSelection(member) },
      ]
    );
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  
  const handleTakePhoto = async (photoType: PhotoType) => {
    // Check camera permissions
    if (!permission) {
      return;
    }

    if (!permission.granted) {
      const result = await requestPermission();
      if (!result.granted) {
        Alert.alert('Permission Required', 'Camera permission is required to take photos.');
        return;
      }
    }

    setCurrentPhotoType(photoType);
    setCameraReady(false);
    setShowCamera(true);
  };

  const handlePhotoTaken = async () => {
    if (!cameraRef.current || !cameraReady || isCapturing) {
      return;
    }

    setIsCapturing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.6 });
      if (!photo?.uri) {
        throw new Error('Camera returned no image');
      }
      const photoUri = await persistPhoto(photo.uri, `package-${currentPhotoType}`);

      switch (currentPhotoType) {
        case 'package':
          setPackagePhotoUri(photoUri);
          break;
        case 'label':
          setLabelPhotoUri(photoUri);
          break;
        case 'storage':
          setStoragePhotoUri(photoUri);
          break;
      }

      setShowCamera(false);
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    } finally {
      setIsCapturing(false);
    }
  };
  
  const handleSubmit = () => {
    if (!recipientName.trim()) {
      Alert.alert('Error', 'Please enter a recipient name.');
      return;
    }
    
    if (!selectedMemberId) {
      Alert.alert('Error', 'Please select a member from the existing list.');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Please enter a package description.');
      return;
    }
    
    if (!sender.trim()) {
      Alert.alert('Error', 'Please enter the sender information.');
      return;
    }
    
    if (!storageLocation.trim()) {
      Alert.alert('Error', 'Please enter the storage location.');
      return;
    }
    
    if (!receivedBy.trim()) {
      Alert.alert('Error', 'Please select who received this package.');
      return;
    }
    
    if (!packagePhotoUri || !labelPhotoUri || !storagePhotoUri) {
      Alert.alert('Error', 'Please take all required photos (package, label, and storage location).');
      return;
    }
    
    addPackage({
      recipientName: recipientName.trim(),
      memberId: selectedMemberId,
      description: description.trim(),
      sender: sender.trim(),
      storageLocation: storageLocation.trim(),
      notes: notes.trim() || undefined,
      packagePhotoUri,
      labelPhotoUri,
      storagePhotoUri,
      addedBy: receivedBy.trim(),
    });
    
    Alert.alert(
      'Package Added Successfully!', 
      'The package has been added to the system.',
      [
        { 
          text: 'Add Another Package', 
          onPress: () => {
            // Reset form for another package
            setRecipientName('');
            setSelectedMemberId('');
            setDescription('');
            setSender('');
            setStorageLocation('');
            setNotes('');
            setPackagePhotoUri('');
            setLabelPhotoUri('');
            setStoragePhotoUri('');
            setMemberSearchQuery('');
            // Keep receivedBy selected for convenience
          }
        },
        { 
          text: 'Return to Packages', 
          onPress: () => router.back() 
        }
      ]
    );
  };
  
  const formatMemberDisplay = (member: any) => {
    let display = member.name;
    if (member.aliases && member.aliases.length > 0) {
      display += ` "${member.aliases.join('", "')}"`;
    }
    return display;
  };
  
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing="back"
          onCameraReady={() => setCameraReady(true)}
        />
        <View style={[StyleSheet.absoluteFill, styles.cameraOverlay]}>
            <Text style={styles.cameraInstructions}>
              Take a photo of the {currentPhotoType === 'package' ? 'package' : 
              currentPhotoType === 'label' ? 'shipping label' : 'storage location'}
            </Text>
            
            <View style={styles.cameraControls}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => setShowCamera(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.captureButton, (!cameraReady || isCapturing) && styles.captureButtonDisabled]}
                onPress={handlePhotoTaken}
                disabled={!cameraReady || isCapturing}
              >
                {isCapturing ? (
                  <ActivityIndicator color={Colors.light.primary} />
                ) : (
                  <View style={styles.captureButtonInner} />
                )}
              </TouchableOpacity>

              <View style={styles.placeholder} />
            </View>
        </View>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: 'Add New Package' }} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Name *</Text>
            <View style={styles.memberSearchContainer}>
              <TextInput
                style={styles.input}
                value={recipientName}
                onChangeText={handleMemberSearch}
                placeholder="Start typing recipient name..."
                placeholderTextColor={Colors.light.subtext}
              />
              
              {showMemberDropdown && filteredMembers.length > 0 && (
                <View style={styles.memberDropdown}>
                  <ScrollView style={styles.memberDropdownScroll} nestedScrollEnabled={true}>
                    {filteredMembers.slice(0, 5).map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.memberDropdownItem}
                        onPress={() => handleMemberSelect(item)}
                      >
                        <User size={16} color={Colors.light.primary} />
                        <View style={styles.memberDropdownContent}>
                          <Text style={styles.memberDropdownName}>
                            {formatMemberDisplay(item)}
                          </Text>
                          <Text style={styles.memberDropdownId}>{memberSubtitle(item)}</Text>
                          {needsMembershipWarning(item) && (
                            <Text style={[styles.memberDropdownStatus, { color: memberStatusColor(item.status) }]}>
                              {item.status}: membership not current
                            </Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
            
            {selectedMember && needsMembershipWarning(selectedMember) && (
              <View style={styles.membershipWarning}>
                <AlertTriangle size={18} color={memberStatusColor(selectedMember.status)} />
                <Text style={[styles.membershipWarningText, { color: memberStatusColor(selectedMember.status) }]}>
                  {membershipWarningText(selectedMember)}
                </Text>
              </View>
            )}

            {!selectedMemberId && recipientName.trim() && (
              <Text style={styles.memberWarning}>
                Please select a member from the list.
              </Text>
            )}
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Package Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Description *</Text>
            <TextInput
              style={styles.input}
              value={description}
              onChangeText={setDescription}
              placeholder="Package description"
              placeholderTextColor={Colors.light.subtext}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Sender *</Text>
            <Dropdown
              options={SENDER_OPTIONS}
              value={sender}
              onSelect={setSender}
              placeholder="Select sender"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Storage Location *</Text>
            <Dropdown
              options={STORAGE_LOCATIONS}
              value={storageLocation}
              onSelect={setStorageLocation}
              placeholder="Select storage location"
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Required Photos</Text>
          
          <View style={styles.photoSection}>
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleTakePhoto('package')}
            >
              {packagePhotoUri ? (
                <Image source={{ uri: packagePhotoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Camera size={32} color={Colors.light.primary} />
                  <Text style={styles.photoButtonText}>Package Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleTakePhoto('label')}
            >
              {labelPhotoUri ? (
                <Image source={{ uri: labelPhotoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Camera size={32} color={Colors.light.primary} />
                  <Text style={styles.photoButtonText}>Label Photo</Text>
                </View>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.photoButton}
              onPress={() => handleTakePhoto('storage')}
            >
              {storagePhotoUri ? (
                <Image source={{ uri: storagePhotoUri }} style={styles.photoPreview} />
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Camera size={32} color={Colors.light.primary} />
                  <Text style={styles.photoButtonText}>Storage Photo</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Additional Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Received By *</Text>
            <Dropdown
              options={dutyOfficers}
              value={receivedBy}
              onSelect={setReceivedBy}
              placeholder="Select duty officer"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Additional notes about the package"
              placeholderTextColor={Colors.light.subtext}
              multiline
              numberOfLines={3}
            />
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Add Package"
          onPress={handleSubmit}
          style={styles.submitButton}
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
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
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  memberSearchContainer: {
    position: 'relative',
  },
  memberDropdown: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxHeight: 250,
    zIndex: 1000,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  memberDropdownScroll: {
    maxHeight: 200,
  },
  memberDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  memberDropdownContent: {
    marginLeft: 8,
    flex: 1,
  },
  memberDropdownName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
  },
  memberDropdownId: {
    fontSize: 12,
    color: Colors.light.subtext,
  },
  createMemberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.secondary,
  },
  disabledCreateMemberOption: {
    backgroundColor: Colors.light.border,
  },
  createMemberText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  disabledCreateMemberText: {
    color: Colors.light.subtext,
  },
  memberDropdownStatus: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  membershipWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    borderColor: Colors.light.warning,
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 8,
  },
  membershipWarningText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
  memberWarning: {
    fontSize: 12,
    color: Colors.light.error,
    marginTop: 4,
    fontStyle: 'italic',
  },
  photoSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoButton: {
    flex: 1,
    aspectRatio: 1,
    marginHorizontal: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPlaceholder: {
    flex: 1,
    backgroundColor: Colors.light.card,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
  },
  photoButtonText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
    marginTop: 8,
    textAlign: 'center',
  },
  photoPreview: {
    width: '100%',
    height: '100%',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.background,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  submitButton: {
    width: '100%',
  },
  cameraContainer: {
    flex: 1,
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    padding: 20,
  },
  cameraInstructions: {
    color: 'white',
    fontSize: 18,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    borderRadius: 8,
    marginTop: 50,
  },
  cameraControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 50,
  },
  cancelButton: {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.light.primary,
  },
  placeholder: {
    width: 80,
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