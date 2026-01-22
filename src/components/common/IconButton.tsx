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
  const getStyles = (): { bg: string; iconColor: string } => {
    switch (variant) {
      case 'primary':
        return {
          bg: backgroundColor || Colors.black,
          iconColor: color || Colors.white,
        };
      case 'ghost':
        return {
          bg: 'transparent',
          iconColor: color || Colors.black,
        };
      default:
        return {
          bg: backgroundColor || Colors.gray100,
          iconColor: color || Colors.black,
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
        color={disabled ? Colors.gray400 : iconColor}
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
  disabled: {
    opacity: 0.5,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxs,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: {
    color: Colors.white,
    fontSize: FontSize.xxs,
    fontWeight: FontWeight.bold,
  },
});

export default IconButton;
