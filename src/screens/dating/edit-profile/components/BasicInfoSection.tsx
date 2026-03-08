import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, FlatList, TextInput, Alert } from 'react-native';
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

const GENDER_OPTIONS = ['Nam', 'Nữ', 'Khác'];
const RELATIONSHIP_OPTIONS = ['Độc thân', 'Đang tìm hiểu', 'Đã có mối quan hệ', 'Phức tạp'];

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = React.memo(
  ({ data, onUpdate }) => {
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [heightInput, setHeightInput] = useState(String(data.height || '175'));
    const [weightInput, setWeightInput] = useState(data.weight || '');

    const handleFieldPress = useCallback((field: string) => {
      setSelectedField(field);
    }, []);

    const handleSelectOption = useCallback((field: string, value: string) => {
      onUpdate({
        ...data,
        [field]: value,
      });
      setSelectedField(null);
    }, [data, onUpdate]);

    const handleHeightChange = useCallback((value: string) => {
      setHeightInput(value);
      const num = parseInt(value) || 0;
      if (num > 0 && num < 300) {
        onUpdate({
          ...data,
          height: num,
        });
      }
    }, [data, onUpdate]);

    const handleWeightChange = useCallback((value: string) => {
      setWeightInput(value);
      onUpdate({
        ...data,
        weight: value,
      });
    }, [data, onUpdate]);

    return (
      <View style={styles.container}>
        <Text style={styles.title}>Thông tin cơ bản</Text>

        <View style={[styles.row, styles.rowGap]}>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Giới tính</Text>
            <Pressable
              style={styles.value}
              onPress={() => handleFieldPress('gender')}
            >
              <Text style={styles.valueText}>{data.gender || 'Chọn'}</Text>
              <Ionicons name="chevron-forward" size={16} color={DATING_COLORS.light.textSecondary} />
            </Pressable>
          </View>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Mối quan hệ</Text>
            <Pressable
              style={styles.value}
              onPress={() => handleFieldPress('relationshipStatus')}
            >
              <Text style={styles.valueText}>{data.relationshipStatus || 'Chọn'}</Text>
              <Ionicons name="chevron-forward" size={16} color={DATING_COLORS.light.textSecondary} />
            </Pressable>
          </View>
        </View>

        <View style={[styles.row, styles.rowGap]}>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Chiều cao (cm)</Text>
            <TextInput
              style={styles.input}
              placeholder="175"
              placeholderTextColor={DATING_COLORS.light.textSecondary}
              value={heightInput}
              onChangeText={handleHeightChange}
              keyboardType="numeric"
            />
          </View>
          <View style={[styles.field, styles.flex1]}>
            <Text style={styles.label}>Cân nặng</Text>
            <TextInput
              style={styles.input}
              placeholder="70 kg"
              placeholderTextColor={DATING_COLORS.light.textSecondary}
              value={weightInput}
              onChangeText={handleWeightChange}
            />
          </View>
        </View>

        {/* Gender Modal */}
        <Modal visible={selectedField === 'gender'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn giới tính</Text>
              {GENDER_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={styles.modalOption}
                  onPress={() => handleSelectOption('gender', option)}
                >
                  <Text style={styles.modalOptionText}>{option}</Text>
                  {data.gender === option && (
                    <Ionicons name="checkmark" size={20} color={DATING_COLORS.primary} />
                  )}
                </Pressable>
              ))}
              <Pressable
                style={styles.modalClose}
                onPress={() => setSelectedField(null)}
              >
                <Text style={styles.modalCloseText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        </Modal>

        {/* Relationship Status Modal */}
        <Modal visible={selectedField === 'relationshipStatus'} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Chọn mối quan hệ</Text>
              {RELATIONSHIP_OPTIONS.map((option) => (
                <Pressable
                  key={option}
                  style={styles.modalOption}
                  onPress={() => handleSelectOption('relationshipStatus', option)}
                >
                  <Text style={styles.modalOptionText}>{option}</Text>
                  {data.relationshipStatus === option && (
                    <Ionicons name="checkmark" size={20} color={DATING_COLORS.primary} />
                  )}
                </Pressable>
              ))}
              <Pressable
                style={styles.modalClose}
                onPress={() => setSelectedField(null)}
              >
                <Text style={styles.modalCloseText}>Đóng</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
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
  input: {
    borderWidth: 1,
    borderColor: DATING_COLORS.light.border,
    borderRadius: 8,
    paddingHorizontal: DATING_SPACING.sm,
    paddingVertical: DATING_SPACING.sm,
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
  },
  flex1: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: DATING_COLORS.light.background,
    borderRadius: 12,
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.lg,
    width: '80%',
  },
  modalTitle: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.md,
  },
  modalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: DATING_SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: DATING_COLORS.light.border,
  },
  modalOptionText: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
  },
  modalClose: {
    marginTop: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.md,
    backgroundColor: DATING_COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  modalCloseText: {
    fontSize: DATING_FONT_SIZE.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
