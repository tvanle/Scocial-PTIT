import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal, TextInput } from 'react-native';
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
  onUpdate?: (data: any) => void;
}

export const WorkEducationSection: React.FC<WorkEducationSectionProps> = React.memo(
  ({ data, onUpdate }) => {
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [inputValue, setInputValue] = useState('');

    const handleFieldPress = useCallback((field: string, currentValue: string) => {
      setSelectedField(field);
      setInputValue(currentValue || '');
    }, []);

    const handleSave = useCallback(() => {
      if (onUpdate && selectedField) {
        onUpdate({
          ...data,
          [selectedField]: inputValue,
        });
      }
      setSelectedField(null);
    }, [selectedField, inputValue, data, onUpdate]);
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Công việc và học vấn</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Trường học</Text>
          <Pressable 
            style={styles.value}
            onPress={() => handleFieldPress('school', data.school || '')}
          >
            <Text style={styles.valueText}>{data.school || 'Chưa cập nhật'}</Text>
            <Ionicons name="pencil" size={16} color={DATING_COLORS.light.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Công việc</Text>
          <Pressable 
            style={styles.value}
            onPress={() => handleFieldPress('job', data.job || '')}
          >
            <Text style={styles.valueText}>{data.job || 'Chưa cập nhật'}</Text>
            <Ionicons name="pencil" size={16} color={DATING_COLORS.light.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Công ty</Text>
          <Pressable 
            style={styles.value}
            onPress={() => handleFieldPress('company', data.company || '')}
          >
            <Text style={styles.valueText}>{data.company || 'Chưa cập nhật'}</Text>
            <Ionicons name="pencil" size={16} color={DATING_COLORS.light.textSecondary} />
          </Pressable>
        </View>

        {/* Edit Modal */}
        <Modal visible={selectedField !== null} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {selectedField === 'school' && 'Trường học'}
                {selectedField === 'job' && 'Công việc'}
                {selectedField === 'company' && 'Công ty'}
              </Text>
              <TextInput
                style={styles.modalInput}
                placeholder="Nhập thông tin"
                value={inputValue}
                onChangeText={setInputValue}
              />
              <View style={styles.modalActions}>
                <Pressable 
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setSelectedField(null)}
                >
                  <Text style={styles.cancelButtonText}>Hủy</Text>
                </Pressable>
                <Pressable 
                  style={[styles.modalButton, styles.saveButton]}
                  onPress={handleSave}
                >
                  <Text style={styles.saveButtonText}>Lưu</Text>
                </Pressable>
              </View>
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
    width: '85%',
  },
  modalTitle: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.md,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: DATING_COLORS.light.border,
    borderRadius: 8,
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.md,
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.lg,
  },
  modalActions: {
    flexDirection: 'row',
    gap: DATING_SPACING.md,
  },
  modalButton: {
    flex: 1,
    paddingVertical: DATING_SPACING.md,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: DATING_COLORS.light.border,
  },
  cancelButtonText: {
    fontSize: DATING_FONT_SIZE.body,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
  },
  saveButton: {
    backgroundColor: DATING_COLORS.primary,
  },
  saveButtonText: {
    fontSize: DATING_FONT_SIZE.body,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
