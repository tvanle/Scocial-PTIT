/**
 * Dating Tab Navigator
 *
 * Modern bottom tab navigation với animated indicators và glass effect
 */

import React, { useCallback, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  Platform,
  Dimensions,
} from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { DatingThemeProvider, useDatingTheme } from '../contexts/DatingThemeContext';
import { DatingDiscoveryScreen } from '../screens/dating/discovery';
import { DatingLikesScreen } from '../screens/dating/likes';
import { DatingChatListScreen } from '../screens/dating/chat';
import { DatingMyProfileScreen } from '../screens/dating/profile';
import { SPACING, RADIUS } from '../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_COUNT = 4;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;
const INDICATOR_WIDTH = 40;
const ICON_SIZE = 22;
const ACTIVE_ICON_SIZE = 24;

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
  activeIcon: string;
  iconFamily: 'material' | 'ionicons';
}

const TABS: Tab[] = [
  {
    key: 'discover',
    name: 'DatingDiscoverTab',
    label: 'Khám phá',
    icon: 'fire',
    activeIcon: 'fire',
    iconFamily: 'material',
  },
  {
    key: 'likes',
    name: 'DatingLikesTab',
    label: 'Thích bạn',
    icon: 'cards-heart-outline',
    activeIcon: 'cards-heart',
    iconFamily: 'material',
  },
  {
    key: 'chats',
    name: 'DatingChatsTab',
    label: 'Tin nhắn',
    icon: 'chatbubble-outline',
    activeIcon: 'chatbubble',
    iconFamily: 'ionicons',
  },
  {
    key: 'profile',
    name: 'DatingProfileTab',
    label: 'Hồ sơ',
    icon: 'person-outline',
    activeIcon: 'person',
    iconFamily: 'ionicons',
  },
];

const Tab = createBottomTabNavigator<DatingTabParamList>();

// ═══════════════════════════════════════════════════════════════
// ANIMATED TAB ITEM
// ═══════════════════════════════════════════════════════════════

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface TabItemProps {
  tab: Tab;
  isActive: boolean;
  onPress: () => void;
  badge?: number;
  theme: ReturnType<typeof useDatingTheme>['theme'];
}

const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onPress, badge, theme }) => {
  const scale = useSharedValue(1);
  const activeValue = useSharedValue(isActive ? 1 : 0);

  useEffect(() => {
    activeValue.value = withSpring(isActive ? 1 : 0, {
      damping: 15,
      stiffness: 120,
    });
  }, [isActive]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.92, { damping: 15, stiffness: 300 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => {
    const iconScale = interpolate(
      activeValue.value,
      [0, 1],
      [1, 1.1],
      Extrapolation.CLAMP
    );
    return {
      transform: [{ scale: iconScale }],
    };
  });

  const animatedBgStyle = useAnimatedStyle(() => ({
    opacity: activeValue.value,
    transform: [
      {
        scale: interpolate(
          activeValue.value,
          [0, 1],
          [0.8, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: interpolate(activeValue.value, [0, 1], [0.6, 1]),
  }));

  const IconComponent = tab.iconFamily === 'ionicons' ? Ionicons : MaterialCommunityIcons;
  const iconName = isActive ? tab.activeIcon : tab.icon;
  const color = isActive ? theme.brand.primary : theme.text.muted;

  return (
    <AnimatedTouchable
      style={[styles.tabItem, animatedContainerStyle]}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={1}
      accessibilityRole="tab"
      accessibilityState={{ selected: isActive }}
      accessibilityLabel={tab.label}
    >
      <View style={styles.iconWrapper}>
        {/* Active background pill */}
        <Animated.View
          style={[
            styles.activeBackground,
            { backgroundColor: theme.brand.primaryMuted },
            animatedBgStyle,
          ]}
        />
        <Animated.View style={animatedIconStyle}>
          <IconComponent
            name={iconName as any}
            size={isActive ? ACTIVE_ICON_SIZE : ICON_SIZE}
            color={color}
          />
        </Animated.View>
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.brand.primary, borderColor: theme.bg.base }]}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </View>
      <Animated.Text
        style={[
          styles.label,
          { color },
          isActive && styles.labelActive,
          animatedLabelStyle,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Animated.Text>
    </AnimatedTouchable>
  );
};

// ═══════════════════════════════════════════════════════════════
// CUSTOM TAB BAR
// ═══════════════════════════════════════════════════════════════

const DatingTabBar = ({ state, navigation }: any) => {
  const { theme, isDark } = useDatingTheme();
  const insets = useSafeAreaInsets();

  // Animated indicator
  const indicatorX = useSharedValue(state.index * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2);

  useEffect(() => {
    const newX = state.index * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2;
    indicatorX.value = withSpring(newX, {
      damping: 20,
      stiffness: 180,
    });
  }, [state.index]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  const handleTabPress = useCallback((tab: Tab, index: number) => {
    const isFocused = state.index === index;
    if (!isFocused) {
      navigation.navigate(tab.name);
    }
  }, [state.index, navigation]);

  const paddingBottom = Math.max(insets.bottom, SPACING.sm);

  const content = (
    <View style={styles.innerContainer}>
      {/* Animated indicator line */}
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: theme.brand.primary },
          indicatorStyle,
        ]}
      />

      {/* Tab items */}
      <View style={[styles.tabsRow, { paddingBottom }]}>
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
    </View>
  );

  // iOS: Glass effect with blur
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.tabBarContainer}>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={isDark ? 50 : 90}
          tint={isDark ? 'dark' : 'light'}
        />
        <View
          style={[
            styles.overlay,
            { backgroundColor: isDark ? 'rgba(13,13,13,0.6)' : 'rgba(255,255,255,0.75)' },
          ]}
        />
        <View style={[styles.topBorder, { backgroundColor: theme.border.subtle }]} />
        {content}
      </View>
    );
  }

  // Android: Solid background with elevation
  return (
    <View
      style={[
        styles.tabBarContainer,
        styles.androidShadow,
        { backgroundColor: isDark ? theme.bg.elevated : theme.bg.base },
      ]}
    >
      <View style={[styles.topBorder, { backgroundColor: theme.border.subtle }]} />
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
        lazy: true,
      }}
    >
      <Tab.Screen name="DatingDiscoverTab" component={DatingDiscoveryScreen} />
      <Tab.Screen name="DatingLikesTab" component={DatingLikesScreen} />
      <Tab.Screen name="DatingChatsTab" component={DatingChatListScreen} />
      <Tab.Screen name="DatingProfileTab" component={DatingMyProfileScreen} />
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
  tabBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  androidShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  innerContainer: {
    position: 'relative',
  },
  indicator: {
    position: 'absolute',
    top: 0,
    width: INDICATOR_WIDTH,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
  },
  tabsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: SPACING.sm,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxs,
  },
  iconWrapper: {
    position: 'relative',
    width: 48,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeBackground: {
    position: 'absolute',
    width: 48,
    height: 32,
    borderRadius: RADIUS.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
  labelActive: {
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
    borderWidth: 2,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default DatingTabNavigator;
