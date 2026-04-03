/**
 * Dating Tab Navigator
 *
 * Bottom tab navigation for Dating module
 * Prevents unnecessary re-renders when switching tabs
 */

import React, { useCallback, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';

import { DatingThemeProvider, useDatingTheme } from '../contexts/DatingThemeContext';
import { DatingDiscoveryScreen } from '../screens/dating/discovery';
import { DatingLikesScreen } from '../screens/dating/likes';
import { DatingChatListScreen } from '../screens/dating/chat';
import { DatingMyProfileScreen } from '../screens/dating/profile';
import {
  TAB_BAR,
  SPACING,
  TEXT_STYLES,
} from '../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type DatingTabParamList = {
  DatingDiscoverTab: undefined;
  DatingLikesTab: undefined;
  DatingChatsTab: undefined;
  DatingProfileTab: undefined;
};

type TabKey = 'discover' | 'likes' | 'chats' | 'profile';

interface Tab {
  key: TabKey;
  name: keyof DatingTabParamList;
  label: string;
  icon: string;
  iconFamily: 'material' | 'ionicons';
}

const TABS: Tab[] = [
  {
    key: 'discover',
    name: 'DatingDiscoverTab',
    label: 'Khám phá',
    icon: 'fire',
    iconFamily: 'material',
  },
  {
    key: 'likes',
    name: 'DatingLikesTab',
    label: 'Thích',
    icon: 'heart',
    iconFamily: 'material',
  },
  {
    key: 'chats',
    name: 'DatingChatsTab',
    label: 'Tin nhắn',
    icon: 'chatbubble',
    iconFamily: 'ionicons',
  },
  {
    key: 'profile',
    name: 'DatingProfileTab',
    label: 'Hồ sơ',
    icon: 'person',
    iconFamily: 'ionicons',
  },
];

const Tab = createBottomTabNavigator<DatingTabParamList>();

// ═══════════════════════════════════════════════════════════════
// TAB ITEM
// ═══════════════════════════════════════════════════════════════

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
  badge?: number;
  theme: ReturnType<typeof useDatingTheme>['theme'];
}

const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onPress, badge, theme }) => {
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
// CUSTOM TAB BAR
// ═══════════════════════════════════════════════════════════════

const DatingTabBar = ({ state, navigation }: any) => {
  const { theme, isDark } = useDatingTheme();
  const insets = useSafeAreaInsets();

  const handleTabPress = useCallback((tab: Tab, index: number) => {
    Haptics.selectionAsync();
    const isFocused = state.index === index;

    if (!isFocused) {
      navigation.navigate(tab.name);
    }
  }, [state.index, navigation]);

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
      {TABS.map((tab, index) => (
        <TabItem
          key={tab.key}
          tab={tab}
          isActive={state.index === index}
          onPress={() => handleTabPress(tab, index)}
          theme={theme}
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
// MAIN NAVIGATOR
// ═══════════════════════════════════════════════════════════════

const DatingTabNavigatorInner: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <DatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        lazy: true, // Lazy load tabs to improve performance
      }}
    >
      <Tab.Screen
        name="DatingDiscoverTab"
        component={DatingDiscoveryScreen}
      />
      <Tab.Screen
        name="DatingLikesTab"
        component={DatingLikesScreen}
      />
      <Tab.Screen
        name="DatingChatsTab"
        component={DatingChatListScreen}
      />
      <Tab.Screen
        name="DatingProfileTab"
        component={DatingMyProfileScreen}
      />
    </Tab.Navigator>
  );
};

export const DatingTabNavigator: React.FC = () => {
  return (
    <DatingThemeProvider>
      <DatingTabNavigatorInner />
    </DatingThemeProvider>
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

export default DatingTabNavigator;
