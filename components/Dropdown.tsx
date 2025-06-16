import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  ScrollView,
  Modal,
  Pressable
} from 'react-native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import Colors from '@/constants/colors';

interface DropdownProps {
  options: string[];
  value: string | undefined;
  onSelect: (value: string) => void;
  placeholder: string;
  allowEmpty?: boolean;
  emptyLabel?: string;
  label?: string;
}

export default function Dropdown({ 
  options, 
  value, 
  onSelect, 
  placeholder, 
  allowEmpty = false,
  emptyLabel = "None",
  label
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (selectedValue: string) => {
    onSelect(selectedValue);
    setIsOpen(false);
  };

  const displayValue = value || placeholder;
  const isPlaceholder = !value;

  return (
    <View style={styles.container}>
      {label && (
        <Text style={styles.label}>{label}</Text>
      )}
      <TouchableOpacity 
        style={styles.selector}
        onPress={() => setIsOpen(true)}
      >
        <Text style={[styles.selectorText, isPlaceholder && styles.placeholderText]}>
          {displayValue}
        </Text>
        <ChevronDown size={20} color={Colors.light.subtext} />
      </TouchableOpacity>

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setIsOpen(false)}
        >
          <View style={styles.modalContent}>
            <ScrollView style={styles.optionsList} showsVerticalScrollIndicator={false}>
              {allowEmpty && (
                <TouchableOpacity
                  style={[styles.option, value === undefined && styles.selectedOption]}
                  onPress={() => handleSelect('')}
                >
                  <Text style={[styles.optionText, value === undefined && styles.selectedOptionText]}>
                    {emptyLabel}
                  </Text>
                </TouchableOpacity>
              )}
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.option, value === option && styles.selectedOption]}
                  onPress={() => handleSelect(option)}
                >
                  <Text style={[styles.optionText, value === option && styles.selectedOptionText]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
    marginBottom: 8,
  },
  selector: {
    backgroundColor: Colors.light.card,
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectorText: {
    fontSize: 16,
    color: Colors.light.text,
  },
  placeholderText: {
    color: Colors.light.subtext,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.light.card,
    borderRadius: 12,
    maxHeight: 300,
    width: '80%',
    maxWidth: 300,
  },
  optionsList: {
    maxHeight: 250,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  selectedOption: {
    backgroundColor: Colors.light.secondary,
  },
  optionText: {
    fontSize: 16,
    color: Colors.light.text,
    textAlign: 'center',
  },
  selectedOptionText: {
    color: Colors.light.primary,
    fontWeight: '500',
  },
});