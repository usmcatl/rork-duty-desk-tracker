import React, { useState, useEffect } from 'react';
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
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
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
  Users, 
  Plus, 
  X,
  Shield,
  Activity,
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

export default function EditMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { members, updateMember, getMemberById, addAssociation, removeAssociation, getAssociatedMembers } = useMemberStore();
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
  
  // Associated members
  const [showAssociatedMemberForm, setShowAssociatedMemberForm] = useState(false);
  const [associatedMemberSearch, setAssociatedMemberSearch] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<any[]>([]);
  
  // Get duty officers from settings
  const dutyOfficers = getDutyOfficers();
  
  // Load member data when component mounts
  useEffect(() => {
    const member = getMemberById(id);
    if (member) {
      setMemberId(member.memberId);
      setName(member.name);
      setAliases(member.aliases ? member.aliases.join(', ') : '');
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setAddress(member.address || '');
      setNotes(member.notes || '');
      setJoinDate(new Date(member.joinDate));
      setDateOfBirth(member.dateOfBirth ? new Date(member.dateOfBirth) : undefined);
      setBranch(member.branch);
      setStatus(member.status);
      setGroup(member.group);
      setAddedBy(member.addedBy || '');
      setInvolvementInterests(member.involvementInterests || []);
    } else {
      // Member not found, go back
      Alert.alert("Error", "Member not found");
      router.back();
    }
  }, [id]);
  
  const associatedMembers = getAssociatedMembers(id);
  
  const handleInvolvementToggle = (interest: InvolvementInterest) => {
    setInvolvementInterests(prev => {
      if (prev.includes(interest)) {
        return prev.filter(i => i !== interest);
      } else {
        return [...prev, interest];
      }
    });
  };
  
  const handleUpdateMember = () => {
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
    
    // Check if member ID already exists (but ignore the current member)
    const existingMember = members.find(m => m.memberId === memberId.trim() && m.id !== id);
    if (existingMember) {
      Alert.alert('Error', 'A member with this ID already exists');
      return;
    }
    
    // Process aliases
    const aliasArray = aliases.trim() 
      ? aliases.split(',').map(alias => alias.trim()).filter(Boolean)
      : undefined;
    
    // Update member
    updateMember({
      id,
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
  
  const handleAssociatedMemberSearch = (query: string) => {
    setAssociatedMemberSearch(query);
    
    if (query.trim()) {
      // Filter out current member and already associated members
      const currentAssociatedIds = associatedMembers.map(m => m.id);
      const filtered = members.filter(member => 
        member.id !== id && 
        !currentAssociatedIds.includes(member.id) &&
        (member.name.toLowerCase().includes(query.toLowerCase()) ||
         member.memberId.toLowerCase().includes(query.toLowerCase()))
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  };
  
  const handleAddAssociation = (associatedMemberId: string) => {
    addAssociation(id, associatedMemberId);
    // Also add the reverse association
    addAssociation(associatedMemberId, id);
    setShowAssociatedMemberForm(false);
    setAssociatedMemberSearch('');
    setFilteredMembers([]);
  };
  
  const handleRemoveAssociation = (associatedMemberId: string) => {
    Alert.alert(
      "Remove Association",
      "Are you sure you want to remove this member association?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: () => {
            removeAssociation(id, associatedMemberId);
            // Also remove the reverse association
            removeAssociation(associatedMemberId, id);
          }
        }
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
  
  const formatMemberDisplay = (member: any) => {
    let display = member.name;
    if (member.aliases && member.aliases.length > 0) {
      display += ` "${member.aliases.join('", "')}"`;
    }
    return display;
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Edit Member",
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
                "In a production app, this would open a calendar date picker."
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
                "In a production app, this would open a calendar date picker."
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
        
        {/* Associated Members Section */}
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Users size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Associated Members (Optional)</Text>
          </View>
          
          {associatedMembers.length > 0 && (
            <View style={styles.associatedMembersList}>
              {associatedMembers.map(member => (
                <View key={member.id} style={styles.associatedMemberItem}>
                  <Text style={styles.associatedMemberName}>
                    {formatMemberDisplay(member)}
                  </Text>
                  <TouchableOpacity
                    onPress={() => handleRemoveAssociation(member.id)}
                    style={styles.removeAssociationButton}
                  >
                    <X size={16} color={Colors.light.flagRed} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
          
          {!showAssociatedMemberForm ? (
            <TouchableOpacity
              style={styles.addAssociationButton}
              onPress={() => setShowAssociatedMemberForm(true)}
            >
              <Plus size={16} color={Colors.light.primary} />
              <Text style={styles.addAssociationText}>Add Associated Member</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.associatedMemberForm}>
              <TextInput
                style={styles.input}
                value={associatedMemberSearch}
                onChangeText={handleAssociatedMemberSearch}
                placeholder="Search for member to associate..."
                placeholderTextColor={Colors.light.subtext}
              />
              
              {filteredMembers.length > 0 && (
                <View style={styles.memberDropdown}>
                  {filteredMembers.slice(0, 5).map((item) => (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.memberDropdownItem}
                      onPress={() => handleAddAssociation(item.id)}
                    >
                      <User size={16} color={Colors.light.primary} />
                      <View style={styles.memberDropdownContent}>
                        <Text style={styles.memberDropdownName}>
                          {formatMemberDisplay(item)}
                        </Text>
                        <Text style={styles.memberDropdownId}>ID: {item.memberId}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
              
              <TouchableOpacity
                style={styles.cancelAssociationButton}
                onPress={() => {
                  setShowAssociatedMemberForm(false);
                  setAssociatedMemberSearch('');
                  setFilteredMembers([]);
                }}
              >
                <Text style={styles.cancelAssociationText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <Text style={styles.inputHelp}>
            Associate family members or related individuals
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
          title="Update Member"
          onPress={handleUpdateMember}
          style={styles.updateButton}
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
  associatedMembersList: {
    marginBottom: 12,
  },
  associatedMemberItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  associatedMemberName: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  removeAssociationButton: {
    padding: 4,
  },
  addAssociationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  addAssociationText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
    marginLeft: 8,
  },
  associatedMemberForm: {
    marginBottom: 12,
  },
  memberDropdown: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxHeight: 200,
    marginTop: 8,
    marginBottom: 8,
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
  cancelAssociationButton: {
    alignItems: 'center',
    padding: 8,
  },
  cancelAssociationText: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  updateButton: {
    marginTop: 12,
    marginBottom: 24,
  },
});