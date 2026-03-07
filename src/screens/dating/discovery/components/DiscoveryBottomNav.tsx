import React from 'react';
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

interface DiscoveryBottomNavProps {
  activeTab?: string;
  onTabPress?: (key: string) => void;
}

export const DiscoveryBottomNav: React.FC<DiscoveryBottomNavProps> = ({
  activeTab = 'discover',
  onTabPress,
}) => (
  <View style={styles.wrapper}>
    <View style={[styles.container, { borderTopColor: colors.navBorder }]}>
      <View style={styles.inner}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const color = isActive ? colors.navActive : colors.navInactive;
          const iconName = isActive ? tab.iconFilled : tab.icon;

          return (
            <TouchableOpacity
              key={tab.key}
              style={styles.tab}
              activeOpacity={0.5}
              onPress={() => onTabPress?.(tab.key)}
            >
              <View style={styles.indicatorWrap}>
                {isActive && <View style={[styles.indicator, { backgroundColor: colors.navActive }]} />}
              </View>

              <View style={[styles.iconWrap, isActive && styles.activeIconWrap]}>
                <MaterialIcons
                  name={iconName as keyof typeof MaterialIcons.glyphMap}
                  size={layout.iconSize + 2}
                  color={color}
                />
              </View>

              <Text
                style={[
                  styles.label,
                  { fontSize: layout.labelSize + 1, color },
                  isActive && styles.activeLabel,
                ]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  </View>
);

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
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
    paddingTop: 0,
    paddingBottom: 34,
    paddingHorizontal: 8,
  },
  tab: {
    alignItems: 'center',
    flex: 1,
  },
  indicatorWrap: {
    height: 3,
    width: '100%',
    alignItems: 'center',
    marginBottom: 10,
  },
  indicator: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
  },
  iconWrap: {
    width: 48,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 18,
  },
  activeIconWrap: {
    backgroundColor: 'rgba(236, 19, 19, 0.08)',
  },
  label: {
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.1,
  },
  activeLabel: {
    fontWeight: '700',
  },
});
