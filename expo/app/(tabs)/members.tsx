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
import { matchesMemberSearch, memberStatusColor, memberSubtitle } from '@/utils/memberUtils';
import { useSyncStore } from '@/store/syncStore';
import { MemberStatus } from '@/types/member';

const CONTACTS_ROSTER_MESSAGE =
  "Members come from the Post's Google Contacts (americanlegionchapala@gmail.com). To add or renew someone, update their contact and give them a year label such as '2026 Renewed'. The app picks up changes automatically each day, or tap Sync Now.";
import { useMemberStore } from '@/store/memberStore';
import EmptyState from '@/components/EmptyState';
import Button from '@/components/Button';
import { Plus, Search, Filter, User, Phone, Calendar, ChevronRight, Users, RefreshCw, Check, Shield, Activity, AlertTriangle } from 'lucide-react-native';

export default function MembersScreen() {
  const router = useRouter();
  const { members } = useMemberStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdvisoryDialog, setShowAdvisoryDialog] = useState(false);
  // View filter only: hides non-Active members from the list, changes no data.
  const [activeOnly, setActiveOnly] = useState(false);

  const { syncNow, isSyncing, endpointUrl } = useSyncStore();

  // Filter members based on search (and the Active only toggle)
  const filteredMembers = members.filter(member => {
    if (activeOnly && member.status !== 'Active') return false;
    const q = searchQuery.toLowerCase();
    return matchesMemberSearch(member, searchQuery) ||
      (member.branch && member.branch.toLowerCase().includes(q)) ||
      member.status.toLowerCase().includes(q) ||
      member.group.toLowerCase().includes(q);
  });

  const handleAddMemberAttempt = () => {
    setShowAdvisoryDialog(true);
  };

  const handleSyncNow = async () => {
    if (!endpointUrl) {
      Alert.alert('Sync Not Connected', 'Connect Google Sheets Sync in Settings first. Members come from the Post\'s Google Contacts through that sync.');
      return;
    }
    try {
      const result = await syncNow();
      if (result) {
        Alert.alert('Sync Complete', result.pulled > 0 ? `Received ${result.pulled} updates.` : 'The member list is up to date.');
      }
    } catch (error) {
      Alert.alert('Sync Failed', error instanceof Error ? error.message : String(error));
    }
  };
  
  const handleMemberPress = (id: string) => {
    router.push(`/member/${id}`);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };
  
  const getStatusColor = (status: MemberStatus) => memberStatusColor(status);
  
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
                {CONTACTS_ROSTER_MESSAGE}
              </Text>

              <View style={styles.modalButtons}>
                <Button
                  title="Sync Now"
                  onPress={() => {
                    setShowAdvisoryDialog(false);
                    handleSyncNow();
                  }}
                  style={styles.modalButton}
                />
                <Button
                  title="Cancel"
                  onPress={() => setShowAdvisoryDialog(false)}
                  variant="outline"
                  style={styles.modalButton}
                />
              </View>
            </View>
          </View>
        </Modal>

        <EmptyState
          title="No Members Found"
          description="Members come from the Post's Google Contacts through Google Sheets sync. Connect sync in Settings, then tap Sync Now."
          actionLabel="Sync Now"
          onAction={handleSyncNow}
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
              {CONTACTS_ROSTER_MESSAGE}
            </Text>

            <View style={styles.modalButtons}>
              <Button
                title="Sync Now"
                onPress={() => {
                  setShowAdvisoryDialog(false);
                  handleSyncNow();
                }}
                style={styles.modalButton}
              />
              <Button
                title="Cancel"
                onPress={() => setShowAdvisoryDialog(false)}
                variant="outline"
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
          style={styles.actionButton}
          onPress={handleSyncNow}
          disabled={isSyncing}
        >
          <RefreshCw size={16} color={Colors.light.primary} />
          <Text style={styles.actionButtonText}>{isSyncing ? 'Syncing...' : 'Sync Now'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, activeOnly && styles.toggleOnButton]}
          onPress={() => setActiveOnly(!activeOnly)}
          accessibilityRole="switch"
          accessibilityState={{ checked: activeOnly }}
        >
          <Check size={16} color={activeOnly ? '#fff' : Colors.light.primary} />
          <Text style={[styles.actionButtonText, activeOnly && styles.toggleOnText]}>Active only</Text>
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
              {filteredMembers.length} {activeOnly ? 'active ' : ''}member{filteredMembers.length !== 1 ? 's' : ''} found
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
                      <Text style={styles.memberId}>{memberSubtitle(member)}</Text>
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
                    
                    {member.joinDate && (
                      <View style={styles.memberDetail}>
                        <Calendar size={14} color={Colors.light.subtext} />
                        <Text style={styles.memberDetailText}>
                          {member.source === 'google-contacts'
                            ? `Member since ${new Date(member.joinDate).getUTCFullYear()}`
                            : `Joined: ${formatDate(member.joinDate)}`}
                        </Text>
                      </View>
                    )}
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
  toggleOnButton: {
    backgroundColor: Colors.light.success,
  },
  toggleOnText: {
    color: '#fff',
    fontWeight: '600',
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
    marginLeft: 8,
  },
});