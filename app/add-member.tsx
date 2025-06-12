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
import { useEquipmentStore } from '@/store/equipmentStore';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
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
  UserPlus,
  Heart,
  Check,
  Square
} from 'lucide-react-native';
import { 
  MemberBranch, 
  MemberStatus, 
  MemberGroup, 
  InvolvementInterest,
  MEMBER_BRANCHES, 
  MEMBER_STATUSES, 
  MEMBER_GROUPS,
  INVOLVEMENT_INTERESTS
} from '@/types/member';

export default function AddMemberScreen() {
  const router = useRouter();
  const { addMember, members } = useMemberStore();
  const { getDutyOfficers } = useEquipmentStore();
  
  const [memberId, setMemberId] = useState('');
  const [name, setName] = useState('');
  const [aliases, setAliases] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [joinDate, setJoinDate] = useState(new Date());
  const [dateOfBirth, setDateOfBirth] = useState<Date | undefined>(undefined);
  const [branch, setBranch] = useState<MemberBranch | undefined>(undefined);
  const [status, setStatus] = useState<MemberStatus>('Active');
  const [group, setGroup] = useState<MemberGroup>('Legion');
  const [addedBy, setAddedBy] = useState('');
  const [involvementInterests, setInvolvementInterests] = useState<InvolvementInterest[]>([]);
  
  // Get duty officers from settings
  const dutyOfficers = getDutyOfficers();
  
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
  
  const handleInvolvementToggle = (interest: InvolvementInterest) => {
    setInvolvementInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };
  
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
    
    if (!email.trim()) {
      Alert.alert('Error', 'Email is required');
      return;
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('Error', 'Please enter a valid email address');
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
      email: email.trim(),
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      joinDate,
      dateOfBirth,
      branch,
      status,
      group,
      addedBy: addedBy.trim() || undefined,
      involvementInterests: involvementInterests.length > 0 ? involvementInterests : undefined,
    });
    
    // Navigate back
    router.back();
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
            <Calendar size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Date of Birth (Optional)</Text>
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
            <Text style={styles.dateText}>
              {dateOfBirth ? formatDate(dateOfBirth) : 'Select date of birth'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Shield size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Military Branch (Optional)</Text>
          </View>
          <Dropdown
            options={MEMBER_BRANCHES}
            value={branch}
            onSelect={(value) => setBranch(value as MemberBranch)}
            placeholder="Select military branch"
            allowEmpty={true}
            emptyLabel="None"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Activity size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Status*</Text>
          </View>
          <Dropdown
            options={MEMBER_STATUSES}
            value={status}
            onSelect={(value) => setStatus(value as MemberStatus)}
            placeholder="Select status"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Users size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Group*</Text>
          </View>
          <Dropdown
            options={MEMBER_GROUPS}
            value={group}
            onSelect={(value) => setGroup(value as MemberGroup)}
            placeholder="Select group"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Phone size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Phone Number (Optional)</Text>
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
            <Text style={styles.inputHeaderLabel}>Email*</Text>
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
            <UserPlus size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Added By (Optional)</Text>
          </View>
          <Dropdown
            options={dutyOfficers}
            value={addedBy}
            onSelect={setAddedBy}
            placeholder="Select duty officer"
            allowEmpty={true}
            emptyLabel="None"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Heart size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>I would like to get involved with: (Optional)</Text>
          </View>
          
          <View style={styles.checklistContainer}>
            {INVOLVEMENT_INTERESTS.map((interest) => (
              <TouchableOpacity
                key={interest}
                style={styles.checklistItem}
                onPress={() => handleInvolvementToggle(interest)}
              >
                <View style={styles.checklistLeft}>
                  {involvementInterests.includes(interest) ? (
                    <Check size={20} color={Colors.light.primary} />
                  ) : (
                    <Square size={20} color={Colors.light.subtext} />
                  )}
                  <Text style={[
                    styles.checklistText,
                    involvementInterests.includes(interest) && styles.checklistTextSelected
                  ]}>
                    {interest}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.inputHelp}>
            Select areas where this member would like to contribute
          </Text>
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
  checklistContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  checklistItem: {
    marginBottom: 12,
  },
  checklistLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checklistText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  checklistTextSelected: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
  addButton: {
    marginTop: 12,
    marginBottom: 24,
  },
});