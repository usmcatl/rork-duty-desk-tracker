import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  ScrollView, 
  TextInput, 
  TouchableOpacity, 
  Image,
  Alert,
  Platform
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import Colors from '@/constants/colors';
import { useEquipmentStore } from '@/store/equipmentStore';
import Button from '@/components/Button';
import * as ImagePicker from 'expo-image-picker';
import { Camera, Tag, FileText, Calendar, Info, DollarSign } from 'lucide-react-native';

// Predefined categories for equipment
const CATEGORIES = [
  'Diagnostic',
  'Monitoring',
  'Therapeutic',
  'Imaging',
  'Laboratory',
  'Surgical',
  'Emergency',
  'Other'
];

export default function AddEquipmentScreen() {
  const router = useRouter();
  const { addEquipment } = useEquipmentStore();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [serialNumber, setSerialNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  
  const handleTakePhoto = async () => {
    try {
      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera permission is required to take photos');
        return;
      }
      
      // Launch camera
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };
  
  const handlePickImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Media library permission is required to select photos');
        return;
      }
      
      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  const handleAddEquipment = () => {
    // Validate inputs
    if (!name.trim()) {
      Alert.alert('Error', 'Equipment name is required');
      return;
    }
    
    if (!description.trim()) {
      Alert.alert('Error', 'Description is required');
      return;
    }
    
    if (!imageUri) {
      Alert.alert('Error', 'Please add an image of the equipment');
      return;
    }
    
    // Parse deposit amount - now required
    if (!depositAmount.trim()) {
      Alert.alert('Error', 'Deposit amount is required');
      return;
    }
    
    const parsedDepositAmount = parseFloat(depositAmount);
    if (isNaN(parsedDepositAmount) || parsedDepositAmount < 0) {
      Alert.alert('Error', 'Deposit amount must be a valid positive number');
      return;
    }
    
    // For demo purposes, we'll use a placeholder image if running on web
    // since we can't access the camera/gallery URI directly
    const finalImageUri = Platform.OS === 'web' 
      ? 'https://images.unsplash.com/photo-1516549655169-df83a0774514?q=80&w=500'
      : imageUri;
    
    // Add equipment
    addEquipment({
      name: name.trim(),
      description: description.trim(),
      imageUri: finalImageUri,
      category,
      serialNumber: serialNumber.trim(),
      notes: notes.trim(),
      depositAmount: parsedDepositAmount,
    });
    
    // Navigate back
    router.back();
  };
  
  return (
    <View style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: "Add New Equipment",
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
        <View style={styles.imageSection}>
          {imageUri ? (
            <Image 
              source={{ uri: imageUri }} 
              style={styles.previewImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Camera size={48} color={Colors.light.subtext} />
              <Text style={styles.imagePlaceholderText}>
                Add Equipment Photo
              </Text>
            </View>
          )}
          
          <View style={styles.imageButtons}>
            <Button
              title="Take Photo"
              onPress={handleTakePhoto}
              variant="outline"
              size="small"
              style={styles.imageButton}
            />
            <Button
              title="Choose Photo"
              onPress={handlePickImage}
              variant="outline"
              size="small"
              style={styles.imageButton}
            />
          </View>
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Equipment Name*</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter equipment name"
            placeholderTextColor={Colors.light.subtext}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <Text style={styles.inputLabel}>Description*</Text>
          <TextInput
            style={styles.descriptionInput}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter equipment description"
            placeholderTextColor={Colors.light.subtext}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Tag size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Category</Text>
          </View>
          
          <ScrollView 
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoriesContainer}
            contentContainerStyle={styles.categoriesContent}
          >
            {CATEGORIES.map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.categoryChip,
                  category === cat && styles.selectedCategoryChip
                ]}
                onPress={() => setCategory(cat)}
              >
                <Text style={[
                  styles.categoryText,
                  category === cat && styles.selectedCategoryText
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <DollarSign size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Deposit Amount*</Text>
          </View>
          <TextInput
            style={styles.input}
            value={depositAmount}
            onChangeText={setDepositAmount}
            placeholder="Enter required deposit amount"
            placeholderTextColor={Colors.light.subtext}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <Info size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Serial Number (Optional)</Text>
          </View>
          <TextInput
            style={styles.input}
            value={serialNumber}
            onChangeText={setSerialNumber}
            placeholder="Enter serial number if available"
            placeholderTextColor={Colors.light.subtext}
          />
        </View>
        
        <View style={styles.inputContainer}>
          <View style={styles.inputHeader}>
            <FileText size={20} color={Colors.light.primary} />
            <Text style={styles.inputHeaderLabel}>Notes (Optional)</Text>
          </View>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={setNotes}
            placeholder="Add any additional notes about this equipment"
            placeholderTextColor={Colors.light.subtext}
            multiline
            textAlignVertical="top"
          />
        </View>
        
        <Button
          title="Add Equipment"
          onPress={handleAddEquipment}
          style={styles.addButton}
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
  imageSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  previewImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: Colors.light.card,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: Colors.light.subtext,
    marginTop: 8,
  },
  imageButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  imageButton: {
    marginHorizontal: 8,
    minWidth: 120,
  },
  inputContainer: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  inputHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  inputHeaderLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginLeft: 8,
  },
  input: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  descriptionInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 80,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  notesInput: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: Colors.light.text,
    minHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoriesContainer: {
    maxHeight: 50,
  },
  categoriesContent: {
    paddingVertical: 8,
  },
  categoryChip: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: Colors.light.card,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  selectedCategoryChip: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
  },
  categoryText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  selectedCategoryText: {
    color: '#fff',
    fontWeight: '500',
  },
  addButton: {
    marginTop: 12,
    marginBottom: 24,
  },
});