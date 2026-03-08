import React, { useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery.nav;

const TABS = [
  { key: 'discover', icon: 'explore', iconFilled: 'explore', label: 'Discover' },
  { key: 'likes', icon: 'favorite-border', iconFilled: 'favorite', label: 'Likes' },
  { key: 'chats', icon: 'chat-bubble-outline', iconFilled: 'chat-bubble', label: 'Chats' },
  { key: 'profile', icon: 'person-outline', iconFilled: 'person', label: 'Profile' },
] as const;

interface TabItemProps {
  tabKey: string;
  icon: string;
  iconFilled: string;
  label: string;
  isActive: boolean;
  onPress: (key: string) => void;
}

const TabItem = React.memo<TabItemProps>(({ tabKey, icon, iconFilled, label, isActive, onPress }) => {
  const iconName = isActive ? iconFilled : icon;
  const handlePress = useCallback(() => onPress(tabKey), [onPress, tabKey]);

  return (
    <TouchableOpacity
      style={styles.tab}
      activeOpacity={0.5}
      onPress={handlePress}
      accessibilityRole="tab"
      accessibilityLabel={label}
      accessibilityState={{ selected: isActive }}
    >
      <View style={styles.indicatorWrap}>
        {isActive && <View style={[styles.indicator, styles.indicatorActive]} />}
      </View>
      <View style={[styles.iconWrap, isActive && styles.activeIconWrap]}>
        <MaterialIcons
          name={iconName as keyof typeof MaterialIcons.glyphMap}
          size={layout.iconSize + 2}
          color={isActive ? colors.navActive : colors.navInactive}
        />
      </View>
      <Text style={[styles.label, isActive ? styles.labelActive : styles.labelInactive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
});

interface DiscoveryBottomNavProps {
  activeTab?: string;
  onTabPress?: (key: string) => void;
}

const noop = (_key: string) => {};

export const DiscoveryBottomNav = React.memo<DiscoveryBottomNavProps>(({
  activeTab = 'discover',
  onTabPress = noop,
}) => (
  <View style={styles.wrapper}>
    <View style={styles.container}>
      <View style={styles.inner}>
        {TABS.map((tab) => (
          <TabItem
            key={tab.key}
            tabKey={tab.key}
            icon={tab.icon}
            iconFilled={tab.iconFilled}
            label={tab.label}
            isActive={activeTab === tab.key}
            onPress={onTabPress}
          />
        ))}
      </View>
    </View>
  </View>
));

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.navBg,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -3 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: { elevation: 8 },
    }),
  },
  container: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.navBorder,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 0,
    paddingBottom: 34,
    paddingHorizontal: 8,
  },
  tab: { alignItems: 'center', flex: 1 },
  indicatorWrap: { height: 3, width: '100%', alignItems: 'center', marginBottom: 10 },
  indicator: { width: 24, height: 3, borderRadius: 1.5 },
  indicatorActive: { backgroundColor: colors.navActive },
  iconWrap: { width: 48, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 18 },
  activeIconWrap: { backgroundColor: 'rgba(236, 19, 19, 0.08)' },
  label: { fontWeight: '500', marginTop: 4, letterSpacing: 0.1, fontSize: layout.labelSize + 1 },
  labelActive: { fontWeight: '700', color: colors.navActive },
  labelInactive: { color: colors.navInactive },
});
