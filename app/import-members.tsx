import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  Alert,
  Platform,
  TouchableOpacity
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useMemberStore } from '@/store/memberStore';
import Button from '@/components/Button';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { parseMembersFromCSV, getMemberImportTemplate } from '@/utils/csvUtils';
import { FileText, Download, Upload, Info, CheckCircle } from 'lucide-react-native';

export default function ImportMembersScreen() {
  const router = useRouter();
  const { importMembers } = useMemberStore();
  
  const [csvContent, setCsvContent] = useState('');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  
  const handleDownloadTemplate = async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Not Available", "Template download is not available on web");
      return;
    }
    
    try {
      // Get template CSV content
      const templateContent = getMemberImportTemplate();
      
      // Create temporary file
      const templateFilePath = `${FileSystem.cacheDirectory}member_template.csv`;
      
      // Write data to file
      await FileSystem.writeAsStringAsync(templateFilePath, templateContent);
      
      // Check if sharing is available
      const isSharingAvailable = await Sharing.isAvailableAsync();
      
      if (isSharingAvailable) {
        // Share the file
        await Sharing.shareAsync(templateFilePath, {
          mimeType: 'text/csv',
          dialogTitle: 'Download Member Import Template',
          UTI: 'public.comma-separated-values-text'
        });
      } else {
        Alert.alert("Error", "Sharing is not available on this device");
      }
    } catch (error) {
      console.error('Template download error:', error);
      Alert.alert("Download Failed", "There was an error downloading the template");
    }
  };
  
  const handlePickCSV = async () => {
    if (Platform.OS === 'web') {
      Alert.alert("Not Available", "File picking is not available on web");
      return;
    }
    
    try {
      // Request document picker
      const result = await DocumentPicker.getDocumentAsync({
        type: "text/csv",
        copyToCacheDirectory: true
      });
      
      if (result.canceled) {
        return;
      }
      
      // Read the file
      const content = await FileSystem.readAsStringAsync(result.assets[0].uri);
      setCsvContent(content);
      
      // Parse and preview the data
      try {
        const members = parseMembersFromCSV(content);
        
        // Show preview of first 5 members
        setPreviewData(members.slice(0, 5).map(m => ({
          memberId: m.memberId,
          name: m.name,
          phone: m.phone || 'N/A',
          branch: m.branch || 'N/A',
          status: m.status,
          group: m.group
        })));
        
        Alert.alert(
          "CSV Loaded",
          `Successfully loaded ${members.length} members from CSV. Review the preview and click Import to continue.`
        );
      } catch (parseError) {
        console.error('CSV parsing error:', parseError);
        Alert.alert("Invalid CSV", "The selected file could not be parsed. Please ensure it follows the template format.");
        setCsvContent('');
        setPreviewData([]);
      }
    } catch (error) {
      console.error('File picking error:', error);
      Alert.alert("Error", "There was an error selecting the file");
    }
  };
  
  const handleImport = () => {
    if (!csvContent) {
      Alert.alert("No Data", "Please select a CSV file first");
      return;
    }
    
    try {
      setIsImporting(true);
      
      // Parse the CSV data
      const members = parseMembersFromCSV(csvContent);
      
      if (members.length === 0) {
        Alert.alert("No Members", "No valid member data was found in the CSV");
        setIsImporting(false);
        return;
      }
      
      // Import the members
      importMembers(members);
      
      Alert.alert(
        "Import Successful", 
        `Successfully imported ${members.length} members`,
        [
          { 
            text: "OK", 
            onPress: () => router.back() 
          }
        ]
      );
    } catch (error) {
      console.error('Import error:', error);
      Alert.alert("Import Failed", "There was an error importing the members");
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
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Info size={20} color={Colors.light.primary} />
            <Text style={styles.infoTitle}>Import Instructions</Text>
          </View>
          <Text style={styles.infoText}>
            1. Download the CSV template{'\n'}
            2. Fill in your member data following the template format{'\n'}
            3. Upload your completed CSV file{'\n'}
            4. Review the preview and click Import{'\n\n'}
            Required fields: memberId, name, status, group{'\n'}
            Optional fields: phone, email, address, notes, joinDate, branch
          </Text>
        </View>
        
        <View style={styles.actionsContainer}>
          <Button
            title="Download Template"
            onPress={handleDownloadTemplate}
            variant="outline"
            icon={<Download size={16} color={Colors.light.primary} />}
            style={styles.actionButton}
            disabled={Platform.OS === 'web'}
          />
          
          <Button
            title="Select CSV File"
            onPress={handlePickCSV}
            variant="outline"
            icon={<Upload size={16} color={Colors.light.primary} />}
            style={styles.actionButton}
            disabled={Platform.OS === 'web'}
          />
        </View>
        
        {Platform.OS === 'web' && (
          <Text style={styles.webNotice}>
            CSV import functionality is not available on web. Please use the mobile app.
          </Text>
        )}
        
        {previewData.length > 0 && (
          <View style={styles.previewContainer}>
            <Text style={styles.previewTitle}>Preview</Text>
            
            <View style={styles.previewHeader}>
              <Text style={[styles.previewHeaderText, styles.previewIdColumn]}>ID</Text>
              <Text style={[styles.previewHeaderText, styles.previewNameColumn]}>Name</Text>
              <Text style={[styles.previewHeaderText, styles.previewBranchColumn]}>Branch</Text>
              <Text style={[styles.previewHeaderText, styles.previewStatusColumn]}>Status</Text>
            </View>
            
            {previewData.map((item, index) => (
              <View key={index} style={styles.previewRow}>
                <Text style={[styles.previewText, styles.previewIdColumn]}>{item.memberId}</Text>
                <Text style={[styles.previewText, styles.previewNameColumn]}>{item.name}</Text>
                <Text style={[styles.previewText, styles.previewBranchColumn]}>{item.branch}</Text>
                <Text style={[styles.previewText, styles.previewStatusColumn]}>{item.status}</Text>
              </View>
            ))}
            
            <Text style={styles.previewNote}>
              {previewData.length} of {csvContent ? parseMembersFromCSV(csvContent).length : 0} members shown
            </Text>
          </View>
        )}
        
        <Button
          title={isImporting ? "Importing..." : "Import Members"}
          onPress={handleImport}
          disabled={!csvContent || isImporting || Platform.OS === 'web'}
          icon={<CheckCircle size={20} color="#fff" />}
          style={styles.importButton}
        />
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  infoCard: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.primary,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: Colors.light.text,
    lineHeight: 22,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
  },
  webNotice: {
    fontSize: 14,
    color: Colors.light.error,
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 24,
  },
  previewContainer: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.light.text,
    marginBottom: 16,
  },
  previewHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    paddingBottom: 8,
    marginBottom: 8,
  },
  previewHeaderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  previewRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  previewText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  previewIdColumn: {
    flex: 1,
  },
  previewNameColumn: {
    flex: 2,
  },
  previewBranchColumn: {
    flex: 1,
  },
  previewStatusColumn: {
    flex: 1,
  },
  previewNote: {
    fontSize: 12,
    color: Colors.light.subtext,
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'right',
  },
  importButton: {
    marginTop: 12,
    marginBottom: 24,
  },
});