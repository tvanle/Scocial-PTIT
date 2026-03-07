import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_FONT_SIZE,
} from '../../../../constants/dating';

interface LifestyleSectionProps {
  data: {
    religion?: string;
    smoking?: string;
    drinking?: string;
    independence?: string;
  };
}

export const LifestyleSection: React.FC<LifestyleSectionProps> = React.memo(({ data }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Lối sống</Text>

      <View style={styles.field}>
        <Text style={styles.label}>Sự tôn giáo</Text>
        <Pressable style={styles.value}>
          <Text style={styles.valueText}>{data.religion || 'Không rõ'}</Text>
          <Ionicons name="chevron-down" size={16} color={DATING_COLORS.light.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Thói quen</Text>
        <Pressable style={styles.value}>
          <Text style={styles.valueText}>{data.smoking || 'Hút thuốc'}</Text>
          <Ionicons name="chevron-down" size={16} color={DATING_COLORS.light.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Hút thuốc</Text>
        <Pressable style={styles.value}>
          <Text style={styles.valueText}>{data.drinking || 'Hót thuốc'}</Text>
          <Ionicons name="chevron-down" size={16} color={DATING_COLORS.light.textSecondary} />
        </Pressable>
      </View>

      <View style={styles.field}>
        <Text style={styles.label}>Độc lập / Tôn giáo</Text>
        <Pressable style={styles.value}>
          <Text style={styles.valueText}>{data.independence || 'Tự do'}</Text>
          <Ionicons name="chevron-down" size={16} color={DATING_COLORS.light.textSecondary} />
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
