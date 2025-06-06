import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import { usePackageStore } from '@/store/packageStore';
import { useMemberStore } from '@/store/memberStore';
import EquipmentNameplate from '@/components/EquipmentNameplate';
import PackageCard from '@/components/PackageCard';
import { Plus, Package, CheckSquare, Search, User, Users, ChevronRight, X, Package2, Clock, UserPlus } from 'lucide-react-native';

export default function DashboardScreen() {
  const router = useRouter();
  const { equipment, checkoutRecords } = useEquipmentStore();
  const { packages } = usePackageStore();
  const { members, getMemberById } = useMemberStore();
  
  const [showMemberSearch, setShowMemberSearch] = useState(false);
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  
  const availableEquipment = equipment.filter(item => item.status === 'available');
  const checkedOutEquipment = equipment.filter(item => item.status === 'checked-out');
  const pendingPackages = packages.filter(pkg => pkg.status === 'pending');
  const pickedUpPackages = packages.filter(pkg => pkg.status === 'picked-up');
  
  // Get recent checkouts (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  
  const recentCheckouts = checkoutRecords
    .filter(record => new Date(record.checkoutDate) > sevenDaysAgo)
    .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime());
  
  // Get recent packages (last 7 days)
  const recentPackages = packages
    .filter(pkg => new Date(pkg.arrivalDate) > sevenDaysAgo)
    .sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime());
  
  // Filter members based on search
  const filteredMembers = members.filter(member => {
    return memberSearchQuery === '' || 
      member.name.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      member.memberId.toLowerCase().includes(memberSearchQuery.toLowerCase()) ||
      (member.phone && member.phone.includes(memberSearchQuery)) ||
      (member.aliases && member.aliases.some(alias => 
        alias.toLowerCase().includes(memberSearchQuery.toLowerCase())
      ));
  });
  
  const handleAddEquipment = () => {
    router.push('/add-equipment');
  };
  
  const handleAddPackage = () => {
    router.push('/add-package');
  };
  
  const handleAddMember = () => {
    router.push('/add-member');
  };
  
  const handleMemberPress = (id: string) => {
    setShowMemberSearch(false);
    setMemberSearchQuery('');
    router.push(`/member/${id}`);
  };
  
  const handleViewAllMembers = () => {
    router.push('/members');
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
            <CheckSquare size={24} color={Colors.light.flagRed} />
            <Text style={styles.statNumber}>{checkedOutEquipment.length}</Text>
            <Text style={styles.statLabel}>Checked Out</Text>
          </View>
          
          <View style={[styles.statCard, styles.packagesStat]}>
            <Package2 size={24} color={Colors.light.primary} />
            <Text style={styles.statNumber}>{pendingPackages.length}</Text>
            <Text style={styles.statLabel}>Packages</Text>
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
          
          {(recentCheckouts.length > 0 || recentPackages.length > 0) ? (
            <>
              {recentCheckouts.slice(0, 2).map(record => {
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
                        {member ? formatMemberDisplay(member) : 'Unknown Member'} • {new Date(record.checkoutDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              
              {recentPackages.slice(0, 2).map(pkg => {
                const member = getMemberById(pkg.memberId);
                
                return (
                  <TouchableOpacity 
                    key={pkg.id}
                    style={styles.activityItem}
                    onPress={() => router.push(`/package/${pkg.id}`)}
                  >
                    <View style={styles.activityIcon}>
                      {pkg.status === 'picked-up' ? (
                        <CheckSquare size={20} color={Colors.light.success} />
                      ) : (
                        <Clock size={20} color={Colors.light.flagRed} />
                      )}
                    </View>
                    
                    <View style={styles.activityContent}>
                      <Text style={styles.activityTitle}>
                        {pkg.status === 'picked-up' ? 'Package Picked Up:' : 'Package Arrived:'} {pkg.recipientName}
                      </Text>
                      <Text style={styles.activityMeta}>
                        {member ? formatMemberDisplay(member) : pkg.recipientName} • {new Date(pkg.arrivalDate).toLocaleDateString()}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </>
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
              onPress={() => router.push('/equipment')}
            >
              <Package size={24} color={Colors.light.primary} />
              <Text style={styles.quickLinkText}>Equipment</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => router.push('/packages')}
            >
              <Package2 size={24} color={Colors.light.primary} />
              <Text style={styles.quickLinkText}>Packages</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.quickLinks}>
            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => router.push('/members')}
            >
              <Users size={24} color={Colors.light.primary} />
              <Text style={styles.quickLinkText}>Members</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.quickLink}
              onPress={() => router.push('/settings')}
            >
              <Package size={24} color={Colors.light.primary} />
              <Text style={styles.quickLinkText}>Settings</Text>
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
                    placeholder="Search by name, ID, phone, or alias..."
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
                            <Text style={styles.memberItemName}>
                              {formatMemberDisplay(member)}
                            </Text>
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
                    Search for members by name, ID, phone, or alias
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
              .slice(0, 3)
              .map(item => (
                <EquipmentNameplate key={item.id} equipment={item} />
              ))
          ) : (
            <Text style={styles.emptyText}>No equipment added yet</Text>
          )}
        </View>
        
        {/* Recent Packages */}
        {packages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Packages</Text>
            
            {packages
              .sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime())
              .slice(0, 2)
              .map(pkg => (
                <PackageCard key={pkg.id} package={pkg} />
              ))}
          </View>
        )}
      </ScrollView>
      
      <View style={styles.fabContainer}>
        <TouchableOpacity 
          style={[styles.fab, styles.tertiaryFab]}
          onPress={handleAddMember}
        >
          <UserPlus size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.fab, styles.secondaryFab]}
          onPress={handleAddPackage}
        >
          <Package2 size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.fab}
          onPress={handleAddEquipment}
        >
          <Plus size={24} color="#fff" />
        </TouchableOpacity>
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
    marginHorizontal: 2,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  availableStat: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  checkedOutStat: {
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
  },
  packagesStat: {
    backgroundColor: 'rgba(0, 40, 104, 0.1)',
  },
  membersStat: {
    backgroundColor: 'rgba(0, 40, 104, 0.1)',
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
  fabContainer: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    alignItems: 'flex-end',
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.light.gold,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.light.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
    marginBottom: 12,
  },
  secondaryFab: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#000000',
    shadowColor: Colors.light.shadow,
  },
  tertiaryFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.flagRed,
    shadowColor: Colors.light.shadow,
  },
});