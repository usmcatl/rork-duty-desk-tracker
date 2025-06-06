import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Package } from '@/types/package';
import { useMemberStore } from '@/store/memberStore';
import { Package2, User, Calendar, MapPin, CheckCircle, Clock } from 'lucide-react-native';

interface PackageCardProps {
  package: Package;
}

export default function PackageCard({ package: pkg }: PackageCardProps) {
  const router = useRouter();
  const { getMemberById } = useMemberStore();
  
  const member = getMemberById(pkg.memberId);
  
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
  
  const handlePress = () => {
    router.push(`/package/${pkg.id}`);
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Package2 size={24} color={Colors.light.primary} />
        </View>
        
        <View style={styles.headerContent}>
          <Text style={styles.recipientName}>{pkg.recipientName}</Text>
          <Text style={styles.description} numberOfLines={1}>
            {pkg.description}
          </Text>
        </View>
        
        <View style={[
          styles.statusBadge,
          pkg.status === 'pending' ? styles.pendingBadge : styles.pickedUpBadge
        ]}>
          {pkg.status === 'pending' ? (
            <Clock size={14} color={Colors.light.flagRed} />
          ) : (
            <CheckCircle size={14} color={Colors.light.success} />
          )}
          <Text style={[
            styles.statusText,
            pkg.status === 'pending' ? styles.pendingText : styles.pickedUpText
          ]}>
            {pkg.status === 'pending' ? 'Pending' : 'Picked Up'}
          </Text>
        </View>
      </View>
      
      <View style={styles.details}>
        <View style={styles.detailItem}>
          <User size={16} color={Colors.light.primary} />
          <Text style={styles.detailText}>
            {member ? formatMemberDisplay(member) : pkg.recipientName} {member ? `(${member.memberId})` : ''}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <Calendar size={16} color={Colors.light.primary} />
          <Text style={styles.detailText}>
            Arrived: {formatDate(pkg.arrivalDate)}
            {pkg.pickupDate && ` • Picked up: ${formatDate(pkg.pickupDate)}`}
          </Text>
        </View>
        
        <View style={styles.detailItem}>
          <MapPin size={16} color={Colors.light.primary} />
          <Text style={styles.detailText}>
            {pkg.storageLocation}
          </Text>
        </View>
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.senderText}>From: {pkg.sender}</Text>
        <Text style={styles.addedByText}>Added by: {pkg.addedBy}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.light.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.light.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  recipientName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 2,
  },
  description: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  pendingBadge: {
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
  },
  pickedUpBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
  pendingText: {
    color: Colors.light.flagRed,
  },
  pickedUpText: {
    color: Colors.light.success,
  },
  details: {
    marginBottom: 12,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 8,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  senderText: {
    fontSize: 12,
    color: Colors.light.subtext,
  },
  addedByText: {
    fontSize: 12,
    color: Colors.light.subtext,
    fontStyle: 'italic',
  },
});