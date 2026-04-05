/**
 * Dating Discovery Header
 *
 * Minimal header với logo và action buttons
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';

import { useDatingTheme } from '../../../../contexts/DatingThemeContext';
import {
  HEADER,
  SPACING,
  RADIUS,
  TEXT_STYLES,
} from '../../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DiscoveryHeaderProps {
  onBackPress?: () => void;
  onFilterPress?: () => void;
  onNotificationsPress?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// ICON BUTTON
// ═══════════════════════════════════════════════════════════════

interface IconButtonProps {
  icon: string;
  iconFamily?: 'material' | 'ionicons';
  onPress?: () => void;
  badge?: number;
}

const IconButton: React.FC<IconButtonProps> = ({
  icon,
  iconFamily = 'material',
  onPress,
  badge,
}) => {
  const { theme } = useDatingTheme();

  const IconComponent = iconFamily === 'ionicons' ? Ionicons : MaterialCommunityIcons;

  return (
    <TouchableOpacity
      style={[styles.iconButton, { backgroundColor: theme.bg.surface }]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <IconComponent
        name={icon as any}
        size={HEADER.iconSize}
        color={theme.text.secondary}
      />
      {badge && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: theme.brand.primary }]}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DiscoveryHeader: React.FC<DiscoveryHeaderProps> = ({
  onBackPress,
  onFilterPress,
  onNotificationsPress,
}) => {
  const { theme } = useDatingTheme();

  return (
    <View style={[styles.container, { borderBottomColor: theme.border.subtle }]}>
      {/* Left: Back */}
      <View style={styles.leftSection}>
        <IconButton
          icon="arrow-back"
          iconFamily="ionicons"
          onPress={onBackPress}
        />
      </View>

      {/* Center: Logo */}
      <View style={styles.centerSection}>
        <MaterialCommunityIcons
          name="heart"
          size={24}
          color={theme.brand.primary}
        />
        <Text style={[styles.logo, { color: theme.text.primary }]}>
          Dating
        </Text>
      </View>

      {/* Right: Filter + Notifications */}
      <View style={styles.rightSection}>
        <IconButton
          icon="tune-variant"
          onPress={onFilterPress}
        />
        <IconButton
          icon="notifications-outline"
          iconFamily="ionicons"
          onPress={onNotificationsPress}
        />
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: HEADER.height,
    paddingHorizontal: HEADER.paddingHorizontal,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  centerSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  logo: {
    ...TEXT_STYLES.h2,
    fontWeight: '700',
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    justifyContent: 'flex-end',
  },
  iconButton: {
    width: HEADER.iconButtonSize,
    height: HEADER.iconButtonSize,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    ...TEXT_STYLES.tiny,
    color: '#FFFFFF',
    fontSize: 9,
  },
});

export default DiscoveryHeader;
