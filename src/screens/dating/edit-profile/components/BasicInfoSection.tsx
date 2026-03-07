import React, { useCallback } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_FONT_SIZE,
} from '../../../../constants/dating';

interface BasicInfoSectionProps {
  data: {
    location: string;
    gender: string;
    relationshipStatus: string;
    height?: number;
    weight?: string;
  };
  onUpdate: (data: any) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = React.memo(
  ({ data, onUpdate }) => {
    const handleFieldPress = useCallback((field: string) => {
      // Open modal to edit field - will be implemented
    }, []);

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thông tin cơ bản</Text>

        <View style={styles.row}>
          <View style={styles.field}>
            <Text style={styles.label}>Tên</Text>
            <Pressable
              style={styles.value}
              onPress={() => handleFieldPress('name')}
            >
              <Text style={styles.valueText}>Nguyễn Văn A</Text>
              <Ionicons name="chevron-forward" size={16} color={DATING_COLORS.light.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.row, styles.rowGap]}>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Độ tuổi</Text>
            <Pressable
              style={styles.value}
              onPress={() => handleFieldPress('age')}
            >
              <Text style={styles.valueText}>21</Text>
            </Pressable>
          </View>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Địa chỉ</Text>
            <Pressable
              style={styles.value}
              onPress={() => handleFieldPress('location')}
            >
              <Text style={styles.valueText}>{data.location}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.row, styles.rowGap]}>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Giới tính</Text>
            <Pressable
              style={styles.value}
              onPress={() => handleFieldPress('gender')}
            >
              <Text style={styles.valueText}>{data.gender}</Text>
            </Pressable>
          </View>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Mối quan hệ</Text>
            <Pressable
              style={styles.value}
              onPress={() => handleFieldPress('relationshipStatus')}
            >
              <Text style={styles.valueText}>{data.relationshipStatus}</Text>
            </Pressable>
          </View>
        </View>

        <View style={[styles.row, styles.rowGap]}>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Chiều cao (cm)</Text>
            <Pressable
              style={styles.value}
              onPress={() => handleFieldPress('height')}
            >
              <Text style={styles.valueText}>{data.height || '175'}</Text>
            </Pressable>
          </View>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Cân nặng</Text>
            <Pressable
              style={styles.value}
              onPress={() => handleFieldPress('weight')}
            >
              <Text style={styles.valueText}>{data.weight || 'Thạnh Hóa'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    );
  }
);

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
  row: {
    marginBottom: DATING_SPACING.md,
  },
  rowGap: {
    marginBottom: DATING_SPACING.md,
    flexDirection: 'row',
    gap: DATING_SPACING.md,
  },
  field: {
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
    paddingVertical: DATING_SPACING.md,
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
  flex1: {
    flex: 1,
  },
});
