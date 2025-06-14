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
  DollarSign,
  Edit,
  AlertTriangle,
  Clock
} from 'lucide-react-native';

export default function EquipmentDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { equipment, checkoutRecords, removeEquipment } = useEquipmentStore();
  const { getMemberById } = useMemberStore();
  
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
  
  // Get current checkout record if equipment is checked out
  const currentCheckout = itemCheckoutRecords.find(record => !record.returnDate);
  const currentMember = currentCheckout ? getMemberById(currentCheckout.memberId) : null;
  
  // Check if equipment is overdue
  const isOverdue = currentCheckout && new Date() > new Date(currentCheckout.expectedReturnDate);
  const daysOverdue = currentCheckout && isOverdue 
    ? Math.ceil((new Date().getTime() - new Date(currentCheckout.expectedReturnDate).getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  
  const handleCheckout = () => {
    router.push(`/checkout/${id}`);
  };
  
  const handleReturn = () => {
    router.push(`/return/${id}`);
  };
  
  const handleEdit = () => {
    router.push(`/edit-equipment/${id}`);
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
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };
  
  const formatMemberDisplay = (member: any) => {
    if (!member) return 'Unknown Member';
    
    let display = member.name;
    if (member.aliases && member.aliases.length > 0) {
      display += ` "${member.aliases.join('", "')}"`;
    }
    return display;
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: item.name,
          headerRight: () => (
            <View style={styles.headerButtons}>
              <TouchableOpacity
                onPress={handleEdit}
                style={styles.headerButton}
              >
                <Edit size={24} color={Colors.light.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={handleDelete}
                style={styles.headerButton}
              >
                <Trash2 size={24} color={Colors.light.error} />
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
        <Image 
          source={{ uri: item.imageUri }} 
          style={styles.image}
          resizeMode="cover"
        />
        
        <View style={styles.statusContainer}>
          <View style={[
            styles.statusBadge, 
            item.status === 'available' ? styles.availableBadge : 
            isOverdue ? styles.overdueBadge : styles.checkedOutBadge
          ]}>
            {item.status === 'available' ? (
              <CheckCircle size={16} color={Colors.light.success} />
            ) : isOverdue ? (
              <AlertTriangle size={16} color="#fff" />
            ) : (
              <AlertCircle size={16} color={Colors.light.error} />
            )}
            <Text style={[
              styles.statusText,
              item.status === 'available' ? styles.availableText : styles.checkedOutText
            ]}>
              {item.status === 'available' ? 'Available' : 
               isOverdue ? `Overdue ${daysOverdue} days` : 'Checked Out'}
            </Text>
          </View>
        </View>
        
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.description}>{item.description}</Text>
        
        {/* Current Checkout Info */}
        {currentCheckout && (
          <View style={[
            styles.checkoutInfoContainer,
            isOverdue && styles.overdueCheckoutInfo
          ]}>
            <View style={styles.checkoutInfoHeader}>
              <Clock size={20} color={isOverdue ? Colors.light.error : Colors.light.primary} />
              <Text style={[
                styles.checkoutInfoTitle,
                isOverdue && styles.overdueText
              ]}>
                Current Checkout
              </Text>
              {isOverdue && (
                <AlertTriangle size={20} color={Colors.light.error} style={styles.overdueIcon} />
              )}
            </View>
            
            <View style={styles.checkoutInfoContent}>
              <View style={styles.checkoutInfoRow}>
                <Text style={styles.checkoutInfoLabel}>Checked out to:</Text>
                <Text style={[
                  styles.checkoutInfoValue,
                  isOverdue && styles.overdueText
                ]}>
                  {formatMemberDisplay(currentMember)}
                </Text>
              </View>
              
              <View style={styles.checkoutInfoRow}>
                <Text style={styles.checkoutInfoLabel}>Checkout date:</Text>
                <Text style={styles.checkoutInfoValue}>
                  {formatDate(currentCheckout.checkoutDate)}
                </Text>
              </View>
              
              <View style={styles.checkoutInfoRow}>
                <Text style={styles.checkoutInfoLabel}>Expected return:</Text>
                <Text style={[
                  styles.checkoutInfoValue,
                  isOverdue && styles.overdueText
                ]}>
                  {formatDate(currentCheckout.expectedReturnDate)}
                </Text>
              </View>
              
              {isOverdue && (
                <View style={styles.overdueWarning}>
                  <AlertTriangle size={16} color={Colors.light.error} />
                  <Text style={styles.overdueWarningText}>
                    This equipment is {daysOverdue} day{daysOverdue !== 1 ? 's' : ''} overdue for return
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}
        
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
                equipment={item}
                showMemberName={true}
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
            title={isOverdue ? "Return Overdue Equipment" : "Return Equipment"}
            onPress={handleReturn}
            style={[styles.footerButton, isOverdue && styles.overdueButton]}
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
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
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
  overdueBadge: {
    backgroundColor: 'rgba(220, 20, 60, 0.95)',
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
  checkoutInfoContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  overdueCheckoutInfo: {
    borderLeftColor: Colors.light.error,
    backgroundColor: 'rgba(220, 20, 60, 0.05)',
  },
  checkoutInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkoutInfoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
  },
  overdueIcon: {
    marginLeft: 8,
  },
  checkoutInfoContent: {
    gap: 8,
  },
  checkoutInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  checkoutInfoLabel: {
    fontSize: 14,
    color: Colors.light.subtext,
    fontWeight: '500',
  },
  checkoutInfoValue: {
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
    textAlign: 'right',
    flex: 1,
    marginLeft: 12,
  },
  overdueText: {
    color: Colors.light.error,
  },
  overdueWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  overdueWarningText: {
    fontSize: 14,
    color: Colors.light.error,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
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
  overdueButton: {
    backgroundColor: Colors.light.error,
  },
});