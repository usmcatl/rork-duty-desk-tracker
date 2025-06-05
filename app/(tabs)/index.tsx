import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useMemberStore } from '@/store/memberStore';
import EquipmentCard from '@/components/EquipmentCard';
import { Plus, Package, CheckSquare, Search, User, Users, ChevronRight, X } from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { equipment, checkoutRecords } = useEquipmentStore();
  const { members, getMemberById } = useMemberStore();
  
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  const availableEquipment = equipment.filter(item => item.status === 'available');
  const checkedOutEquipment = equipment.filter(item => item.status === 'checked-out');
  
  // Get recent checkouts (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentCheckouts = checkoutRecords
    .filter(record => new Date(record.checkoutDate) > sevenDaysAgo)
    .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime());
  
  // Filter members based on search
  const filteredMembers = members.filter(member => {
    return memberSearchQuery === '' || 
      member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      member.memberId.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      (member.phone && member.phone.includes(memberSearchQuery));
  });
  
  const handleAddEquipment = () => {
    router.push('/add-equipment');
  };
  
  const handleMemberPress = (id: string) => {
    setShowMemberSearch(false);
    setMemberSearchQuery('');
    router.push(`/member/${id}`);
  };
  
  const handleViewAllMembers = () => {
    router.push('/members');
  };
  
  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Section */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.availableStat]}>
            <Package size={24} color={Colors.light.success} />
            <Text style={styles.statNumber}>{availableEquipment.length}</Text>
            <Text style={styles.statLabel}>Available</Text>
          </View>
          
          <View style={[styles.statCard, styles.checkedOutStat]}>
            <CheckSquare size={24} color={Colors.light.error} />
            <Text style={styles.statNumber}>{checkedOutEquipment.length}</Text>
            <Text style={styles.statLabel}>Checked Out</Text>
          </View>
          
          <View style={[styles.statCard, styles.membersStat]}>
            <Users size={24} color={Colors.light.primary} />
            <Text style={styles.statNumber}>{members.length}</Text>
            <Text style={styles.statLabel}>Members</Text>
          </View>
        </View>
        
        {/* Recent Activity Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          
          {recentCheckouts.length > 0 ? (
            recentCheckouts.slice(0, 3).map(record => {
              const item = equipment.find(e => e.id === record.equipmentId);
              const member = getMemberById(record.memberId);
              if (!item) return null;
              
              return (
                <TouchableOpacity 
                  key={record.id}
                  style={styles.activityItem}
                  onPress={() => router.push(`/equipment/${item.id}`)}
                >
                  <View style={styles.activityIcon}>
                    {record.returnDate ? (
                      <Package size={20} color={Colors.light.success} />
                    ) : (
                      <CheckSquare size={20} color={Colors.light.primary} />
                    )}
                  </View>
                  
                  <View style={styles.activityContent}>
                    <Text style={styles.activityTitle}>
                      {record.returnDate ? 'Returned:' : 'Checked Out:'} {item.name}
                    </Text>
                    <Text style={styles.activityMeta}>
                      {member ? member.name : 'Unknown Member'} • {new Date(record.checkoutDate).toLocaleDateString()}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          ) : (
            <Text style={styles.emptyText}>No recent activity</Text>
          )}
        </View>
        
        {/* Quick Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          
          <View style={styles.quickLinks}>
            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => router.push('/available')}
            >
              <Package size={24} color={Colors.light.primary} />
              <Text style={styles.quickLinkText}>Available Equipment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => router.push('/checked-out')}
            >
              <CheckSquare size={24} color={Colors.light.primary} />
              <Text style={styles.quickLinkText}>Checked Out Equipment</Text>
            </TouchableOpacity>
          </View>
          
          {/* Member Lookup Section */}
          <View style={styles.memberLookupContainer}>
            {showMemberSearch ? (
              <View style={styles.memberSearchContainer}>
                <View style={styles.searchHeader}>
                  <Text style={styles.searchTitle}>Member Lookup</Text>
                  <TouchableOpacity 
                    onPress={() => {
                      setShowMemberSearch(false);
                      setMemberSearchQuery('');
                    }}
                  >
                    <X size={20} color={Colors.light.subtext} />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.searchInputContainer}>
                  <Search size={20} color={Colors.light.subtext} style={styles.searchIcon} />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, ID, or phone..."
                    value={memberSearchQuery}
                    onChangeText={setMemberSearchQuery}
                    placeholderTextColor={Colors.light.subtext}
                    autoFocus
                  />
                </View>
                
                <ScrollView 
                  style={styles.searchResultsContainer}
                  contentContainerStyle={styles.searchResultsContent}
                >
                  {filteredMembers.length > 0 ? (
                    filteredMembers.slice(0, 5).map(member => (
                      <TouchableOpacity
                        key={member.id}
                        style={styles.memberItem}
                        onPress={() => handleMemberPress(member.id)}
                      >
                        <View style={styles.memberItemLeft}>
                          <User size={20} color={Colors.light.primary} />
                          <View style={styles.memberItemInfo}>
                            <Text style={styles.memberItemName}>{member.name}</Text>
                            <Text style={styles.memberItemId}>ID: {member.memberId}</Text>
                          </View>
                        </View>
                        <ChevronRight size={20} color={Colors.light.subtext} />
                      </TouchableOpacity>
                    ))
                  ) : (
                    <Text style={styles.emptyText}>No members found</Text>
                  )}
                  
                  {filteredMembers.length > 5 && (
                    <TouchableOpacity
                      style={styles.viewAllButton}
                      onPress={handleViewAllMembers}
                    >
                      <Text style={styles.viewAllText}>
                        View all {filteredMembers.length} results
                      </Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.memberLookupButton}
                onPress={() => setShowMemberSearch(true)}
              >
                <View style={styles.memberLookupIcon}>
                  <Users size={24} color={Colors.light.primary} />
                </View>
                <View style={styles.memberLookupContent}>
                  <Text style={styles.memberLookupTitle}>Member Lookup</Text>
                  <Text style={styles.memberLookupDescription}>
                    Search for members by name, ID, or phone number
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.light.primary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
        
        {/* Recently Added Equipment */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recently Added Equipment</Text>
          
          {equipment.length > 0 ? (
            equipment
              .sort((a, b) => new Date(b.addedDate).getTime() - new Date(a.addedDate).getTime())
              .slice(0, 2)
              .map(item => (
                <EquipmentCard key={item.id} equipment={item} />
              ))
          ) : (
            <Text style={styles.emptyText}>No equipment added yet</Text>
          )}
        </View>
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddEquipment}
      >
        <Plus size={24} color="#fff" />
      </TouchableOpacity>
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
    paddingBottom: 80,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  availableStat: {
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
  },
  checkedOutStat: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  membersStat: {
    backgroundColor: 'rgba(0, 119, 204, 0.1)',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginVertical: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.light.subtext,
    textAlign: 'center',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  activityMeta: {
    fontSize: 12,
    color: Colors.light.subtext,
  },
  quickLinks: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  quickLink: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.secondary,
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
  },
  quickLinkText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.primary,
    marginTop: 8,
    textAlign: 'center',
  },
  memberLookupContainer: {
    marginTop: 8,
  },
  memberLookupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    padding: 16,
    borderRadius: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  memberLookupIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  memberLookupContent: {
    flex: 1,
  },
  memberLookupTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  memberLookupDescription: {
    fontSize: 12,
    color: Colors.light.subtext,
  },
  memberSearchContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 1,
    shadowRadius: 2,
    elevation: 1,
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: 12,
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
  searchResultsContainer: {
    maxHeight: 300,
  },
  searchResultsContent: {
    paddingBottom: 8,
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  memberItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberItemInfo: {
    marginLeft: 12,
    flex: 1,
  },
  memberItemName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 2,
  },
  memberItemId: {
    fontSize: 12,
    color: Colors.light.subtext,
  },
  viewAllButton: {
    alignItems: 'center',
    padding: 12,
    backgroundColor: Colors.light.secondary,
    borderRadius: 8,
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
});