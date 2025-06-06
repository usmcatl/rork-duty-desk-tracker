import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { usePackageStore } from '@/store/packageStore';
import { useMemberStore } from '@/store/memberStore';
import Button from '@/components/Button';
import EmptyState from '@/components/EmptyState';
import { 
  Package2, 
  User, 
  Calendar, 
  MapPin, 
  FileText, 
  Edit, 
  Trash2,
  CheckCircle,
  Clock,
  Camera,
  Truck,
  Users
} from 'lucide-react-native';

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { packages, removePackage, markAsPickedUp } = usePackageStore();
  const { getMemberById, getAssociatedMembers } = useMemberStore();
  
  const packageItem = packages.find(p => p.id === id);
  
  if (!packageItem) {
    return (
      <EmptyState
        title="Package Not Found"
        description="The package you're looking for doesn't exist or has been removed."
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }
  
  const member = getMemberById(packageItem.memberId);
  const associatedMembers = member ? getAssociatedMembers(member.id) : [];
  
  const handleMarkAsPickedUp = () => {
    Alert.alert(
      "Confirm Package Pickup",
      "Are you sure this package has been picked up? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Confirm Pickup", 
          onPress: () => {
            Alert.alert(
              "Final Confirmation",
              "Please confirm that this package has actually been picked up by the recipient. This cannot be undone.",
              [
                {
                  text: "Cancel",
                  style: "cancel"
                },
                {
                  text: "Yes, Package Picked Up",
                  onPress: () => {
                    markAsPickedUp(packageItem.id);
                    Alert.alert('Success', 'Package marked as picked up!');
                  }
                }
              ]
            );
          }
        }
      ]
    );
  };
  
  const handleDeletePackage = () => {
    Alert.alert(
      "Delete Package",
      "Are you sure you want to delete this package? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            removePackage(packageItem.id);
            router.back();
          }
        }
      ]
    );
  };
  
  const handleMemberPress = (memberId: string) => {
    router.push(`/member/${memberId}`);
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString();
  };
  
  const formatMemberDisplay = (memberData: any) => {
    let display = memberData.name;
    if (memberData.aliases && memberData.aliases.length > 0) {
      display += ` "${memberData.aliases.join('", "')}"`;
    }
    return display;
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: packageItem.recipientName,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleDeletePackage}
                style={styles.headerButton}
              >
                <Trash2 size={24} color={Colors.light.flagRed} />
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
        <View style={styles.statusHeader}>
          <View style={styles.packageIcon}>
            <Package2 size={32} color={Colors.light.primary} />
          </View>
          
          <View style={styles.statusInfo}>
            <Text style={styles.recipientName}>{packageItem.recipientName}</Text>
            <View style={[
              styles.statusBadge,
              packageItem.status === 'pending' ? styles.pendingBadge : styles.pickedUpBadge
            ]}>
              {packageItem.status === 'pending' ? (
                <Clock size={16} color={Colors.light.flagRed} />
              ) : (
                <CheckCircle size={16} color={Colors.light.success} />
              )}
              <Text style={[
                styles.statusText,
                packageItem.status === 'pending' ? styles.pendingText : styles.pickedUpText
              ]}>
                {packageItem.status === 'pending' ? 'Awaiting Pickup' : 'Picked Up'}
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.detailsContainer}>
          <TouchableOpacity 
            style={styles.detailItem}
            onPress={() => member && handleMemberPress(member.id)}
          >
            <User size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Recipient</Text>
              <Text style={[styles.detailValue, member && styles.linkText]}>
                {member ? formatMemberDisplay(member) : packageItem.recipientName}
              </Text>
              {member && (
                <Text style={styles.detailSubValue}>Member ID: {member.memberId}</Text>
              )}
            </View>
          </TouchableOpacity>
          
          {/* Associated Members Section */}
          {associatedMembers.length > 0 && (
            <View style={styles.detailItem}>
              <Users size={20} color={Colors.light.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Associated Members</Text>
                {associatedMembers.map((associatedMember, index) => (
                  <TouchableOpacity
                    key={associatedMember.id}
                    onPress={() => handleMemberPress(associatedMember.id)}
                  >
                    <Text style={[styles.detailValue, styles.linkText, index > 0 && styles.associatedMemberSpacing]}>
                      {formatMemberDisplay(associatedMember)}
                    </Text>
                    <Text style={styles.detailSubValue}>ID: {associatedMember.memberId}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <FileText size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Description</Text>
              <Text style={styles.detailValue}>{packageItem.description}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Truck size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Sender</Text>
              <Text style={styles.detailValue}>{packageItem.sender}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <MapPin size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Storage Location</Text>
              <Text style={styles.detailValue}>{packageItem.storageLocation}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Calendar size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Arrival Date</Text>
              <Text style={styles.detailValue}>{formatDate(packageItem.arrivalDate)}</Text>
            </View>
          </View>
          
          {packageItem.pickupDate && (
            <View style={styles.detailItem}>
              <CheckCircle size={20} color={Colors.light.success} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pickup Date</Text>
                <Text style={styles.detailValue}>{formatDate(packageItem.pickupDate)}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <User size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Added By</Text>
              <Text style={styles.detailValue}>{packageItem.addedBy}</Text>
            </View>
          </View>
        </View>
        
        {packageItem.notes && (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <FileText size={20} color={Colors.light.primary} />
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{packageItem.notes}</Text>
          </View>
        )}
        
        <View style={styles.photosContainer}>
          <Text style={styles.photosTitle}>Package Photos</Text>
          
          <View style={styles.photoGrid}>
            <View style={styles.photoItem}>
              <Text style={styles.photoLabel}>Package</Text>
              <Image source={{ uri: packageItem.packagePhotoUri }} style={styles.photo} />
            </View>
            
            <View style={styles.photoItem}>
              <Text style={styles.photoLabel}>Label</Text>
              <Image source={{ uri: packageItem.labelPhotoUri }} style={styles.photo} />
            </View>
            
            <View style={styles.photoItem}>
              <Text style={styles.photoLabel}>Storage</Text>
              <Image source={{ uri: packageItem.storagePhotoUri }} style={styles.photo} />
            </View>
          </View>
        </View>
      </ScrollView>
      
      {packageItem.status === 'pending' && (
        <View style={styles.footer}>
          <Button
            title="Mark as Picked Up"
            onPress={handleMarkAsPickedUp}
            style={styles.pickupButton}
            icon={<CheckCircle size={20} color="#fff" />}
          />
        </View>
      )}
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
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingBottom: 24,
  },
  packageIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  statusInfo: {
    flex: 1,
  },
  recipientName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  pendingBadge: {
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
  },
  pickedUpBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  pendingText: {
    color: Colors.light.flagRed,
  },
  pickedUpText: {
    color: Colors.light.success,
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
  linkText: {
    color: Colors.light.primary,
    textDecorationLine: 'underline',
  },
  detailSubValue: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginTop: 2,
  },
  associatedMemberSpacing: {
    marginTop: 8,
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
  photosContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  photosTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoItem: {
    flex: 1,
    marginHorizontal: 4,
  },
  photoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  photo: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 8,
    backgroundColor: Colors.light.card,
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
  pickupButton: {
    width: '100%',
    backgroundColor: Colors.light.success,
  },
});