import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery.header;

export const DiscoveryHeader: React.FC = () => (
  <View
    style={[
      styles.container,
      {
        paddingHorizontal: layout.paddingH,
        paddingTop: layout.paddingTop,
        paddingBottom: layout.paddingBottom,
      },
    ]}
  >
    <TouchableOpacity
      style={[styles.iconBtn, { width: layout.iconSize, height: layout.iconSize, backgroundColor: colors.headerIconBg }]}
      activeOpacity={0.7}
    >
      <MaterialIcons name="person" size={layout.iconSize / 2} color={colors.subtitleColor} />
    </TouchableOpacity>

    <View style={styles.titleWrap}>
      <Text style={[styles.title, { fontSize: layout.titleSize, color: colors.title }]}>
        PTIT Connect
      </Text>
      <Text
        style={[
          styles.subtitle,
          { fontSize: layout.subtitleSize, color: colors.subtitleColor, opacity: layout.subtitleOpacity },
        ]}
      >
        DISCOVERY
      </Text>
    </View>

    <TouchableOpacity
      style={[styles.iconBtn, { width: layout.iconSize, height: layout.iconSize, backgroundColor: colors.headerIconBg }]}
      activeOpacity={0.7}
    >
      <MaterialIcons name="tune" size={layout.iconSize / 2} color={colors.subtitleColor} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconBtn: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleWrap: {
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontWeight: '700',
    letterSpacing: 3,
  },
});
