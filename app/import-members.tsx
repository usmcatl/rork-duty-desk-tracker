import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  Alert,
  Modal
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import Button from '@/components/Button';
import { AlertTriangle } from 'lucide-react-native';

export default function ImportMembersScreen() {
  const router = useRouter();
  const [showAdvisoryDialog, setShowAdvisoryDialog] = useState(true);
  
  const handleGoBack = () => {
    router.back();
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Import Members",
          headerStyle: {
            backgroundColor: Colors.light.background,
          },
          headerTintColor: Colors.light.primary,
        }} 
      />
      
      {/* Advisory Dialog */}
      <Modal
        visible={showAdvisoryDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={handleGoBack}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <AlertTriangle size={24} color={Colors.light.flagRed} />
              <Text style={styles.modalTitle}>Feature Pending Department Advisory</Text>
            </View>
            
            <Text style={styles.modalMessage}>
              Member management features are currently pending department advisory approval. This feature is temporarily unavailable.
            </Text>
            
            <View style={styles.modalButtons}>
              <Button
                title="Go Back"
                onPress={handleGoBack}
                style={styles.modalButton}
              />
            </View>
          </View>
        </View>
      </Modal>
      
      <View style={styles.content}>
        <View style={styles.messageContainer}>
          <AlertTriangle size={48} color={Colors.light.flagRed} />
          <Text style={styles.messageTitle}>Feature Unavailable</Text>
          <Text style={styles.messageText}>
            Member management features are currently pending department advisory approval.
          </Text>
          
          <Button
            title="Return to Previous Screen"
            onPress={handleGoBack}
            style={styles.backButton}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  messageContainer: {
    alignItems: 'center',
    maxWidth: 300,
  },
  messageTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 12,
    textAlign: 'center',
  },
  messageText: {
    fontSize: 16,
    color: Colors.light.subtext,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  backButton: {
    width: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContainer: {
    backgroundColor: Colors.light.background,
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginLeft: 12,
  },
  modalMessage: {
    fontSize: 16,
    color: Colors.light.text,
    lineHeight: 24,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  modalButton: {
    minWidth: 100,
  },
});