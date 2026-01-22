import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, FontWeight, Layout, Spacing } from '../../constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputContainerStyle?: ViewStyle;
  disabled?: boolean;
  required?: boolean;
  variant?: 'default' | 'filled';
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputContainerStyle,
  disabled = false,
  required = false,
  secureTextEntry,
  variant = 'filled',
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry !== undefined;
  const showPassword = isPassword && isPasswordVisible;

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle = variant === 'filled' ? styles.inputContainerFilled : styles.inputContainer;

    if (disabled) {
      return { ...baseStyle, ...styles.disabled };
    }
    if (error) {
      return { ...baseStyle, ...styles.error };
    }
    if (isFocused) {
      return { ...baseStyle, ...styles.focused };
    }
    return baseStyle;
  };

  const getIconColor = (): string => {
    if (error) return Colors.error;
    if (isFocused) return Colors.black;
    return Colors.gray400;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={styles.label}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}

      <View style={[getInputContainerStyle(), inputContainerStyle]}>
        {leftIcon && (
          <View style={styles.leftIconContainer}>
            <Ionicons
              name={leftIcon}
              size={20}
              color={getIconColor()}
            />
          </View>
        )}

        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
            disabled && styles.inputDisabled,
          ]}
          placeholderTextColor={Colors.gray400}
          editable={!disabled}
          secureTextEntry={isPassword && !showPassword}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {isPassword ? (
          <TouchableOpacity
            onPress={() => setIsPasswordVisible(!isPasswordVisible)}
            style={styles.rightIconContainer}
            activeOpacity={0.6}
          >
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={Colors.gray400}
            />
          </TouchableOpacity>
        ) : rightIcon ? (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconContainer}
            disabled={!onRightIconPress}
            activeOpacity={0.6}
          >
            <Ionicons
              name={rightIcon}
              size={20}
              color={error ? Colors.error : Colors.gray400}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
      {hint && !error && <Text style={styles.hintText}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    color: Colors.black,
    marginBottom: Spacing.sm,
  },
  required: {
    color: Colors.error,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
  },
  inputContainerFilled: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray100,
  },
  focused: {
    borderColor: Colors.black,
    backgroundColor: Colors.white,
  },
  error: {
    borderColor: Colors.error,
  },
  disabled: {
    backgroundColor: Colors.gray100,
    borderColor: Colors.gray200,
  },
  leftIconContainer: {
    paddingLeft: Spacing.lg,
    paddingRight: Spacing.sm,
  },
  rightIconContainer: {
    paddingHorizontal: Spacing.md,
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    color: Colors.black,
    paddingVertical: 0,
    paddingHorizontal: Spacing.lg,
  },
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  inputDisabled: {
    color: Colors.gray400,
  },
  errorText: {
    fontSize: FontSize.xs,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.xs,
  },
  hintText: {
    fontSize: FontSize.xs,
    color: Colors.gray500,
    marginTop: Spacing.xs,
  },
});

export default Input;
