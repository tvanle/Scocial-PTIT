import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery.header;

interface DiscoveryHeaderProps {
  onFilterPress?: () => void;
}

export const DiscoveryHeader = React.memo<DiscoveryHeaderProps>(({ onFilterPress }) => (
  <View style={styles.container}>
    <TouchableOpacity
      style={styles.iconBtn}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel="My profile"
    >
      <MaterialIcons name="person" size={layout.iconSize / 2} color={colors.subtitleColor} />
    </TouchableOpacity>

    <View style={styles.titleWrap}>
      <Text style={styles.title}>PTIT Connect</Text>
      <Text style={styles.subtitle}>DISCOVERY</Text>
    </View>

    <TouchableOpacity
      style={styles.iconBtn}
      activeOpacity={0.7}
      onPress={onFilterPress}
      accessibilityRole="button"
      accessibilityLabel="Filter preferences"
    >
      <MaterialIcons name="tune" size={layout.iconSize / 2} color={colors.subtitleColor} />
    </TouchableOpacity>
  </View>
));

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: layout.paddingH,
    paddingTop: layout.paddingTop,
    paddingBottom: layout.paddingBottom,
  },
  iconBtn: {
    width: layout.iconSize,
    height: layout.iconSize,
    borderRadius: 9999,
    backgroundColor: colors.headerIconBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.3,
    fontSize: layout.titleSize,
    color: colors.title,
  },
  subtitle: {
    fontWeight: '700',
    letterSpacing: 3,
    fontSize: layout.subtitleSize,
    color: colors.subtitleColor,
    opacity: layout.subtitleOpacity,
  },
});
