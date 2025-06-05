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
import Button from '@/components/Button';
import { User, Phone, Mail, MapPin, FileText, Calendar } from 'lucide-react-native';

export default function EditMemberScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { members, updateMember, getMemberById } = useMemberStore();
  
  const [memberId, setMemberId] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [joinDate, setJoinDate] = useState(new Date());
  
  // Load member data when component mounts
  useEffect(() => {
    const member = getMemberById(id);
    if (member) {
      setMemberId(member.memberId);
      setName(member.name);
      setPhone(member.phone || '');
      setEmail(member.email || '');
      setAddress(member.address || '');
      setNotes(member.notes || '');
      setJoinDate(new Date(member.joinDate));
    } else {
      // Member not found, go back
      Alert.alert("Error", "Member not found");
      router.back();
    }
  }, [id]);
  
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
    
    // Check if member ID already exists (but ignore the current member)
    const existingMember = members.find(m => m.memberId === memberId.trim() && m.id !== id);
    if (existingMember) {
      Alert.alert('Error', 'A member with this ID already exists');
      return;
    }
    
    // Update member
    updateMember({
      id,
      memberId: memberId.trim(),
      name: name.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      address: address.trim() || undefined,
      notes: notes.trim() || undefined,
      joinDate,
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
                "In a production app, this would open a calendar date picker."
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
  updateButton: {
    marginTop: 12,
    marginBottom: 24,
  },
});