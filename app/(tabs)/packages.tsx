import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { usePackageStore } from '@/store/packageStore';
import { useMemberStore } from '@/store/memberStore';
import EmptyState from '@/components/EmptyState';
import PackageCard from '@/components/PackageCard';
import { Plus, Search, Filter } from 'lucide-react-native';

export default function PackagesScreen() {
  const router = useRouter();
  const { packages } = usePackageStore();
  const { getMemberById } = useMemberStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  
  // Filter packages based on search and status
  const filteredPackages = packages.filter(pkg => {
    const member = getMemberById(pkg.memberId);
    const matchesSearch = searchQuery === '' || 
      pkg.trackingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member && member.name.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = selectedStatus === null || pkg.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  const pendingPackages = packages.filter(pkg => pkg.status === 'pending');
  const pickedUpPackages = packages.filter(pkg => pkg.status === 'picked-up');
  
  const handleAddPackage = () => {
    router.push('/add-package');
  };
  
  if (packages.length === 0) {
    return (
      <EmptyState
        title="No Packages"
        description="No packages have been added yet. Add your first package to get started."
        actionLabel="Add Package"
        onAction={handleAddPackage}
      />
    );
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color={Colors.light.subtext} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search packages..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.subtext}
          />
        </View>
      </View>
      
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.statusContainer}
        contentContainerStyle={styles.statusContent}
      >
        <TouchableOpacity
          style={[
            styles.statusChip,
            selectedStatus === null && styles.selectedStatusChip
          ]}
          onPress={() => setSelectedStatus(null)}
        >
          <Text style={[
            styles.statusText,
            selectedStatus === null && styles.selectedStatusText
          ]}>
            All ({packages.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.statusChip,
            selectedStatus === 'pending' && styles.selectedStatusChip
          ]}
          onPress={() => setSelectedStatus('pending')}
        >
          <Text style={[
            styles.statusText,
            selectedStatus === 'pending' && styles.selectedStatusText
          ]}>
            Pending ({pendingPackages.length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.statusChip,
            selectedStatus === 'picked-up' && styles.selectedStatusChip
          ]}
          onPress={() => setSelectedStatus('picked-up')}
        >
          <Text style={[
            styles.statusText,
            selectedStatus === 'picked-up' && styles.selectedStatusText
          ]}>
            Picked Up ({pickedUpPackages.length})
          </Text>
        </TouchableOpacity>
      </ScrollView>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredPackages.length > 0 ? (
          filteredPackages
            .sort((a, b) => new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime())
            .map(pkg => (
              <PackageCard key={pkg.id} package={pkg} />
            ))
        ) : (
          <EmptyState
            title="No Matching Packages"
            description="Try adjusting your search or filter criteria."
            icon={<Filter size={48} color={Colors.light.subtext} />}
          />
        )}
      </ScrollView>
      
      <TouchableOpacity 
        style={styles.fab}
        onPress={handleAddPackage}
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
  statusContainer: {
    maxHeight: 50,
  },
  statusContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statusChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedStatusChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  statusText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  selectedStatusText: {
    color: '#fff',
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
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