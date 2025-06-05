import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useMemberStore } from '@/store/memberStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import CheckoutHistoryItem from '@/components/CheckoutHistoryItem';
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
  ChevronRight
} from 'lucide-react-native';

export default function MemberDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { members, removeMember } = useMemberStore();
  const { checkoutRecords, equipment } = useEquipmentStore();
  
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
  
  const handleEditMember = () => {
    router.push(`/edit-member/${id}`);
  };
  
  const handleDeleteMember = () => {
    // Check if member has active checkouts
    if (activeCheckouts.length > 0) {
      Alert.alert(
        "Cannot Delete Member",
        "This member has equipment currently checked out. All equipment must be returned before the member can be deleted.",
        [{ text: "OK" }]
      );
      return;
    }
    
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
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
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
                <Trash2 size={24} color={Colors.light.error} />
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
            <Text style={styles.memberName}>{member.name}</Text>
            <Text style={styles.memberId}>Member ID: {member.memberId}</Text>
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
        </View>
        
        {member.notes && (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <FileText size={20} color={Colors.light.primary} />
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{member.notes}</Text>
          </View>
        )}
        
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
                  onPress={() => router.push(`/equipment/${item.id}`)}
                >
                  <View style={styles.checkoutItemLeft}>
                    <CheckSquare size={20} color={Colors.light.primary} />
                    <View style={styles.checkoutItemContent}>
                      <Text style={styles.checkoutItemTitle}>{item.name}</Text>
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