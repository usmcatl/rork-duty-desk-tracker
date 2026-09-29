import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { Package } from '@/types/package';
import { useMemberStore } from '@/store/memberStore';
import { Package2, Clock, CheckCircle, User, Calendar } from 'lucide-react-native';

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
  
  const handleMemberPress = (e: any) => {
    e.stopPropagation();
    if (member) {
      router.push(`/member/${member.id}`);
    }
  };
  
  return (
    <TouchableOpacity style={styles.container} onPress={handlePress}>
      <View style={styles.header}>
        <View style={styles.iconContainer}>
          <Package2 size={24} color={Colors.light.primary} />
        </View>
        
        <View style={styles.headerContent}>
          <Text style={styles.recipientName}>{pkg.recipientName}</Text>
          <TouchableOpacity onPress={handleMemberPress}>
            <Text style={[styles.memberInfo, styles.linkText]}>
              {member ? formatMemberDisplay(member) : 'Unknown Member'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <View style={[
          styles.statusBadge,
          pkg.status === 'pending' ? styles.pendingBadge : styles.pickedUpBadge
        ]}>
          {pkg.status === 'pending' ? (
            <Clock size={16} color={Colors.light.flagRed} />
          ) : (
            <CheckCircle size={16} color={Colors.light.success} />
          )}
        </View>
      </View>
      
      <View style={styles.content}>
        <Text style={styles.description} numberOfLines={2}>
          {pkg.description}
        </Text>
        
        <View style={styles.details}>
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>From:</Text>
            <Text style={styles.detailValue}>{pkg.sender}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Location:</Text>
            <Text style={styles.detailValue}>{pkg.storageLocation}</Text>
          </View>
          
          <View style={styles.detailItem}>
            <Calendar size={14} color={Colors.light.subtext} />
            <Text style={styles.dateText}>{formatDate(pkg.arrivalDate)}</Text>
          </View>
        </View>
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
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  recipientName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  memberInfo: {
    fontSize: 14,
    color: Colors.light.subtext,
  },
  linkText: {
    color: Colors.light.primary,
    textDecorationLine: 'underline',
  },
  statusBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pendingBadge: {
    backgroundColor: 'rgba(220, 20, 60, 0.1)',
  },
  pickedUpBadge: {
    backgroundColor: 'rgba(40, 167, 69, 0.1)',
  },
  content: {
    gap: 8,
  },
  description: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 22,
  },
  details: {
    gap: 4,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginRight: 4,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    color: Colors.light.text,
    flex: 1,
  },
  dateText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginLeft: 4,
  },
});