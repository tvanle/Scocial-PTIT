import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Spacing, FontSize, FontWeight } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';

interface IconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  size?: number;
  iconSize?: number;
  color?: string;
  backgroundColor?: string;
  style?: ViewStyle;
  disabled?: boolean;
  badge?: number;
  variant?: 'default' | 'primary' | 'ghost';
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  onPress,
  size = 40,
  iconSize = 24,
  color,
  backgroundColor,
  style,
  disabled = false,
  badge,
  variant = 'default',
}) => {
  const { colors } = useTheme();

  const getStyles = (): { bg: string; iconColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          bg: backgroundColor || colors.textPrimary,
          iconColor: color || colors.white,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          iconColor: color || colors.textPrimary,
        };
      default:
        return {
          bg: backgroundColor || colors.gray100,
          iconColor: color || colors.textPrimary,
        };
    }
  };

  const { bg, iconColor } = getStyles();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.6}
    >
      <Ionicons
        name={icon}
        size={iconSize}
        color={disabled ? colors.gray400 : iconColor}
      />
      {badge !== undefined && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.error, borderColor: colors.background }]}>
          <Text style={[styles.badgeText, { color: colors.white }]}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  disabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxs,
    borderWidth: 2,
  },
  badgeText: {
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
});

export default IconButton;
