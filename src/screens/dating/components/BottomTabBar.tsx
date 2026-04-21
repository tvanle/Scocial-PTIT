/**
 * Dating Bottom Tab Bar
 *
 * Modern bottom navigation với animated indicators và glass effect
 */

import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  interpolateColor,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import { SPACING, RADIUS } from '../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TAB_COUNT = 4;
const TAB_WIDTH = SCREEN_WIDTH / TAB_COUNT;
const INDICATOR_WIDTH = 48;
const ICON_SIZE = 24;
const ACTIVE_ICON_SIZE = 26;

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type TabKey = 'discover' | 'likes' | 'chats' | 'profile';

interface Tab {
  key: TabKey;
  label: string;
  icon: string;
  activeIcon: string;
  iconFamily: 'material' | 'ionicons';
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
    activeIcon: 'fire',
    iconFamily: 'material',
  },
  {
    key: 'likes',
    label: 'Thích bạn',
    icon: 'cards-heart-outline',
    activeIcon: 'cards-heart',
    iconFamily: 'material',
  },
  {
    key: 'chats',
    label: 'Tin nhắn',
    icon: 'chatbubble-outline',
    activeIcon: 'chatbubble',
    iconFamily: 'ionicons',
  },
  {
    key: 'profile',
    label: 'Hồ sơ',
    icon: 'person-outline',
    activeIcon: 'person',
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

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const TabItem: React.FC<TabItemProps> = ({ tab, isActive, onPress, badge }) => {
  const { theme } = useDatingTheme();
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(isActive ? 1 : 0.9);

  React.useEffect(() => {
    iconScale.value = withSpring(isActive ? 1 : 0.9, {
      damping: 15,
      stiffness: 150,
    });
  }, [isActive]);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const handlePress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  }, [onPress]);

  const animatedContainerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
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
      <Animated.View style={[styles.iconWrapper, animatedIconStyle]}>
        {isActive && (
          <View style={[styles.activeBackground, { backgroundColor: theme.brand.primaryMuted }]} />
        )}
        <IconComponent
          name={iconName as any}
          size={isActive ? ACTIVE_ICON_SIZE : ICON_SIZE}
          color={color}
        />
        {badge !== undefined && badge > 0 && (
          <View style={[styles.badge, { backgroundColor: theme.brand.primary }]}>
            <Text style={styles.badgeText}>
              {badge > 99 ? '99+' : badge}
            </Text>
          </View>
        )}
      </Animated.View>
      <Text
        style={[
          styles.label,
          { color },
          isActive && styles.labelActive,
        ]}
        numberOfLines={1}
      >
        {tab.label}
      </Text>
    </AnimatedTouchable>
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

  const activeIndex = TABS.findIndex((t) => t.key === activeTab);
  const indicatorX = useSharedValue(activeIndex * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2);

  React.useEffect(() => {
    const newX = activeIndex * TAB_WIDTH + (TAB_WIDTH - INDICATOR_WIDTH) / 2;
    indicatorX.value = withSpring(newX, {
      damping: 20,
      stiffness: 200,
    });
  }, [activeIndex]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

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

  const paddingBottom = Math.max(insets.bottom, SPACING.md);

  const content = (
    <View style={styles.innerContainer}>
      {/* Animated Indicator Line */}
      <Animated.View
        style={[
          styles.indicator,
          { backgroundColor: theme.brand.primary },
          indicatorStyle,
        ]}
      />

      {/* Tab Items */}
      <View style={[styles.tabsRow, { paddingBottom }]}>
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
    </View>
  );

  // Use BlurView on iOS for glass effect
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={isDark ? 40 : 80}
          tint={isDark ? 'dark' : 'light'}
        />
        <View style={[styles.overlay, { backgroundColor: isDark ? 'rgba(13,13,13,0.7)' : 'rgba(255,255,255,0.8)' }]} />
        <View style={[styles.topBorder, { backgroundColor: theme.border.subtle }]} />
        {content}
      </View>
    );
  }

  // Solid background on Android with subtle shadow
  return (
    <View
      style={[
        styles.container,
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
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
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
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
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
    paddingVertical: SPACING.xs,
  },
  iconWrapper: {
    position: 'relative',
    width: 44,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  activeBackground: {
    position: 'absolute',
    width: 44,
    height: 32,
    borderRadius: RADIUS.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 0.2,
  },
  labelActive: {
    fontWeight: '600',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
});

export default BottomTabBar;
