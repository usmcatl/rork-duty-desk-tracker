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
  Platform,
  FlatList
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { usePackageStore } from '@/store/packageStore';
import { useMemberStore } from '@/store/memberStore';
import { DUTY_OFFICERS } from '@/constants/dutyOfficers';
import Button from '@/components/Button';
import { Camera, X, User, Plus, ChevronDown, Check } from 'lucide-react-native';

type PhotoType = 'package' | 'label' | 'storage';

export default function AddPackageScreen() {
  const router = useRouter();
  const { addPackage } = usePackageStore();
  const { members, addMember, searchMembers } = useMemberStore();
  
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
  
  // Member search and selection
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [filteredMembers, setFilteredMembers] = useState(members);
  
  // Duty officer dropdown
  const [showDutyOfficerDropdown, setShowDutyOfficerDropdown] = useState(false);
  
  // New member creation
  const [showNewMemberForm, setShowNewMemberForm] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberAliases, setNewMemberAliases] = useState('');
  
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
  
  const handleMemberSelect = (member: any) => {
    setSelectedMemberId(member.id);
    setRecipientName(member.name);
    setMemberSearchQuery(member.name);
    setShowMemberDropdown(false);
  };
  
  const handleTakePhoto = (photoType: PhotoType) => {
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
      const aliases = newMemberAliases.trim() 
        ? newMemberAliases.split(',').map(alias => alias.trim()).filter(Boolean)
        : undefined;
      
      const memberData = {
        name: newMemberName.trim(),
        memberId: `PKG${Date.now()}`,
        joinDate: new Date(),
        ...(newMemberPhone.trim() && { phone: newMemberPhone.trim() }),
        ...(newMemberEmail.trim() && { email: newMemberEmail.trim() }),
        ...(aliases && aliases.length > 0 && { aliases }),
      };
      
      const memberId = addMember(memberData);
      
      setSelectedMemberId(memberId);
      setRecipientName(newMemberName.trim());
      setShowNewMemberForm(false);
      setNewMemberName('');
      setNewMemberPhone('');
      setNewMemberEmail('');
      setNewMemberAliases('');
    } catch (error) {
      Alert.alert('Error', 'Failed to create member. Please try again.');
    }
  };
  
  const handleSubmit = () => {
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
      Alert.alert('Error', 'Please select who added this package.');
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
      addedBy: addedBy.trim(),
    });
    
    Alert.alert(
      'Success', 
      'Package added successfully!',
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
            // Keep addedBy selected for convenience
          }
        },
        { 
          text: 'Done', 
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
        
        <View style={styles.webCameraFallback}>
          <Text style={styles.webCameraText}>
            Take a photo of the {currentPhotoType === 'package' ? 'package' : 
            currentPhotoType === 'label' ? 'shipping label' : 'storage location'}
          </Text>
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
                  <FlatList
                    data={filteredMembers.slice(0, 5)}
                    keyExtractor={(item) => item.id}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.memberDropdownItem}
                        onPress={() => handleMemberSelect(item)}
                      >
                        <User size={16} color={Colors.light.primary} />
                        <View style={styles.memberDropdownContent}>
                          <Text style={styles.memberDropdownName}>
                            {formatMemberDisplay(item)}
                          </Text>
                          <Text style={styles.memberDropdownId}>ID: {item.memberId}</Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                  
                  <TouchableOpacity
                    style={styles.createMemberOption}
                    onPress={() => {
                      setNewMemberName(recipientName);
                      setShowNewMemberForm(true);
                      setShowMemberDropdown(false);
                    }}
                  >
                    <Plus size={16} color={Colors.light.primary} />
                    <Text style={styles.createMemberText}>
                      Create new member: "{recipientName}"
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>
          
          {showNewMemberForm && (
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
                value={newMemberAliases}
                onChangeText={setNewMemberAliases}
                placeholder="Aliases (comma separated, optional)"
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
            <TouchableOpacity
              style={[styles.input, styles.dropdownButton]}
              onPress={() => setShowDutyOfficerDropdown(!showDutyOfficerDropdown)}
            >
              <Text style={[styles.dropdownText, !addedBy && styles.placeholderText]}>
                {addedBy || 'Select duty officer'}
              </Text>
              <ChevronDown size={20} color={Colors.light.subtext} />
            </TouchableOpacity>
            
            {showDutyOfficerDropdown && (
              <View style={styles.dropdown}>
                <FlatList
                  data={DUTY_OFFICERS}
                  keyExtractor={(item) => item}
                  renderItem={({ item }) => (
                    <TouchableOpacity
                      style={styles.dropdownItem}
                      onPress={() => {
                        setAddedBy(item);
                        setShowDutyOfficerDropdown(false);
                      }}
                    >
                      <Text style={styles.dropdownItemText}>{item}</Text>
                      {addedBy === item && (
                        <Check size={16} color={Colors.light.primary} />
                      )}
                    </TouchableOpacity>
                  )}
                />
              </View>
            )}
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
  createMemberText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  placeholderText: {
    color: Colors.light.subtext,
  },
  dropdown: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxHeight: 200,
    marginTop: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  dropdownItemText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  newMemberForm: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: 16,
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