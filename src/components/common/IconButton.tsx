import React from 'react';
import { TouchableOpacity, StyleSheet, ViewStyle, View, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, Spacing, FontSize, FontWeight } from '../../constants/theme';

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
  variant?: 'default' | 'primary' | 'secondary' | 'outline' | 'ghost';
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
  const getStyles = (): { bg: string; iconColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          bg: backgroundColor || Colors.primary,
          iconColor: color || Colors.textLight,
        };
      case 'secondary':
        return {
          bg: backgroundColor || Colors.secondary,
          iconColor: color || Colors.textLight,
        };
      case 'outline':
        return {
          bg: 'transparent',
          iconColor: color || Colors.primary,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          iconColor: color || Colors.textSecondary,
        };
      default:
        return {
          bg: backgroundColor || Colors.backgroundSecondary,
          iconColor: color || Colors.textPrimary,
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
        variant === 'outline' && styles.outline,
        disabled && styles.disabled,
        style,
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Ionicons
        name={icon}
        size={iconSize}
        color={disabled ? Colors.textTertiary : iconColor}
      />
      {badge !== undefined && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
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
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.primary,
  },
  disabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.round,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xs,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  badgeText: {
    color: Colors.textLight,
    fontSize: FontSize.xs,
    fontWeight: FontWeight.bold,
  },
});

export default IconButton;
