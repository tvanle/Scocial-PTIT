import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_FONT_SIZE,
} from '../../../../constants/dating';

interface WorkEducationSectionProps {
  data: {
    school?: string;
    job?: string;
    company?: string;
  };
}

export const WorkEducationSection: React.FC<WorkEducationSectionProps> = React.memo(({ data }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Công việc và học vấn</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Bạc học / Cảm đảng</Text>
        <Pressable style={styles.value}>
          <Text style={styles.valueText}>{data.school || 'Học viện Công nghệ PTIT'}</Text>
          <Ionicons name="chevron-forward" size={16} color={DATING_COLORS.light.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Công việc</Text>
        <Pressable style={styles.value}>
          <Text style={styles.valueText}>{data.job || 'Mobile Developer'}</Text>
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Công ty</Text>
        <Pressable style={styles.value}>
          <Text style={styles.valueText}>{data.company || 'Google'}</Text>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginBottom: DATING_SPACING.xl,
  },
  title: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.md,
  },
  field: {
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
    paddingVertical: DATING_SPACING.md,
    marginBottom: DATING_SPACING.md,
  },
  label: {
    fontSize: DATING_FONT_SIZE.small,
    color: DATING_COLORS.light.textSecondary,
    marginBottom: DATING_SPACING.xs,
  },
  value: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
    fontWeight: '500',
  },
});
