import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert,
  Linking
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
  CheckCircle, 
  Clock,
  Trash2,
  Phone,
  Mail,
  ChevronRight
} from 'lucide-react-native';

export default function PackageDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { packages, markAsPickedUp, removePackage } = usePackageStore();
  const { getMemberById } = useMemberStore();
  
  const pkg = packages.find(p => p.id === id);
  
  if (!pkg) {
    return (
      <EmptyState
        title="Package Not Found"
        description="The package you're looking for doesn't exist or has been removed."
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }
  
  const member = getMemberById(pkg.memberId);
  
  const handleMarkAsPickedUp = () => {
    Alert.alert(
      "Mark as Picked Up",
      "Confirm that this package has been picked up by the recipient?",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Confirm", 
          onPress: () => {
            markAsPickedUp(id);
            Alert.alert("Success", "Package marked as picked up!");
          }
        }
      ]
    );
  };
  
  const handleDelete = () => {
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
            removePackage(id);
            router.back();
          }
        }
      ]
    );
  };
  
  const handleMemberPress = () => {
    if (member) {
      router.push(`/member/${member.id}`);
    }
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
  
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: pkg.trackingNumber,
          headerRight: () => (
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.headerButton}
            >
              <Trash2 size={24} color={Colors.light.error} />
            </TouchableOpacity>
          )
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
            pkg.status === 'pending' ? styles.pendingBadge : styles.pickedUpBadge
          ]}>
            {pkg.status === 'pending' ? (
              <Clock size={20} color={Colors.light.error} />
            ) : (
              <CheckCircle size={20} color={Colors.light.success} />
            )}
            <Text style={[
              styles.statusText,
              pkg.status === 'pending' ? styles.pendingText : styles.pickedUpText
            ]}>
              {pkg.status === 'pending' ? 'Awaiting Pickup' : 'Picked Up'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.title}>{pkg.trackingNumber}</Text>
        <Text style={styles.description}>{pkg.description}</Text>
        
        <View style={styles.detailsContainer}>
          <TouchableOpacity 
            style={styles.detailItem}
            onPress={handleMemberPress}
          >
            <User size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Recipient</Text>
              <Text style={[styles.detailValue, styles.linkText]}>
                {pkg.recipientName}
                {member ? ` (${member.memberId})` : ''}
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.light.primary} />
          </TouchableOpacity>
          
          <View style={styles.detailItem}>
            <Calendar size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Arrival Date</Text>
              <Text style={styles.detailValue}>{formatDate(pkg.arrivalDate)}</Text>
            </View>
          </View>
          
          {pkg.pickupDate && (
            <View style={styles.detailItem}>
              <CheckCircle size={20} color={Colors.light.success} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Pickup Date</Text>
                <Text style={styles.detailValue}>{formatDate(pkg.pickupDate)}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <MapPin size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Storage Location</Text>
              <Text style={styles.detailValue}>{pkg.storageLocation}</Text>
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <Package2 size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Sender</Text>
              <Text style={styles.detailValue}>{pkg.sender}</Text>
            </View>
          </View>
        </View>
        
        {member && (
          <View style={styles.contactContainer}>
            <Text style={styles.contactTitle}>Contact Information</Text>
            
            <View style={styles.contactActions}>
              {member.phone && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={handleCall}
                >
                  <Phone size={20} color="#fff" />
                  <Text style={styles.contactButtonText}>Call</Text>
                </TouchableOpacity>
              )}
              
              {member.email && (
                <TouchableOpacity 
                  style={styles.contactButton}
                  onPress={handleEmail}
                >
                  <Mail size={20} color="#fff" />
                  <Text style={styles.contactButtonText}>Email</Text>
                </TouchableOpacity>
              )}
            </View>
            
            <View style={styles.contactDetails}>
              {member.phone && (
                <Text style={styles.contactDetail}>Phone: {member.phone}</Text>
              )}
              {member.email && (
                <Text style={styles.contactDetail}>Email: {member.email}</Text>
              )}
              {member.address && (
                <Text style={styles.contactDetail}>Address: {member.address}</Text>
              )}
            </View>
          </View>
        )}
        
        <View style={styles.photosContainer}>
          <Text style={styles.photosTitle}>Package Photos</Text>
          
          <View style={styles.photoGrid}>
            <View style={styles.photoItem}>
              <Text style={styles.photoLabel}>Package</Text>
              <Image source={{ uri: pkg.packagePhotoUri }} style={styles.photo} />
            </View>
            
            <View style={styles.photoItem}>
              <Text style={styles.photoLabel}>Label</Text>
              <Image source={{ uri: pkg.labelPhotoUri }} style={styles.photo} />
            </View>
            
            <View style={styles.photoItem}>
              <Text style={styles.photoLabel}>Storage</Text>
              <Image source={{ uri: pkg.storagePhotoUri }} style={styles.photo} />
            </View>
          </View>
        </View>
        
        {pkg.notes && (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <FileText size={20} color={Colors.light.primary} />
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{pkg.notes}</Text>
          </View>
        )}
        
        <View style={styles.metaContainer}>
          <Text style={styles.metaText}>Added by: {pkg.addedBy}</Text>
          <Text style={styles.metaText}>Added on: {formatDate(pkg.arrivalDate)}</Text>
        </View>
      </ScrollView>
      
      {pkg.status === 'pending' && (
        <View style={styles.footer}>
          <Button
            title="Mark as Picked Up"
            onPress={handleMarkAsPickedUp}
            style={styles.footerButton}
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
  headerButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  statusContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  pendingBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
  },
  pickedUpBadge: {
    backgroundColor: 'rgba(0, 184, 148, 0.1)',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pendingText: {
    color: Colors.light.error,
  },
  pickedUpText: {
    color: Colors.light.success,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: Colors.light.subtext,
    lineHeight: 24,
    marginBottom: 24,
    textAlign: 'center',
  },
  detailsContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  contactContainer: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  contactTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  contactActions: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginRight: 12,
  },
  contactButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  contactDetails: {
    gap: 4,
  },
  contactDetail: {
    fontSize: 14,
    color: Colors.light.text,
  },
  photosContainer: {
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
    backgroundColor: '#E1E1E1',
  },
  notesContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
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
  metaContainer: {
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    fontSize: 12,
    color: Colors.light.subtext,
    fontStyle: 'italic',
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
  footerButton: {
    width: '100%',
  },
});