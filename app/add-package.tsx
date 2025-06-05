import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Image,
  Platform
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { CameraView, useCameraPermissions } from 'expo-camera';
import Colors from '@/constants/colors';
import { usePackageStore } from '@/store/packageStore';
import { useMemberStore } from '@/store/memberStore';
import Button from '@/components/Button';
import { Camera, X, User, Plus } from 'lucide-react-native';

type PhotoType = 'package' | 'label' | 'storage';

export default function AddPackageScreen() {
  const router = useRouter();
  const { addPackage } = usePackageStore();
  const { members, addMember } = useMemberStore();
  const [permission, requestPermission] = useCameraPermissions();
  
  const [trackingNumber, setTrackingNumber] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState('');
  const [description, setDescription] = useState('');
  const [sender, setSender] = useState('');
  const [storageLocation, setStorageLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [addedBy, setAddedBy] = useState('');
  
  // Photo states
  const [packagePhotoUri, setPackagePhotoUri] = useState('');
  const [labelPhotoUri, setLabelPhotoUri] = useState('');
  const [storagePhotoUri, setStoragePhotoUri] = useState('');
  const [showCamera, setShowCamera] = useState(false);
  const [currentPhotoType, setCurrentPhotoType] = useState<PhotoType>('package');
  
  // New member creation
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  
  const handleTakePhoto = (photoType: PhotoType) => {
    if (!permission?.granted) {
      requestPermission();
      return;
    }
    setCurrentPhotoType(photoType);
    setShowCamera(true);
  };
  
  const handlePhotoTaken = () => {
    // In a real app, you would capture the photo here
    // For demo purposes, we'll use a placeholder URL
    const photoUri = `https://images.unsplash.com/photo-1566576912321-d58ddd7a6088?q=80&w=500&t=${Date.now()}`;
    
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
  };
  
  const handleCreateNewMember = () => {
    if (!newMemberName.trim()) {
      Alert.alert('Error', 'Please enter a member name.');
      return;
    }
    
    try {
      const memberData = {
        name: newMemberName.trim(),
        memberId: `PKG${Date.now()}`,
        joinDate: new Date(),
        ...(newMemberPhone.trim() && { phone: newMemberPhone.trim() }),
        ...(newMemberEmail.trim() && { email: newMemberEmail.trim() }),
      };
      
      const memberId = addMember(memberData);
      
      if (memberId) {
        setSelectedMemberId(memberId);
        setRecipientName(newMemberName.trim());
        setShowNewMemberForm(false);
        setNewMemberName('');
        setNewMemberPhone('');
        setNewMemberEmail('');
      } else {
        Alert.alert('Error', 'Failed to create member. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create member. Please try again.');
    }
  };
  
  const handleSubmit = () => {
    if (!trackingNumber.trim()) {
      Alert.alert('Error', 'Please enter a tracking number.');
      return;
    }
    
    if (!recipientName.trim()) {
      Alert.alert('Error', 'Please enter a recipient name.');
      return;
    }
    
    if (!selectedMemberId) {
      Alert.alert('Error', 'Please select a member or create a new one.');
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
    
    if (!addedBy.trim()) {
      Alert.alert('Error', 'Please enter who added this package.');
      return;
    }
    
    if (!packagePhotoUri || !labelPhotoUri || !storagePhotoUri) {
      Alert.alert('Error', 'Please take all required photos (package, label, and storage location).');
      return;
    }
    
    addPackage({
      trackingNumber: trackingNumber.trim(),
      recipientName: recipientName.trim(),
      memberId: selectedMemberId,
      description: description.trim(),
      sender: sender.trim(),
      storageLocation: storageLocation.trim(),
      notes: notes.trim() || undefined,
      packagePhotoUri,
      labelPhotoUri,
      storagePhotoUri,
      addedBy: addedBy.trim(),
    });
    
    Alert.alert('Success', 'Package added successfully!', [
      { text: 'OK', onPress: () => router.back() }
    ]);
  };
  
  if (showCamera) {
    return (
      <View style={styles.cameraContainer}>
        <Stack.Screen options={{ headerShown: false }} />
        
        {Platform.OS !== 'web' ? (
          <CameraView style={styles.camera} facing="back">
            <View style={styles.cameraOverlay}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowCamera(false)}
              >
                <X size={24} color="#fff" />
              </TouchableOpacity>
              
              <Text style={styles.cameraInstructions}>
                Take a photo of the {currentPhotoType === 'package' ? 'package' : 
                currentPhotoType === 'label' ? 'shipping label' : 'storage location'}
              </Text>
              
              <TouchableOpacity
                style={styles.captureButton}
                onPress={handlePhotoTaken}
              >
                <View style={styles.captureButtonInner} />
              </TouchableOpacity>
            </View>
          </CameraView>
        ) : (
          <View style={styles.webCameraFallback}>
            <Text style={styles.webCameraText}>Camera not available on web</Text>
            <Button
              title="Use Demo Photo"
              onPress={handlePhotoTaken}
              style={styles.webCameraButton}
            />
            <Button
              title="Cancel"
              onPress={() => setShowCamera(false)}
              variant="outline"
              style={styles.webCameraButton}
            />
          </View>
        )}
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
          <Text style={styles.sectionTitle}>Package Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tracking Number *</Text>
            <TextInput
              style={styles.input}
              value={trackingNumber}
              onChangeText={setTrackingNumber}
              placeholder="Enter tracking number"
              placeholderTextColor={Colors.light.subtext}
            />
          </View>
          
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
            <TextInput
              style={styles.input}
              value={sender}
              onChangeText={setSender}
              placeholder="Sender name or company"
              placeholderTextColor={Colors.light.subtext}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Storage Location *</Text>
            <TextInput
              style={styles.input}
              value={storageLocation}
              onChangeText={setStorageLocation}
              placeholder="e.g., Shelf A-3, Room 101"
              placeholderTextColor={Colors.light.subtext}
            />
          </View>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recipient Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Recipient Name *</Text>
            <TextInput
              style={styles.input}
              value={recipientName}
              onChangeText={setRecipientName}
              placeholder="Full name of recipient"
              placeholderTextColor={Colors.light.subtext}
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Assign to Member *</Text>
            
            {!showNewMemberForm ? (
              <View style={styles.memberSelection}>
                <ScrollView 
                  style={styles.memberList}
                  contentContainerStyle={styles.memberListContent}
                >
                  {members.map(member => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberItem,
                        selectedMemberId === member.id && styles.selectedMemberItem
                      ]}
                      onPress={() => {
                        if (member.id) {
                          setSelectedMemberId(member.id);
                          setRecipientName(member.name);
                        }
                      }}
                    >
                      <User size={20} color={Colors.light.primary} />
                      <View style={styles.memberInfo}>
                        <Text style={styles.memberName}>{member.name}</Text>
                        <Text style={styles.memberId}>ID: {member.memberId}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                
                <TouchableOpacity
                  style={styles.newMemberButton}
                  onPress={() => setShowNewMemberForm(true)}
                >
                  <Plus size={20} color={Colors.light.primary} />
                  <Text style={styles.newMemberButtonText}>Create New Member</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.newMemberForm}>
                <Text style={styles.newMemberTitle}>Create New Member</Text>
                
                <TextInput
                  style={styles.input}
                  value={newMemberName}
                  onChangeText={setNewMemberName}
                  placeholder="Full name *"
                  placeholderTextColor={Colors.light.subtext}
                />
                
                <TextInput
                  style={styles.input}
                  value={newMemberPhone}
                  onChangeText={setNewMemberPhone}
                  placeholder="Phone number (optional)"
                  placeholderTextColor={Colors.light.subtext}
                  keyboardType="phone-pad"
                />
                
                <TextInput
                  style={styles.input}
                  value={newMemberEmail}
                  onChangeText={setNewMemberEmail}
                  placeholder="Email address (optional)"
                  placeholderTextColor={Colors.light.subtext}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                
                <View style={styles.newMemberActions}>
                  <Button
                    title="Cancel"
                    onPress={() => setShowNewMemberForm(false)}
                    variant="outline"
                    style={styles.newMemberActionButton}
                  />
                  <Button
                    title="Create"
                    onPress={handleCreateNewMember}
                    style={styles.newMemberActionButton}
                  />
                </View>
              </View>
            )}
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
            <Text style={styles.label}>Added By *</Text>
            <TextInput
              style={styles.input}
              value={addedBy}
              onChangeText={setAddedBy}
              placeholder="Your name or duty officer"
              placeholderTextColor={Colors.light.subtext}
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
  memberSelection: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  memberList: {
    maxHeight: 200,
  },
  memberListContent: {
    padding: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectedMemberItem: {
    backgroundColor: Colors.light.secondary,
  },
  memberInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  memberId: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  newMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  newMemberButtonText: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  newMemberForm: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  newMemberTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  newMemberActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  newMemberActionButton: {
    flex: 1,
    marginHorizontal: 4,
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
    alignItems: 'center',
    padding: 20,
  },
  closeButton: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
  cameraInstructions: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 16,
    borderRadius: 12,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  webCameraFallback: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    padding: 20,
  },
  webCameraText: {
    fontSize: 18,
    color: Colors.light.text,
    marginBottom: 20,
    textAlign: 'center',
  },
  webCameraButton: {
    width: 200,
    marginVertical: 8,
  },
});