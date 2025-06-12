import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { usePackageStore } from '@/store/packageStore';
import { useMemberStore } from '@/store/memberStore';
import EmptyState from '@/components/EmptyState';
import PackageCard from '@/components/PackageCard';
import Button from '@/components/Button';
import { Plus, Search, Filter, MapPin, CheckSquare } from 'lucide-react-native';

// Package storage location options
const STORAGE_LOCATIONS = ['Bar Storage', 'Package Cage'];

export default function PackagesScreen() {
  const router = useRouter();
  const { packages, massUpdateStorageLocation } = usePackageStore();
  const { getMemberById } = useMemberStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [showMassUpdate, setShowMassUpdate] = useState(false);
  const [selectedPackages, setSelectedPackages] = useState<string[]>([]);
  const [selectedStorageLocation, setSelectedStorageLocation] = useState<string>('');
  
  // Filter packages based on search and status
  const filteredPackages = packages.filter(pkg => {
    const member = getMemberById(pkg.memberId);
    const matchesSearch = searchQuery === '' || 
      pkg.recipientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      pkg.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member && member.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (member && member.aliases && member.aliases.some(alias => 
        alias.toLowerCase().includes(searchQuery.toLowerCase())
      ));
    
    const matchesStatus = selectedStatus === null || pkg.status === selectedStatus;
    
    return matchesSearch && matchesStatus;
  });
  
  const pendingPackages = packages.filter(pkg => pkg.status === 'pending');
  const pickedUpPackages = packages.filter(pkg => pkg.status === 'picked-up');
  
  const handleAddPackage = () => {
    router.push('/add-package');
  };
  
  const handleTogglePackageSelection = (packageId: string) => {
    setSelectedPackages(prev => 
      prev.includes(packageId) 
        ? prev.filter(id => id !== packageId)
        : [...prev, packageId]
    );
  };
  
  const handleMassUpdateStorage = () => {
    if (selectedPackages.length === 0) {
      Alert.alert('Error', 'Please select at least one package.');
      return;
    }
    
    if (!selectedStorageLocation) {
      Alert.alert('Error', 'Please select a storage location.');
      return;
    }
    
    Alert.alert(
      'Confirm Mass Update',
      `Update storage location for ${selectedPackages.length} package(s) to "${selectedStorageLocation}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Update',
          onPress: () => {
            massUpdateStorageLocation(selectedPackages, selectedStorageLocation);
            setSelectedPackages([]);
            setSelectedStorageLocation('');
            setShowMassUpdate(false);
            Alert.alert('Success', 'Storage locations updated successfully!');
          }
        }
      ]
    );
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
        
        <TouchableOpacity
          style={styles.massUpdateButton}
          onPress={() => setShowMassUpdate(!showMassUpdate)}
        >
          <MapPin size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>
      
      {showMassUpdate && (
        <View style={styles.massUpdateContainer}>
          <Text style={styles.massUpdateTitle}>Mass Update Storage Location</Text>
          <Text style={styles.massUpdateSubtitle}>
            Select packages and choose new storage location
          </Text>
          
          <View style={styles.storageLocationContainer}>
            <Text style={styles.storageLocationLabel}>Storage Location:</Text>
            <View style={styles.storageLocationOptions}>
              {STORAGE_LOCATIONS.map((location) => (
                <TouchableOpacity
                  key={location}
                  style={[
                    styles.storageLocationOption,
                    selectedStorageLocation === location && styles.selectedStorageLocationOption
                  ]}
                  onPress={() => setSelectedStorageLocation(location)}
                >
                  <Text style={[
                    styles.storageLocationOptionText,
                    selectedStorageLocation === location && styles.selectedStorageLocationOptionText
                  ]}>
                    {location}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.massUpdateActions}>
            <Button
              title="Cancel"
              onPress={() => {
                setShowMassUpdate(false);
                setSelectedPackages([]);
                setSelectedStorageLocation('');
              }}
              variant="outline"
              style={styles.massUpdateActionButton}
            />
            <Button
              title={`Update ${selectedPackages.length} packages`}
              onPress={handleMassUpdateStorage}
              style={styles.massUpdateActionButton}
            />
          </View>
        </View>
      )}
      
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
              <View key={pkg.id} style={styles.packageContainer}>
                {showMassUpdate && (
                  <TouchableOpacity
                    style={styles.selectionButton}
                    onPress={() => handleTogglePackageSelection(pkg.id)}
                  >
                    <View style={[
                      styles.checkbox,
                      selectedPackages.includes(pkg.id) && styles.checkedBox
                    ]}>
                      {selectedPackages.includes(pkg.id) && (
                        <CheckSquare size={16} color="#fff" />
                      )}
                    </View>
                  </TouchableOpacity>
                )}
                <View style={[styles.packageCardContainer, showMassUpdate && styles.packageCardWithSelection]}>
                  <PackageCard package={pkg} />
                </View>
              </View>
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
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 8,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 12,
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
  massUpdateButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  massUpdateContainer: {
    backgroundColor: Colors.light.card,
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  massUpdateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  massUpdateSubtitle: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 16,
  },
  storageLocationContainer: {
    marginBottom: 16,
  },
  storageLocationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  storageLocationOptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storageLocationOption: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  selectedStorageLocationOption: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  storageLocationOptionText: {
    fontSize: 14,
    color: Colors.light.text,
    textAlign: 'center',
  },
  selectedStorageLocationOptionText: {
    color: '#fff',
    fontWeight: '500',
  },
  massUpdateActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  massUpdateActionButton: {
    flex: 1,
    marginHorizontal: 4,
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
  packageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  selectionButton: {
    marginRight: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: Colors.light.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  packageCardContainer: {
    flex: 1,
  },
  packageCardWithSelection: {
    marginLeft: 0,
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