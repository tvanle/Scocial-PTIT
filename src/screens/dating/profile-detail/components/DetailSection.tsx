import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail.section;

interface DetailSectionProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  children: React.ReactNode;
}

export const DetailSection = React.memo<DetailSectionProps>(({ icon, title, children }) => (
  <View style={[styles.container, { paddingHorizontal: layout.paddingH, marginTop: layout.marginTop }]}>
    <View style={[styles.titleRow, { gap: layout.titleGap }]}>
      <MaterialIcons name={icon} size={layout.iconSize} color={colors.sectionIcon} />
      <Text style={[styles.title, { fontSize: layout.titleSize, color: colors.sectionTitle }]}>
        {title}
      </Text>
      <View style={styles.line} />
    </View>
    <View style={{ marginTop: layout.contentMarginTop }}>
      {children}
    </View>
  </View>
));

const styles = StyleSheet.create({
  container: {},
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  title: {
    fontWeight: '700',
  },
  line: {
    flex: 1,
    height: 2,
    backgroundColor: DATING_COLORS.profileDetail.divider,
    marginLeft: 8,
  },
});
