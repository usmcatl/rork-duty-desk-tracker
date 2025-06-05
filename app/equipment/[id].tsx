import React from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  Image, 
  TouchableOpacity, 
  Alert 
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import { useMemberStore } from '@/store/memberStore';
import Button from '@/components/Button';
import CheckoutHistoryItem from '@/components/CheckoutHistoryItem';
import EmptyState from '@/components/EmptyState';
import { 
  Calendar, 
  Info, 
  Tag, 
  FileText, 
  CheckCircle, 
  AlertCircle,
  Trash2,
  DollarSign
} from 'lucide-react-native';

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { equipment, checkoutRecords, removeEquipment } = useEquipmentStore();
  
  const item = equipment.find(e => e.id === id);
  
  if (!item) {
    return (
      <EmptyState
        title="Equipment Not Found"
        description="The equipment you're looking for doesn't exist or has been removed."
        actionLabel="Go Back"
        onAction={() => router.back()}
      />
    );
  }
  
  // Get checkout records for this equipment
  const itemCheckoutRecords = checkoutRecords
    .filter(record => record.equipmentId === id)
    .sort((a, b) => new Date(b.checkoutDate).getTime() - new Date(a.checkoutDate).getTime());
  
  const handleCheckout = () => {
    router.push(`/checkout/${id}`);
  };
  
  const handleReturn = () => {
    router.push(`/return/${id}`);
  };
  
  const handleDelete = () => {
    Alert.alert(
      "Delete Equipment",
      "Are you sure you want to delete this equipment? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        { 
          text: "Delete", 
          style: "destructive",
          onPress: () => {
            removeEquipment(id);
            router.back();
          }
        }
      ]
    );
  };
  
  const formatDate = (date?: Date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: item.name,
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
        <Image 
          source={{ uri: item.imageUri }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge, 
            item.status === 'available' ? styles.availableBadge : styles.checkedOutBadge
          ]}>
            {item.status === 'available' ? (
              <CheckCircle size={16} color={Colors.light.success} />
            ) : (
              <AlertCircle size={16} color={Colors.light.error} />
            )}
            <Text style={[
              styles.statusText,
              item.status === 'available' ? styles.availableText : styles.checkedOutText
            ]}>
              {item.status === 'available' ? 'Available' : 'Checked Out'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <Tag size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Category</Text>
              <Text style={styles.detailValue}>{item.category}</Text>
            </View>
          </View>
          
          {item.serialNumber && (
            <View style={styles.detailItem}>
              <Info size={20} color={Colors.light.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Serial Number</Text>
                <Text style={styles.detailValue}>{item.serialNumber}</Text>
              </View>
            </View>
          )}
          
          <View style={styles.detailItem}>
            <Calendar size={20} color={Colors.light.primary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Added Date</Text>
              <Text style={styles.detailValue}>{formatDate(item.addedDate)}</Text>
            </View>
          </View>
          
          {item.depositAmount !== undefined && (
            <View style={styles.detailItem}>
              <DollarSign size={20} color={Colors.light.primary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Required Deposit</Text>
                <Text style={styles.detailValue}>${item.depositAmount.toFixed(2)}</Text>
              </View>
            </View>
          )}
        </View>
        
        {item.notes && (
          <View style={styles.notesContainer}>
            <View style={styles.notesHeader}>
              <FileText size={20} color={Colors.light.primary} />
              <Text style={styles.notesTitle}>Notes</Text>
            </View>
            <Text style={styles.notesText}>{item.notes}</Text>
          </View>
        )}
        
        <View style={styles.checkoutHistoryContainer}>
          <Text style={styles.sectionTitle}>Checkout History</Text>
          
          {itemCheckoutRecords.length > 0 ? (
            itemCheckoutRecords.map(record => (
              <CheckoutHistoryItem 
                key={record.id} 
                record={record} 
              />
            ))
          ) : (
            <Text style={styles.emptyHistoryText}>
              This equipment has not been checked out yet.
            </Text>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        {item.status === 'available' ? (
          <Button
            title="Check Out"
            onPress={handleCheckout}
            style={styles.footerButton}
          />
        ) : (
          <Button
            title="Return Equipment"
            onPress={handleReturn}
            style={styles.footerButton}
          />
        )}
      </View>
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
    paddingBottom: 100,
  },
  image: {
    width: '100%',
    height: 250,
    backgroundColor: '#E1E1E1',
  },
  statusContainer: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  availableBadge: {
    backgroundColor: 'rgba(0, 184, 148, 0.9)',
  },
  checkedOutBadge: {
    backgroundColor: 'rgba(255, 107, 107, 0.9)',
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  availableText: {
    color: '#fff',
  },
  checkedOutText: {
    color: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.light.subtext,
    lineHeight: 24,
    marginBottom: 24,
    paddingHorizontal: 16,
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
  checkoutHistoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: Colors.light.subtext,
    fontStyle: 'italic',
    textAlign: 'center',
    padding: 16,
    backgroundColor: Colors.light.card,
    borderRadius: 12,
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