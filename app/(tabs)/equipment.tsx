import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import EquipmentCard from '@/components/EquipmentCard';
import EmptyState from '@/components/EmptyState';
import { Plus, Search, Filter, Package, CheckSquare, List } from 'lucide-react-native';

type FilterType = 'all' | 'available' | 'checked-out';

export default function EquipmentScreen() {
  const router = useRouter();
  const { equipment } = useEquipmentStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<FilterType>('all');
  
  // Filter equipment based on status
  const statusFilteredEquipment = equipment.filter(item => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });
  
  // Get unique categories from filtered equipment
  const categories = Array.from(new Set(statusFilteredEquipment.map(item => item.category)));
  
  // Filter equipment based on search and category
  const filteredEquipment = statusFilteredEquipment.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = selectedCategory === null || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });
  
  const handleAddEquipment = () => {
    router.push('/add-equipment');
  };
  
  const getStatusFilterLabel = (filter: FilterType) => {
    switch (filter) {
      case 'all': return 'All Equipment';
      case 'available': return 'Available';
      case 'checked-out': return 'Checked Out';
    }
  };
  
  const getStatusFilterIcon = (filter: FilterType) => {
    switch (filter) {
      case 'all': return <List size={18} color={statusFilter === filter ? '#fff' : Colors.light.primary} />;
      case 'available': return <Package size={18} color={statusFilter === filter ? '#fff' : Colors.light.success} />;
      case 'checked-out': return <CheckSquare size={18} color={statusFilter === filter ? '#fff' : Colors.light.error} />;
    }
  };
  
  if (equipment.length === 0) {
    return (
      <EmptyState
        title="No Equipment Added"
        description="Start by adding your first piece of equipment to track."
        actionLabel="Add Equipment"
        onAction={handleAddEquipment}
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
            placeholder="Search equipment..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.subtext}
          />
        </View>
      </View>
      
      {/* Status Filter */}
      <ScrollView 
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filtersContainer}
        contentContainerStyle={styles.filtersContent}
      >
        {(['all', 'available', 'checked-out'] as FilterType[]).map(filter => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.statusFilterChip,
              statusFilter === filter && styles.selectedStatusFilterChip
            ]}
            onPress={() => {
              setStatusFilter(filter);
              setSelectedCategory(null); // Reset category when changing status
            }}
          >
            {getStatusFilterIcon(filter)}
            <Text style={[
              styles.statusFilterText,
              statusFilter === filter && styles.selectedStatusFilterText
            ]}>
              {getStatusFilterLabel(filter)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      {/* Category Filter */}
      {categories.length > 0 && (
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              selectedCategory === null && styles.selectedCategoryChip
            ]}
            onPress={() => setSelectedCategory(null)}
          >
            <Text style={[
              styles.categoryText,
              selectedCategory === null && styles.selectedCategoryText
            ]}>
              All Categories
            </Text>
          </TouchableOpacity>
          
          {categories.map(category => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.selectedCategoryChip
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryText,
                selectedCategory === category && styles.selectedCategoryText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {filteredEquipment.length > 0 ? (
          <>
            <Text style={styles.headerText}>
              {filteredEquipment.length} item{filteredEquipment.length !== 1 ? 's' : ''} 
              {statusFilter !== 'all' && ` ${statusFilter === 'available' ? 'available' : 'checked out'}`}
            </Text>
            
            {filteredEquipment.map(item => (
              <EquipmentCard key={item.id} equipment={item} />
            ))}
          </>
        ) : (
          <EmptyState
            title="No Matching Equipment"
            description="Try adjusting your search or filter criteria."
            icon={<Filter size={48} color={Colors.light.subtext} />}
          />
        )}
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
  filtersContainer: {
    maxHeight: 50,
  },
  filtersContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statusFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    backgroundColor: Colors.light.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedStatusFilterChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  statusFilterText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 6,
    fontWeight: '500',
  },
  selectedStatusFilterText: {
    color: '#fff',
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedCategoryChip: {
    backgroundColor: Colors.light.secondary,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  selectedCategoryText: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 80,
  },
  headerText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.subtext,
    marginBottom: 16,
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