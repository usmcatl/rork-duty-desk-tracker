import React from 'react';
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  StyleProp
} from 'react-native';
import Colors from '@/constants/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  icon?: React.ReactNode;
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  style,
  textStyle,
  icon
}: ButtonProps) {
  const getContainerStyle = () => {
    const baseStyle: ViewStyle[] = [styles.container];
    
    // Add size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallContainer);
        break;
      case 'large':
        baseStyle.push(styles.largeContainer);
        break;
    }
    
    // Add variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryContainer);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryContainer);
        break;
      case 'outline':
        baseStyle.push(styles.outlineContainer);
        break;
      case 'danger':
        baseStyle.push(styles.dangerContainer);
        break;
    }
    
    // Add disabled style
    if (disabled) {
      baseStyle.push(styles.disabledContainer);
    }
    
    return baseStyle;
  };
  
  const getTextStyle = () => {
    const baseStyle: TextStyle[] = [styles.text];
    
    // Add size styles
    switch (size) {
      case 'small':
        baseStyle.push(styles.smallText);
        break;
      case 'large':
        baseStyle.push(styles.largeText);
        break;
    }
    
    // Add variant styles
    switch (variant) {
      case 'primary':
        baseStyle.push(styles.primaryText);
        break;
      case 'secondary':
        baseStyle.push(styles.secondaryText);
        break;
      case 'outline':
        baseStyle.push(styles.outlineText);
        break;
      case 'danger':
        baseStyle.push(styles.dangerText);
        break;
    }
    
    // Add disabled style
    if (disabled) {
      baseStyle.push(styles.disabledText);
    }
    
    return baseStyle;
  };
  
  return (
    <TouchableOpacity
      style={[getContainerStyle(), style]}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator 
          color={variant === 'outline' ? Colors.light.primary : '#fff'} 
          size="small" 
        />
      ) : (
        <>
          {icon}
          <Text style={[getTextStyle(), icon && styles.textWithIcon, textStyle]}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  smallContainer: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  largeContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  primaryContainer: {
    backgroundColor: Colors.light.primary,
  },
  secondaryContainer: {
    backgroundColor: Colors.light.secondary,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  dangerContainer: {
    backgroundColor: Colors.light.error,
  },
  disabledContainer: {
    backgroundColor: Colors.light.border,
    borderColor: Colors.light.border,
  },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
  smallText: {
    fontSize: 14,
  },
  largeText: {
    fontSize: 18,
  },
  primaryText: {
    color: '#fff',
  },
  secondaryText: {
    color: Colors.light.primary,
  },
  outlineText: {
    color: Colors.light.primary,
  },
  dangerText: {
    color: '#fff',
  },
  disabledText: {
    color: Colors.light.subtext,
  },
  textWithIcon: {
    marginLeft: 8,
  },
});