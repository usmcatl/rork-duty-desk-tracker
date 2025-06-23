import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert,
  Modal
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useMemberStore } from '@/store/memberStore';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { Plus, Search, Filter, User, Phone, Calendar, ChevronRight, Users, Upload, Shield, Activity, AlertTriangle } from 'lucide-react-native';

export default function MembersScreen() {
  const router = useRouter();
  const { members } = useMemberStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvisoryDialog, setShowAdvisoryDialog] = useState(false);
  
  // Filter members based on search
  const filteredMembers = members.filter(member => {
    return searchQuery === '' || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone && member.phone.includes(searchQuery)) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member.branch && member.branch.toLowerCase().includes(searchQuery.toLowerCase())) ||
      member.status.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.group.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  const handleAddMemberAttempt = () => {
    setShowAdvisoryDialog(true);
  };
  
  const handleImportMembersAttempt = () => {
    setShowAdvisoryDialog(true);
  };
  
  const handleMemberPress = (id: string) => {
    router.push(`/member/${id}`);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };
  
  const getStatusColor = (status: string) => {
    return status === 'Active' ? Colors.light.primary : Colors.light.subtext;
  };
  
  if (members.length === 0) {
    return (
      <View style={styles.container}>
        {/* Advisory Dialog */}
        <Modal
          visible={showAdvisoryDialog}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowAdvisoryDialog(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <AlertTriangle size={24} color={Colors.light.flagRed} />
                <Text style={styles.modalTitle}>Feature Pending Department Advisory</Text>
              </View>
              
              <Text style={styles.modalMessage}>
                Member management features are currently pending department advisory approval.
              </Text>
              
              <View style={styles.modalButtons}>
                <Button
                  title="Understood"
                  onPress={() => setShowAdvisoryDialog(false)}
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>

        <EmptyState
          title="No Members Found"
          description="Member database is currently empty. Member management features are pending department advisory."
          actionLabel="Understood"
          onAction={() => {}}
          icon={<Users size={48} color={Colors.light.primary} />}
        />
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      {/* Advisory Dialog */}
      <Modal
        visible={showAdvisoryDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAdvisoryDialog(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={24} color={Colors.light.flagRed} />
              <Text style={styles.modalTitle}>Feature Pending Department Advisory</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Member management features are currently pending department advisory approval.
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="Understood"
                onPress={() => setShowAdvisoryDialog(false)}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.light.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.subtext}
          />
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={[styles.actionButton, styles.disabledActionButton]}
          onPress={handleAddMemberAttempt}
        >
          <Plus size={16} color={Colors.light.subtext} />
          <Text style={[styles.actionButtonText, styles.disabledActionButtonText]}>Add Member</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.disabledActionButton]}
          onPress={handleImportMembersAttempt}
        >
          <Upload size={16} color={Colors.light.subtext} />
          <Text style={[styles.actionButtonText, styles.disabledActionButtonText]}>Import</Text>
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredMembers.length > 0 ? (
          <>
            <Text style={styles.resultsText}>
              {filteredMembers.length} member{filteredMembers.length !== 1 ? 's' : ''} found
            </Text>
            
            {filteredMembers.map(member => (
              <TouchableOpacity
                key={member.id}
                style={styles.memberCard}
                onPress={() => handleMemberPress(member.id)}
              >
                <View style={styles.memberInfo}>
                  <View style={styles.memberHeader}>
                    <Text style={styles.memberName}>{member.name}</Text>
                    <View style={styles.memberIdRow}>
                      <Text style={styles.memberId}>ID: {member.memberId}</Text>
                      <Text style={[styles.statusBadge, { color: getStatusColor(member.status) }]}>
                        {member.status}
                      </Text>
                    </View>
                  </View>
                  
                  <View style={styles.memberDetails}>
                    <View style={styles.memberDetail}>
                      <Phone size={14} color={Colors.light.subtext} />
                      <Text style={styles.memberDetailText}>
                        {member.phone || 'No phone'}
                      </Text>
                    </View>
                    
                    {member.branch && (
                      <View style={styles.memberDetail}>
                        <Shield size={14} color={Colors.light.subtext} />
                        <Text style={styles.memberDetailText}>
                          {member.branch}
                        </Text>
                      </View>
                    )}
                    
                    <View style={styles.memberDetail}>
                      <Users size={14} color={Colors.light.subtext} />
                      <Text style={styles.memberDetailText}>
                        {member.group}
                      </Text>
                    </View>
                    
                    <View style={styles.memberDetail}>
                      <Calendar size={14} color={Colors.light.subtext} />
                      <Text style={styles.memberDetailText}>
                        Joined: {formatDate(member.joinDate)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <ChevronRight size={20} color={Colors.light.subtext} />
              </TouchableOpacity>
            ))}
          </>
        ) : (
          <EmptyState
            title="No Matching Members"
            description="Try adjusting your search criteria."
            icon={<Filter size={48} color={Colors.light.subtext} />}
          />
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={[styles.fab, styles.disabledFab]}
        onPress={handleAddMemberAttempt}
      >
        <Plus size={24} color={Colors.light.subtext} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 8,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontSize: 16,
    color: Colors.light.text,
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
  },
  disabledActionButton: {
    backgroundColor: Colors.light.border,
  },
  actionButtonText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginLeft: 4,
  },
  disabledActionButtonText: {
    color: Colors.light.subtext,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  resultsText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 12,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  memberInfo: {
    flex: 1,
  },
  memberHeader: {
    marginBottom: 8,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  memberIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  memberId: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
  },
  statusBadge: {
    fontSize: 12,
    fontWeight: '600',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: Colors.light.secondary,
  },
  memberDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  memberDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
    marginBottom: 4,
  },
  memberDetailText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginLeft: 4,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  disabledFab: {
    backgroundColor: Colors.light.border,
    shadowColor: Colors.light.shadow,
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