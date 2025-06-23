import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView,
  Alert,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useMemberStore } from '@/store/memberStore';
import Button from '@/components/Button';
import { Upload, FileText, Download, Users, CheckCircle, AlertCircle } from 'lucide-react-native';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { parseMembersFromCSV, getMemberImportTemplate } from '@/utils/csvUtils';

// Import Sharing conditionally for platform compatibility
let Sharing: any = null;
if (Platform.OS !== 'web') {
  Sharing = require('expo-sharing');
}

export default function ImportMembersScreen() {
  const router = useRouter();
  const { importMembers, members } = useMemberStore();
  
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
  
  const handleDownloadTemplate = async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Not Available", "Template download is not available on web. Please use the mobile app.");
      return;
    }
    
    try {
      setIsDownloadingTemplate(true);
      
      const template = getMemberImportTemplate();
      const templateFilePath = `${FileSystem.cacheDirectory}member_import_template.csv`;
      
      await FileSystem.writeAsStringAsync(templateFilePath, template);
      
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        await Sharing.shareAsync(templateFilePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Member Import Template',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error('Template download error:', error);
      Alert.alert("Download Failed", "There was an error downloading the template");
    } finally {
      setIsDownloadingTemplate(false);
    }
  };
  
  const handleImportMembers = async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Not Available", "CSV import is not available on web. Please use the mobile app.");
      return;
    }
    
    try {
      setIsImporting(true);
      
      // Pick CSV file
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        setIsImporting(false);
        return;
      }
      
      // Read the file
      const csvContent = await FileSystem.readAsStringAsync(result.assets[0].uri);
      
      // Parse the CSV data
      const newMembers = parseMembersFromCSV(csvContent);
      
      if (newMembers.length === 0) {
        Alert.alert("Import Failed", "No valid member data found in the CSV file. Please check the format and try again.");
        setIsImporting(false);
        return;
      }
      
      // Check for duplicate member IDs
      const existingMemberIds = members.map(m => m.memberId.toLowerCase());
      const duplicates = newMembers.filter(m => 
        existingMemberIds.includes(m.memberId.toLowerCase())
      );
      
      if (duplicates.length > 0) {
        const duplicateIds = duplicates.map(m => m.memberId).join(', ');
        Alert.alert(
          "Duplicate Members Found",
          `The following member IDs already exist: ${duplicateIds}. Do you want to continue importing the other members?`,
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Import Others", 
              onPress: () => {
                const uniqueMembers = newMembers.filter(m => 
                  !existingMemberIds.includes(m.memberId.toLowerCase())
                );
                if (uniqueMembers.length > 0) {
                  importMembers(uniqueMembers);
                  Alert.alert(
                    "Import Successful", 
                    `Successfully imported ${uniqueMembers.length} members. ${duplicates.length} duplicates were skipped.`,
                    [{ text: "OK", onPress: () => router.back() }]
                  );
                } else {
                  Alert.alert("No New Members", "All members in the file already exist.");
                }
              }
            }
          ]
        );
      } else {
        // Import all members
        importMembers(newMembers);
        Alert.alert(
          "Import Successful", 
          `Successfully imported ${newMembers.length} members.`,
          [{ text: "OK", onPress: () => router.back() }]
        );
      }
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert("Import Failed", "There was an error importing the CSV file. Please check the file format and try again.");
    } finally {
      setIsImporting(false);
    }
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
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerSection}>
          <Users size={48} color={Colors.light.primary} />
          <Text style={styles.headerTitle}>Import Members from CSV</Text>
          <Text style={styles.headerDescription}>
            Add multiple members to the system by uploading a CSV file. This is the approved method for adding new members.
          </Text>
        </View>
        
        <View style={styles.instructionsSection}>
          <Text style={styles.sectionTitle}>How to Import Members</Text>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Download Template</Text>
              <Text style={styles.stepDescription}>
                Download the CSV template with the correct format and sample data.
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Fill in Member Data</Text>
              <Text style={styles.stepDescription}>
                Open the template in Excel or Google Sheets and add your member information.
              </Text>
            </View>
          </View>
          
          <View style={styles.step}>
            <View style={styles.stepNumber}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <View style={styles.stepContent}>
              <Text style={styles.stepTitle}>Upload CSV File</Text>
              <Text style={styles.stepDescription}>
                Save as CSV and upload the file using the import button below.
              </Text>
            </View>
          </View>
        </View>
        
        <View style={styles.formatSection}>
          <Text style={styles.sectionTitle}>Required CSV Format</Text>
          <View style={styles.formatCard}>
            <Text style={styles.formatTitle}>Required Columns:</Text>
            <Text style={styles.formatText}>• memberId (unique identifier)</Text>
            <Text style={styles.formatText}>• name (full name)</Text>
            <Text style={styles.formatText}>• email (email address)</Text>
            <Text style={styles.formatText}>• status (Active/Inactive)</Text>
            <Text style={styles.formatText}>• group (Legion/Auxiliary/Sons of the American Legion)</Text>
            
            <Text style={styles.formatTitle}>Optional Columns:</Text>
            <Text style={styles.formatText}>• phone (phone number)</Text>
            <Text style={styles.formatText}>• address (mailing address)</Text>
            <Text style={styles.formatText}>• branch (Army/Navy/Air Force/Marines/Coast Guard/Space Force)</Text>
            <Text style={styles.formatText}>• notes (additional information)</Text>
            <Text style={styles.formatText}>• joinDate (YYYY-MM-DD format)</Text>
          </View>
        </View>
        
        <View style={styles.actionsSection}>
          <Button
            title={isDownloadingTemplate ? "Downloading..." : "Download Template"}
            onPress={handleDownloadTemplate}
            disabled={isDownloadingTemplate || Platform.OS === 'web'}
            icon={<Download size={20} color="#fff" />}
            variant="outline"
            style={styles.actionButton}
          />
          
          <Button
            title={isImporting ? "Importing..." : "Import CSV File"}
            onPress={handleImportMembers}
            disabled={isImporting || Platform.OS === 'web'}
            icon={<Upload size={20} color="#fff" />}
            style={styles.actionButton}
          />
        </View>
        
        {Platform.OS === 'web' && (
          <View style={styles.webNotice}>
            <AlertCircle size={20} color={Colors.light.error} />
            <Text style={styles.webNoticeText}>
              CSV import is not available on web. Please use the mobile app to import members.
            </Text>
          </View>
        )}
        
        <View style={styles.tipsSection}>
          <Text style={styles.sectionTitle}>Import Tips</Text>
          <View style={styles.tipCard}>
            <CheckCircle size={16} color={Colors.light.primary} />
            <Text style={styles.tipText}>
              Member IDs must be unique. Duplicates will be skipped during import.
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <CheckCircle size={16} color={Colors.light.primary} />
            <Text style={styles.tipText}>
              Email addresses are required for all members.
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <CheckCircle size={16} color={Colors.light.primary} />
            <Text style={styles.tipText}>
              Dates should be in YYYY-MM-DD format (e.g., 2024-01-15).
            </Text>
          </View>
          
          <View style={styles.tipCard}>
            <CheckCircle size={16} color={Colors.light.primary} />
            <Text style={styles.tipText}>
              The system will validate all data before importing.
            </Text>
          </View>
        </View>
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
  headerSection: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.light.text,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  headerDescription: {
    fontSize: 16,
    color: Colors.light.subtext,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  instructionsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 4,
  },
  stepDescription: {
    fontSize: 14,
    color: Colors.light.subtext,
    lineHeight: 20,
  },
  formatSection: {
    marginBottom: 32,
  },
  formatCard: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formatTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 8,
    marginTop: 12,
  },
  formatText: {
    fontSize: 14,
    color: Colors.light.subtext,
    marginBottom: 4,
    marginLeft: 8,
  },
  actionsSection: {
    marginBottom: 32,
  },
  actionButton: {
    marginBottom: 12,
  },
  webNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 32,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.error,
  },
  webNoticeText: {
    fontSize: 14,
    color: Colors.light.error,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  tipsSection: {
    marginBottom: 24,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  tipText: {
    fontSize: 14,
    color: Colors.light.text,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
});