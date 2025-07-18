import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Linking,
  TextInput
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useMemberStore } from '@/store/memberStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import { usePackageStore } from '@/store/packageStore';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import CheckoutHistoryItem from '@/components/CheckoutHistoryItem';
import PackageCard from '@/components/PackageCard';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  FileText, 
  Calendar, 
  Edit, 
  Trash2,
  CheckSquare,
  ChevronRight,
  Package2,
  Users,
  Tag,
  Shield,
  Activity,
  UserPlus,
  Heart,
  Cake
} from 'lucide-react-native';

const ADMIN_CODE = '1234'; // In production, this should be more secure

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { members, removeMember, getAssociatedMembers } = useMemberStore();
  const { checkoutRecords, equipment } = useEquipmentStore();
  const { getPackagesByMember } = usePackageStore();
  
  const member = members.find(m => m.id === id);
  
  if (!member) {
    return (
      <EmptyState
        title="Member Not Found"
        description="The member you're looking for doesn't exist or has been removed."
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }
  
  // Get checkout records for this member
  const memberCheckoutRecords = checkoutRecords
    .filter(record => record.memberId === id)
    .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime());
  
  // Get currently checked out equipment
  const activeCheckouts = memberCheckoutRecords.filter(record => !record.returnDate);
  
  // Get packages for this member
  const memberPackages = getPackagesByMember(id)
    .sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());
  
  const pendingPackages = memberPackages.filter(pkg => pkg.status === 'pending');
  
  // Get associated members
  const associatedMembers = getAssociatedMembers(id);
  
  const handleEditMember = () => {
    router.push(`/edit-member/${id}`);
  };
  
  const handleDeleteMember = () => {
    // Check if member has active checkouts or pending packages
    if (activeCheckouts.length > 0 || pendingPackages.length > 0) {
      Alert.alert(
        "Cannot Delete Member",
        "This member has equipment currently checked out or packages awaiting pickup. All equipment must be returned and packages picked up before the member can be deleted.",
        [{ text: "OK" }]
      );
      return;
    }
    
    // Require administrator code
    Alert.prompt(
      "Administrator Verification Required",
      "Enter the administrator code to delete this member:",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: (code) => {
            if (code === ADMIN_CODE) {
              Alert.alert(
                "Delete Member",
                "Are you sure you want to delete this member? This action cannot be undone.",
                [
                  {
                    text: "Cancel",
                    style: "cancel"
                  },
                  { 
                    text: "Delete", 
                    style: "destructive",
                    onPress: () => {
                      removeMember(id);
                      router.back();
                    }
                  }
                ]
              );
            } else {
              Alert.alert("Error", "Invalid administrator code.");
            }
          }
        }
      ],
      "secure-text"
    );
  };
  
  const handleCall = () => {
    if (member.phone) {
      Linking.openURL(`tel:${member.phone}`);
    }
  };
  
  const handleEmail = () => {
    if (member.email) {
      Linking.openURL(`mailto:${member.email}`);
    }
  };
  
  const handleEquipmentPress = (equipmentId: string) => {
    router.push(`/equipment/${equipmentId}`);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };
  
  const formatMemberDisplay = (memberData: any) => {
    let display = memberData.name;
    if (memberData.aliases && memberData.aliases.length > 0) {
      display += ` "${memberData.aliases.join('", "')}"`;
    }
    return display;
  };
  
  const getStatusColor = (status: string) => {
    return status === 'Active' ? Colors.light.primary : Colors.light.subtext;
  };
  
  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: member.name,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleEditMember}
                style={styles.headerButton}
              >
                <Edit size={24} color={Colors.light.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDeleteMember}
                style={styles.headerButton}
              >
                <Trash2 size={24} color={Colors.light.flagRed} />
              </TouchableOpacity>
            </View>
          )
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <User size={40} color={Colors.light.primary} />
          </View>
          
          <View style={styles.profileInfo}>
            <Text style={styles.memberName}>{formatMemberDisplay(member)}</Text>
            <Text style={styles.memberId}>Member ID: {member.memberId}</Text>
            <View style={styles.statusContainer}>
              <Text style={[styles.statusText, { color: getStatusColor(member.status) }]}>
                {member.status}
              </Text>
              <Text style={styles.groupText}>{member.group}</Text>
            </View>
          </View>
        </View>
        
        <View style={styles.contactActions}>
          {member.phone && (
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleCall}
            >
              <Phone size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Call</Text>
            </TouchableOpacity>
          )}
          
          {member.email && (
            <TouchableOpacity 
              style={styles.contactButton}
              onPress={handleEmail}
            >
              <Mail size={20} color="#fff" />
              <Text style={styles.contactButtonText}>Email</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Phone size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{member.phone || 'Not provided'}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Mail size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Email</Text>
              <Text style={styles.detailValue}>{member.email || 'Not provided'}</Text>
            </View>
          </View>
          
          {member.dateOfBirth && (
            <View style={styles.detailItem}>
              <Cake size={20} color={Colors.light.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date of Birth</Text>
                <Text style={styles.detailValue}>
                  {formatDate(member.dateOfBirth)} (Age: {calculateAge(member.dateOfBirth)})
                </Text>
              </View>
            </View>
          )}
          
          {member.aliases && member.aliases.length > 0 && (
            <View style={styles.detailItem}>
              <Tag size={20} color={Colors.light.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Aliases</Text>
                <Text style={styles.detailValue}>"{member.aliases.join('", "')}"</Text>
              </View>
            </View>
          )}
          
          {member.branch && (
            <View style={styles.detailItem}>
              <Shield size={20} color={Colors.light.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Military Branch</Text>
                <Text style={styles.detailValue}>{member.branch}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Activity size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Status</Text>
              <Text style={[styles.detailValue, { color: getStatusColor(member.status) }]}>
                {member.status}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Users size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Group</Text>
              <Text style={styles.detailValue}>{member.group}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Address</Text>
              <Text style={styles.detailValue}>{member.address || 'Not provided'}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Calendar size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Join Date</Text>
              <Text style={styles.detailValue}>{formatDate(member.joinDate)}</Text>
            </View>
          </View>
          
          {member.addedBy && (
            <View style={styles.detailItem}>
              <UserPlus size={20} color={Colors.light.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Added By</Text>
                <Text style={styles.detailValue}>{member.addedBy}</Text>
              </View>
            </View>
          )}
        </View>
        
        {/* Involvement Interests Section */}
        {member.involvementInterests && member.involvementInterests.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Areas of Interest</Text>
            
            <View style={styles.interestsContainer}>
              {member.involvementInterests.map((interest, index) => (
                <View key={index} style={styles.interestItem}>
                  <Heart size={16} color={Colors.light.primary} />
                  <Text style={styles.interestText}>{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {/* Associated Members Section */}
        {associatedMembers.length > 0 && (
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Associated Members</Text>
            
            {associatedMembers.map(associatedMember => (
              <TouchableOpacity
                key={associatedMember.id}
                style={styles.associatedMemberItem}
                onPress={() => router.push(`/member/${associatedMember.id}`)}
              >
                <View style={styles.associatedMemberLeft}>
                  <Users size={20} color={Colors.light.primary} />
                  <View style={styles.associatedMemberContent}>
                    <Text style={styles.associatedMemberName}>
                      {formatMemberDisplay(associatedMember)}
                    </Text>
                    <Text style={styles.associatedMemberInfo}>
                      ID: {associatedMember.memberId}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={Colors.light.subtext} />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {member.notes && (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <FileText size={20} color={Colors.light.primary} />
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{member.notes}</Text>
          </View>
        )}
        
        {/* Packages Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Packages</Text>
          
          {memberPackages.length > 0 ? (
            memberPackages.slice(0, 3).map(pkg => (
              <PackageCard key={pkg.id} package={pkg} />
            ))
          ) : (
            <Text style={styles.emptyText}>
              No packages for this member.
            </Text>
          )}
          
          {memberPackages.length > 3 && (
            <TouchableOpacity
              style={styles.viewAllButton}
              onPress={() => router.push('/packages')}
            >
              <Text style={styles.viewAllText}>
                View all {memberPackages.length} packages
              </Text>
            </TouchableOpacity>
          )}
        </View>
        
        {/* Currently Checked Out Equipment */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Currently Checked Out</Text>
          
          {activeCheckouts.length > 0 ? (
            activeCheckouts.map(record => {
              const item = equipment.find(e => e.id === record.equipmentId);
              if (!item) return null;
              
              return (
                <TouchableOpacity 
                  key={record.id}
                  style={styles.checkoutItem}
                  onPress={() => handleEquipmentPress(item.id)}
                >
                  <View style={styles.checkoutItemLeft}>
                    <CheckSquare size={20} color={Colors.light.primary} />
                    <View style={styles.checkoutItemContent}>
                      <Text style={[styles.checkoutItemTitle, styles.linkText]}>{item.name}</Text>
                      <Text style={styles.checkoutItemDate}>
                        Checked out: {formatDate(record.checkoutDate)}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={Colors.light.subtext} />
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>
              No equipment currently checked out.
            </Text>
          )}
        </View>
        
        {/* Checkout History */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Checkout History</Text>
          
          {memberCheckoutRecords.length > 0 ? (
            memberCheckoutRecords.map(record => {
              const item = equipment.find(e => e.id === record.equipmentId);
              if (!item) return null;
              
              return (
                <CheckoutHistoryItem 
                  key={record.id} 
                  record={record} 
                  equipment={item}
                  showEquipmentName={true}
                />
              );
            })
          ) : (
            <Text style={styles.emptyText}>
              No checkout history found.
            </Text>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <Button
          title="Edit Member"
          onPress={handleEditMember}
          style={styles.footerButton}
          icon={<Edit size={20} color="#fff" />}
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
  headerButtons: {
    flexDirection: 'row',
  },
  headerButton: {
    padding: 8,
    marginLeft: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 4,
  },
  memberId: {
    fontSize: 16,
    color: Colors.light.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginRight: 12,
  },
  groupText: {
    fontSize: 14,
    color: Colors.light.subtext,
    fontWeight: '500',
  },
  contactActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  detailsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailContent: {
    marginLeft: 12,
    flex: 1,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.light.text,
  },
  linkText: {
    color: Colors.light.primary,
    textDecorationLine: 'underline',
  },
  interestsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  interestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  interestText: {
    fontSize: 16,
    color: Colors.light.text,
    marginLeft: 12,
  },
  notesContainer: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  notesText: {
    fontSize: 15,
    color: Colors.light.text,
    lineHeight: 22,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  associatedMemberItem: {
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
  associatedMemberLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  associatedMemberContent: {
    marginLeft: 12,
    flex: 1,
  },
  associatedMemberName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  associatedMemberInfo: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  checkoutItem: {
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
  checkoutItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  checkoutItemContent: {
    marginLeft: 12,
    flex: 1,
  },
  checkoutItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 4,
  },
  checkoutItemDate: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  viewAllButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.subtext,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
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
  footerButton: {
    width: '100%',
  },
});