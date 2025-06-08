import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Alert,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useMemberStore } from '@/store/memberStore';
import Button from '@/components/Button';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar, 
  Tag, 
  Shield, 
  Activity, 
  Users,
  ChevronDown 
} from 'lucide-react-native';
import { 
  MemberBranch, 
  MemberStatus, 
  MemberGroup, 
  MEMBER_BRANCHES, 
  MEMBER_STATUSES, 
  MEMBER_GROUPS 
} from '@/types/member';

export default function AddMemberScreen() {
  const router = useRouter();
  const { addMember, members } = useMemberStore();
  
  const [memberId, setMemberId] = useState('');
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [joinDate, setJoinDate] = useState(new Date());
  const [branch, setBranch] = useState<MemberBranch | undefined>(undefined);
  const [status, setStatus] = useState<MemberStatus>('Active');
  const [group, setGroup] = useState<MemberGroup>('Legion');
  
  // Generate a suggested member ID
  const generateMemberId = () => {
    // Find the highest existing member ID that follows the format M001, M002, etc.
    const existingIds = members
      .map(m => m.memberId)
      .filter(id => /^M\d+$/.test(id))
      .map(id => parseInt(id.substring(1), 10));
    
    const highestId = existingIds.length > 0 ? Math.max(...existingIds) : 0;
    const newId = highestId + 1;
    
    // Format with leading zeros (M001, M002, etc.)
    return `M${newId.toString().padStart(3, '0')}`;
  };
  
  // Set a suggested member ID when the component mounts
  React.useEffect(() => {
    setMemberId(generateMemberId());
  }, []);
  
  const handleAddMember = () => {
    // Validate inputs
    if (!memberId.trim()) {
      Alert.alert('Error', 'Member ID is required');
      return;
    }
    
    if (!name.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }
    
    // Check if member ID already exists
    const existingMember = members.find(m => m.memberId === memberId.trim());
    if (existingMember) {
      Alert.alert('Error', 'A member with this ID already exists');
      return;
    }
    
    // Process aliases
    const aliasArray = aliases.trim() 
      ? aliases.split(',').map(alias => alias.trim()).filter(Boolean)
      : undefined;
    
    // Add member
    addMember({
      memberId: memberId.trim(),
      name: name.trim(),
      ...(aliasArray && aliasArray.length > 0 && { aliases: aliasArray }),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      joinDate,
      branch,
      status,
      group,
    });
    
    // Navigate back
    router.back();
  };
  
  const showBranchPicker = () => {
    const options = ['None', ...MEMBER_BRANCHES];
    Alert.alert(
      'Select Military Branch',
      'Choose the military branch for this member',
      [
        ...options.map(option => ({
          text: option,
          onPress: () => setBranch(option === 'None' ? undefined : option as MemberBranch)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  const showStatusPicker = () => {
    Alert.alert(
      'Select Member Status',
      'Choose the status for this member',
      [
        ...MEMBER_STATUSES.map(option => ({
          text: option,
          onPress: () => setStatus(option)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  const showGroupPicker = () => {
    Alert.alert(
      'Select Member Group',
      'Choose the group for this member',
      [
        ...MEMBER_GROUPS.map(option => ({
          text: option,
          onPress: () => setGroup(option)
        })),
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };
  
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Add New Member",
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
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <User size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Member ID*</Text>
          </View>
          <TextInput
            style={styles.input}
            value={memberId}
            onChangeText={setMemberId}
            placeholder="Enter member ID"
            placeholderTextColor={Colors.light.subtext}
          />
          <Text style={styles.inputHelp}>
            Member ID should be unique (e.g., M001, M002)
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <User size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Full Name*</Text>
          </View>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter member's full name"
            placeholderTextColor={Colors.light.subtext}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Tag size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Aliases (Optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={aliases}
            onChangeText={setAliases}
            placeholder="Enter aliases separated by commas"
            placeholderTextColor={Colors.light.subtext}
          />
          <Text style={styles.inputHelp}>
            Alternative names or nicknames (e.g., Johnny, J. Smith)
          </Text>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Shield size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Military Branch (Optional)</Text>
          </View>
          <TouchableOpacity 
            style={styles.pickerInput}
            onPress={showBranchPicker}
          >
            <Text style={[styles.pickerText, !branch && styles.placeholderText]}>
              {branch || 'Select military branch'}
            </Text>
            <ChevronDown size={20} color={Colors.light.subtext} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Activity size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Status*</Text>
          </View>
          <TouchableOpacity 
            style={styles.pickerInput}
            onPress={showStatusPicker}
          >
            <Text style={styles.pickerText}>{status}</Text>
            <ChevronDown size={20} color={Colors.light.subtext} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Users size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Group*</Text>
          </View>
          <TouchableOpacity 
            style={styles.pickerInput}
            onPress={showGroupPicker}
          >
            <Text style={styles.pickerText}>{group}</Text>
            <ChevronDown size={20} color={Colors.light.subtext} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Phone size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Phone Number</Text>
          </View>
          <TextInput
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder="Enter phone number"
            placeholderTextColor={Colors.light.subtext}
            keyboardType="phone-pad"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Mail size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Email (Optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Enter email address"
            placeholderTextColor={Colors.light.subtext}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <MapPin size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Address (Optional)</Text>
          </View>
          <TextInput
            style={styles.addressInput}
            value={address}
            onChangeText={setAddress}
            placeholder="Enter address"
            placeholderTextColor={Colors.light.subtext}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Calendar size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Join Date</Text>
          </View>
          <TouchableOpacity 
            style={styles.dateInput}
            onPress={() => {
              // In a real implementation, this would open a date picker
              Alert.alert(
                "Select Date",
                "In a production app, this would open a calendar date picker. For this demo, we're using the current date."
              );
            }}
          >
            <Text style={styles.dateText}>{formatDate(joinDate)}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <FileText size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Notes (Optional)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes about this member"
            placeholderTextColor={Colors.light.subtext}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <Button
          title="Add Member"
          onPress={handleAddMember}
          style={styles.addButton}
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
  inputContainer: {
    marginBottom: 20,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputHeaderLabel: {
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
  pickerInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pickerText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  placeholderText: {
    color: Colors.light.subtext,
  },
  inputHelp: {
    fontSize: 12,
    color: Colors.light.subtext,
    marginTop: 4,
    marginLeft: 4,
  },
  addressInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 80,
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
  dateInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dateText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  addButton: {
    marginTop: 12,
    marginBottom: 24,
  },
});