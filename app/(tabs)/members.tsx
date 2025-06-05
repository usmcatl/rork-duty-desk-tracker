import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Alert
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useMemberStore } from '@/store/memberStore';
import EmptyState from '@/components/EmptyState';
import { Plus, Search, Filter, User, Phone, Calendar, ChevronRight, Users, Upload } from 'lucide-react-native';

export default function MembersScreen() {
  const router = useRouter();
  const { members } = useMemberStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  
  // Filter members based on search
  const filteredMembers = members.filter(member => {
    return searchQuery === '' || 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.memberId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (member.phone && member.phone.includes(searchQuery)) ||
      (member.email && member.email.toLowerCase().includes(searchQuery.toLowerCase()));
  });
  
  const handleAddMember = () => {
    router.push('/add-member');
  };
  
  const handleImportMembers = () => {
    router.push('/import-members');
  };
  
  const handleMemberPress = (id: string) => {
    router.push(`/member/${id}`);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };
  
  if (members.length === 0) {
    return (
      <EmptyState
        title="No Members Found"
        description="Start by adding members to the database or import an existing list."
        actionLabel="Add Member"
        onAction={handleAddMember}
        icon={<Users size={48} color={Colors.light.primary} />}
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
            placeholder="Search members..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholderTextColor={Colors.light.subtext}
          />
        </View>
      </View>
      
      <View style={styles.actionsContainer}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleAddMember}
        >
          <Plus size={16} color={Colors.light.primary} />
          <Text style={styles.actionButtonText}>Add Member</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={handleImportMembers}
        >
          <Upload size={16} color={Colors.light.primary} />
          <Text style={styles.actionButtonText}>Import</Text>
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
                    <Text style={styles.memberId}>ID: {member.memberId}</Text>
                  </View>
                  
                  <View style={styles.memberDetails}>
                    <View style={styles.memberDetail}>
                      <Phone size={14} color={Colors.light.subtext} />
                      <Text style={styles.memberDetailText}>
                        {member.phone || 'No phone'}
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
        style={styles.fab}
        onPress={handleAddMember}
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
  actionButtonText: {
    fontSize: 14,
    color: Colors.light.primary,
    marginLeft: 4,
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
  memberId: {
    fontSize: 14,
    color: Colors.light.primary,
    fontWeight: '500',
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
});