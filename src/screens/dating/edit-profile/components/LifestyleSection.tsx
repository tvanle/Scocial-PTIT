import React, { useCallback, useState } from 'react';
import { View, Text, Pressable, StyleSheet, Modal } from 'react-native';
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
  onUpdate?: (data: any) => void;
}

const RELIGION_OPTIONS = ['Không', 'Phật giáo', 'Thiên chúa giáo', 'Hồi giáo', 'Khác'];
const SMOKING_OPTIONS = ['Không', 'Thỉnh thoảng', 'Thường xuyên'];
const DRINKING_OPTIONS = ['Không', 'Thỉnh thoảng', 'Thường xuyên'];
const INDEPENDENCE_OPTIONS = ['Độc lập hoàn toàn', 'Tương đối độc lập', 'Phụ thuộc gia đình'];

export const LifestyleSection: React.FC<LifestyleSectionProps> = React.memo(
  ({ data, onUpdate }) => {
    const [selectedField, setSelectedField] = useState<string | null>(null);

    const handleSelectOption = useCallback((field: string, value: string) => {
      if (onUpdate) {
        onUpdate({
          ...data,
          [field]: value,
        });
      }
      setSelectedField(null);
    }, [data, onUpdate]);

    const getOptions = (field: string) => {
      switch (field) {
        case 'religion':
          return RELIGION_OPTIONS;
        case 'smoking':
          return SMOKING_OPTIONS;
        case 'drinking':
          return DRINKING_OPTIONS;
        case 'independence':
          return INDEPENDENCE_OPTIONS;
        default:
          return [];
      }
    };

    const getFieldLabel = (field: string) => {
      switch (field) {
        case 'religion':
          return 'Tôn giáo';
        case 'smoking':
          return 'Hút thuốc';
        case 'drinking':
          return 'Uống rượu';
        case 'independence':
          return 'Độc lập';
        default:
          return '';
      }
    };
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Lối sống</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Tôn giáo</Text>
          <Pressable 
            style={styles.value}
            onPress={() => setSelectedField('religion')}
          >
            <Text style={styles.valueText}>{data.religion || 'Chọn'}</Text>
            <Ionicons name="chevron-down" size={16} color={DATING_COLORS.light.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Hút thuốc</Text>
          <Pressable 
            style={styles.value}
            onPress={() => setSelectedField('smoking')}
          >
            <Text style={styles.valueText}>{data.smoking || 'Chọn'}</Text>
            <Ionicons name="chevron-down" size={16} color={DATING_COLORS.light.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Uống rượu</Text>
          <Pressable 
            style={styles.value}
            onPress={() => setSelectedField('drinking')}
          >
            <Text style={styles.valueText}>{data.drinking || 'Chọn'}</Text>
            <Ionicons name="chevron-down" size={16} color={DATING_COLORS.light.textSecondary} />
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Độc lập</Text>
          <Pressable 
            style={styles.value}
            onPress={() => setSelectedField('independence')}
          >
            <Text style={styles.valueText}>{data.independence || 'Chọn'}</Text>
            <Ionicons name="chevron-down" size={16} color={DATING_COLORS.light.textSecondary} />
          </Pressable>
        </View>

        {/* Modal Selection */}
        <Modal visible={selectedField !== null} transparent animationType="fade">
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{getFieldLabel(selectedField || '')}</Text>
              {getOptions(selectedField || '').map((option) => (
                <Pressable
                  key={option}
                  style={styles.modalOption}
                  onPress={() => handleSelectOption(selectedField || '', option)}
                >
                  <Text style={styles.modalOptionText}>{option}</Text>
                  {data[selectedField as keyof typeof data] === option && (
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
