/**
 * Dating Bottom Tab Bar
 *
 * Custom bottom navigation cho Dating module
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  TAB_BAR,
  SPACING,
  TEXT_STYLES,
} from '../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type TabKey = 'discover' | 'likes' | 'chats' | 'profile';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
  iconFamily: 'material' | 'ionicons';
  badge?: number;
}

interface BottomTabBarProps {
  activeTab: TabKey;
  onTabPress: (key: TabKey) => void;
  likesCount?: number;
  unreadCount?: number;
}

// ═══════════════════════════════════════════════════════════════
// TABS CONFIG
// ═══════════════════════════════════════════════════════════════

const TABS: Tab[] = [
  {
    key: 'discover',
    label: 'Khám phá',
    icon: 'fire',
    iconFamily: 'material',
  },
  {
    key: 'likes',
    label: 'Thích',
    icon: 'heart',
    iconFamily: 'material',
  },
  {
    key: 'chats',
    label: 'Tin nhắn',
    icon: 'chatbubble',
    iconFamily: 'ionicons',
  },
  {
    key: 'profile',
    label: 'Hồ sơ',
    icon: 'person',
    iconFamily: 'ionicons',
  },
];

// ═══════════════════════════════════════════════════════════════
// TAB ITEM
// ═══════════════════════════════════════════════════════════════

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
  badge?: number;
}

const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onPress, badge }) => {
  const { theme } = useDatingTheme();

  const IconComponent = tab.iconFamily === 'ionicons' ? Ionicons : MaterialCommunityIcons;
  const iconName = tab.iconFamily === 'ionicons'
    ? (isActive ? tab.icon : `${tab.icon}-outline`)
    : tab.icon;

  const color = isActive ? theme.nav.active : theme.nav.inactive;

  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <View style={styles.iconContainer}>
        <IconComponent
          name={iconName as any}
          size={TAB_BAR.iconSize}
          color={color}
        />
        {badge && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.brand.primary }]}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.label, { color }]}>
        {tab.label}
      </Text>
    </TouchableOpacity>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  onTabPress,
  likesCount,
  unreadCount,
}) => {
  const { theme, isDark } = useDatingTheme();
  const insets = useSafeAreaInsets();

  const getBadge = (key: TabKey) => {
    switch (key) {
      case 'likes':
        return likesCount;
      case 'chats':
        return unreadCount;
      default:
        return undefined;
    }
  };

  const content = (
    <View
      style={[
        styles.container,
        {
          paddingBottom: Math.max(insets.bottom, TAB_BAR.paddingBottom),
          borderTopColor: theme.border.subtle,
        },
      ]}
    >
      {TABS.map((tab) => (
        <TabItem
          key={tab.key}
          tab={tab}
          isActive={activeTab === tab.key}
          onPress={() => onTabPress(tab.key)}
          badge={getBadge(tab.key)}
        />
      ))}
    </View>
  );

  // Use BlurView on iOS for better effect
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        style={styles.blurContainer}
        intensity={80}
        tint={isDark ? 'dark' : 'light'}
      >
        {content}
      </BlurView>
    );
  }

  // Solid background on Android
  return (
    <View style={[styles.solidContainer, { backgroundColor: theme.nav.background }]}>
      {content}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  blurContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  solidContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingTop: SPACING.xs,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xs,
  },
  iconContainer: {
    position: 'relative',
    marginBottom: SPACING.xxs,
  },
  label: {
    ...TEXT_STYLES.tiny,
    textTransform: 'none',
    fontSize: 10,
    letterSpacing: 0,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
});

export default BottomTabBar;
