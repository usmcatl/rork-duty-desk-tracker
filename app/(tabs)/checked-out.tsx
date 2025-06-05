import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import EquipmentCard from '@/components/EquipmentCard';
import EmptyState from '@/components/EmptyState';
import { Search, Filter } from 'lucide-react-native';

export default function CheckedOutScreen() {
  const router = useRouter();
  const { equipment } = useEquipmentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  const checkedOutEquipment = equipment.filter(item => item.status === 'checked-out');
  
  // Filter equipment based on search
  const filteredEquipment = checkedOutEquipment.filter(item => {
    return searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
  });
  
  if (checkedOutEquipment.length === 0) {
    return (
      <EmptyState
        title="No Checked Out Equipment"
        description="All equipment is currently available."
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
            placeholder="Search checked out equipment..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.subtext}
          />
        </View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredEquipment.length > 0 ? (
          <>
            <Text style={styles.headerText}>
              {filteredEquipment.length} item{filteredEquipment.length !== 1 ? 's' : ''} currently checked out
            </Text>
            
            {filteredEquipment.map(item => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </>
        ) : (
          <EmptyState
            title="No Matching Equipment"
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.subtext,
    marginBottom: 16,
  },
});