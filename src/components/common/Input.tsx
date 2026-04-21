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
import { BorderRadius, FontSize, FontWeight, Layout, Spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';

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
  const { colors } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);

  const isPassword = secureTextEntry !== undefined;
  const showPassword = isPassword && isPasswordVisible;

  const getInputContainerStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = variant === 'filled'
      ? {
          ...styles.inputContainerBase,
          borderColor: colors.gray100,
          backgroundColor: colors.gray50,
        }
      : {
          ...styles.inputContainerBase,
          borderColor: colors.gray200,
          backgroundColor: colors.background,
        };

    if (disabled) {
      return { ...baseStyle, backgroundColor: colors.gray100, borderColor: colors.gray200 };
    }
    if (error) {
      return { ...baseStyle, borderColor: colors.error };
    }
    if (isFocused) {
      return { ...baseStyle, borderColor: colors.primary, backgroundColor: colors.background };
    }
    return baseStyle;
  };

  const getIconColor = (): string => {
    if (error) return colors.error;
    if (isFocused) return colors.primary;
    return colors.gray400;
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.textPrimary }]}>
          {label}
          {required && <Text style={{ color: colors.error }}> *</Text>}
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
            { color: colors.textPrimary },
            leftIcon && styles.inputWithLeftIcon,
            (rightIcon || isPassword) && styles.inputWithRightIcon,
            disabled && { color: colors.gray400 },
          ]}
          placeholderTextColor={colors.gray400}
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
              color={colors.gray400}
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
              color={error ? colors.error : colors.gray400}
            />
          </TouchableOpacity>
        ) : null}
      </View>

      {error && (
        <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
      )}
      {hint && !error && <Text style={[styles.hintText, { color: colors.textSecondary }]}>{hint}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.semiBold,
    marginBottom: Spacing.sm,
  },
  inputContainerBase: {
    flexDirection: 'row',
    alignItems: 'center',
    height: Layout.inputHeight,
    borderWidth: 1.5,
    borderRadius: BorderRadius.full,
  },
  leftIconContainer: {
    paddingLeft: Spacing.xl,
    paddingRight: Spacing.sm,
  },
  rightIconContainer: {
    paddingHorizontal: Spacing.lg,
    height: '100%',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    fontSize: FontSize.md,
    paddingVertical: 0,
    paddingHorizontal: Spacing.xl,
    outlineStyle: 'none',
  } as any,
  inputWithLeftIcon: {
    paddingLeft: 0,
  },
  inputWithRightIcon: {
    paddingRight: 0,
  },
  errorText: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
    marginLeft: Spacing.lg,
  },
  hintText: {
    fontSize: FontSize.xs,
    marginTop: Spacing.xs,
  },
});

export default Input;
