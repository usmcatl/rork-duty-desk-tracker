import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TouchableOpacity, 
  Alert,
  Image,
  Linking
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { usePackageStore } from '@/store/packageStore';
import { useMemberStore } from '@/store/memberStore';
import { useEquipmentStore } from '@/store/equipmentStore';
import Button from '@/components/Button';
import Dropdown from '@/components/Dropdown';
import EmptyState from '@/components/EmptyState';
import { 
  Package2, 
  User, 
  Calendar, 
  MapPin, 
  FileText, 
  Check, 
  Phone, 
  Mail,
  Camera,
  Truck,
  Clock,
  Shield
} from 'lucide-react-native';

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { packages, markAsPickedUp } = usePackageStore();
  const { getMemberById } = useMemberStore();
  const { getDutyOfficers } = useEquipmentStore();
  
  const [handOffBy, setHandOffBy] = useState('');
  
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
  const dutyOfficers = getDutyOfficers();
  
  const handleMarkAsPickedUp = () => {
    if (!handOffBy.trim()) {
      Alert.alert('Error', 'Please select who handed off the package.');
      return;
    }
    
    Alert.alert(
      'Mark as Picked Up',
      'Are you sure this package has been picked up by the recipient?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Confirm',
          onPress: () => {
            markAsPickedUp(id, handOffBy.trim());
            Alert.alert(
              'Package Marked as Picked Up',
              'The package has been successfully marked as picked up.',
              [
                {
                  text: 'OK',
                  onPress: () => router.back()
                }
              ]
            );
          }
        }
      ]
    );
  };
  
  const handleCall = () => {
    if (member?.phone) {
      Linking.openURL(`tel:${member.phone}`);
    }
  };
  
  const handleEmail = () => {
    if (member?.email) {
      Linking.openURL(`mailto:${member.email}`);
    }
  };
  
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const formatMemberDisplay = (memberData: any) => {
    if (!memberData) return 'Unknown Member';
    
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
          title: "Package Details",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.primary,
        }} 
      />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge,
            packageItem.status === 'picked-up' ? styles.statusPickedUp : styles.statusPending
          ]}>
            <Text style={[
              styles.statusText,
              packageItem.status === 'picked-up' ? styles.statusTextPickedUp : styles.statusTextPending
            ]}>
              {packageItem.status === 'picked-up' ? 'PICKED UP' : 'PENDING PICKUP'}
            </Text>
          </View>
        </View>
        
        <View style={styles.packageInfo}>
          <View style={styles.packageHeader}>
            <Package2 size={24} color={Colors.light.primary} />
            <Text style={styles.packageTitle}>Package Information</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Description:</Text>
            <Text style={styles.infoValue}>{packageItem.description}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sender:</Text>
            <Text style={styles.infoValue}>{packageItem.sender}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Storage Location:</Text>
            <Text style={styles.infoValue}>{packageItem.storageLocation}</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Arrival Date:</Text>
            <Text style={styles.infoValue}>{formatDate(packageItem.arrivalDate)}</Text>
          </View>
          
          {packageItem.pickupDate && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Pickup Date:</Text>
              <Text style={styles.infoValue}>{formatDate(packageItem.pickupDate)}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Received By:</Text>
            <Text style={styles.infoValue}>{packageItem.addedBy}</Text>
          </View>
          
          {packageItem.handOffBy && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Handed Off By:</Text>
              <Text style={styles.infoValue}>{packageItem.handOffBy}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.recipientInfo}>
          <View style={styles.recipientHeader}>
            <User size={24} color={Colors.light.primary} />
            <Text style={styles.recipientTitle}>Recipient Information</Text>
          </View>
          
          <View style={styles.recipientDetails}>
            <Text style={styles.recipientName}>
              {formatMemberDisplay(member)}
            </Text>
            {member && (
              <>
                <Text style={styles.memberId}>ID: {member.memberId}</Text>
                {member.phone && (
                  <Text style={styles.memberContact}>Phone: {member.phone}</Text>
                )}
                {member.email && (
                  <Text style={styles.memberContact}>Email: {member.email}</Text>
                )}
              </>
            )}
          </View>
          
          {member && (member.phone || member.email) && (
            <View style={styles.contactActions}>
              {member.phone && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={handleCall}
                >
                  <Phone size={16} color="#fff" />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
              )}
              
              {member.email && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={handleEmail}
                >
                  <Mail size={16} color="#fff" />
                  <Text style={styles.contactButtonText}>Email</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
        
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
        
        {packageItem.notes && (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <FileText size={20} color={Colors.light.primary} />
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{packageItem.notes}</Text>
          </View>
        )}
        
        {packageItem.status === 'pending' && (
          <View style={styles.pickupSection}>
            <Text style={styles.pickupTitle}>Mark as Picked Up</Text>
            
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Hand Off By *</Text>
              <Dropdown
                options={dutyOfficers}
                value={handOffBy}
                onSelect={setHandOffBy}
                placeholder="Select duty officer"
              />
            </View>
            
            <Button
              title="Mark as Picked Up"
              onPress={handleMarkAsPickedUp}
              style={styles.pickupButton}
              icon={<Check size={20} color="#fff" />}
            />
          </View>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  statusBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    borderWidth: 1,
    borderColor: '#FFC107',
  },
  statusPickedUp: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
    borderWidth: 1,
    borderColor: '#28A745',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusTextPending: {
    color: '#FFC107',
  },
  statusTextPickedUp: {
    color: '#28A745',
  },
  packageInfo: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  packageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  packageTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.light.subtext,
    width: 120,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  recipientInfo: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  recipientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  recipientTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
  },
  recipientDetails: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  memberId: {
    fontSize: 14,
    color: Colors.light.primary,
    marginBottom: 4,
  },
  memberContact: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 2,
  },
  contactActions: {
    flexDirection: 'row',
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginRight: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '500',
    marginLeft: 6,
  },
  photosContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
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
  },
  notesContainer: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
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
  pickupSection: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  pickupTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  pickupButton: {
    marginTop: 8,
  },
});