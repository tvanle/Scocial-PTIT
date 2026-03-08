import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { DATING_COLORS } from '../../../constants/dating/theme';

const colors = DATING_COLORS.preferences;
const PADDING_H = 20;
const PADDING_V = 16;
const HIT_SLOP = 12;

interface FilterFormHeaderProps {
  title: string;
  expandAllLabel: string;
  onExpandAll: () => void;
}

export const FilterFormHeader = React.memo<FilterFormHeaderProps>(
  ({ title, expandAllLabel, onExpandAll }) => (
    <View style={styles.header}>
      <Text style={styles.headerTitle}>{title}</Text>
      <TouchableOpacity onPress={onExpandAll} hitSlop={HIT_SLOP}>
        <Text style={styles.expandAll}>{expandAllLabel}</Text>
      </TouchableOpacity>
    </View>
  )
);

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PADDING_H,
    paddingVertical: PADDING_V,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.cardBorder,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.headerTitle,
  },
  expandAll: {
    fontSize: 14,
    fontWeight: '600',
    color: DATING_COLORS.primary,
  },
});
