import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_LAYOUT, DATING_STRINGS } from '../../../../../constants/dating';
import { BRAND } from '../../../../../constants/dating/design-system/colors';
import { useDatingTheme } from '../../../../../contexts/DatingThemeContext';

interface PreferencesMajorSectionProps {
  selectedMajors: string[];
  onAddMajor: (major: string) => void;
  onRemoveMajor: (major: string) => void;
  pickerValue: string;
  onPickerChange: (value: string) => void;
}

export const PreferencesMajorSection: React.FC<PreferencesMajorSectionProps> = ({
  selectedMajors,
  onAddMajor,
  onRemoveMajor,
  onPickerChange,
}) => {
  const { theme } = useDatingTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const availableMajors = DATING_STRINGS.preferences.majorOptions.filter((m) => !selectedMajors.includes(m));

  const handleOpenModal = useCallback(() => setModalVisible(true), []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    onPickerChange('');
  }, [onPickerChange]);

  const handleSelectMajor = useCallback(
    (major: string) => {
      onAddMajor(major);
      setModalVisible(false);
      onPickerChange('');
    },
    [onAddMajor, onPickerChange]
  );

  return (
    <View style={[styles.card, { backgroundColor: theme.bg.card }]}>
      <View style={styles.headerRow}>
        <View style={[styles.iconWrap, { backgroundColor: theme.brand.primaryMuted }]}>
          <MaterialIcons name="school" size={20} color={theme.brand.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.text.primary }]}>Preferred Majors</Text>
          <Text style={[styles.hint, { color: theme.text.secondary }]}>Find people from specific fields of study</Text>
        </View>
      </View>

      <Pressable
        onPress={handleOpenModal}
        accessibilityRole="button"
        style={({ pressed }) => [
          styles.selectButton,
          { backgroundColor: theme.bg.elevated, borderColor: theme.border.light },
          pressed && [styles.selectButtonPressed, { backgroundColor: theme.bg.base, borderColor: theme.brand.primary }],
        ]}
      >
        <MaterialIcons name="add-circle-outline" size={20} color={theme.brand.primary} />
        <Text style={[styles.selectButtonText, { color: theme.text.secondary }]}>Add major preference</Text>
        <MaterialIcons name="chevron-right" size={24} color={theme.text.tertiary} />
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
        statusBarTranslucent
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseModal}>
          <View style={styles.modalOverlay} />
        </Pressable>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContentWrap}
          pointerEvents="box-none"
        >
          <View style={[styles.modalContent, { backgroundColor: theme.bg.card }]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={[styles.modalHandle, { backgroundColor: theme.border.light }]} />
              <View style={[styles.modalHeader, { borderBottomColor: theme.border.light }]}>
                <Text style={[styles.modalTitle, { color: theme.text.primary }]}>Select Major</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  hitSlop={16}
                  style={[styles.closeButton, { backgroundColor: theme.bg.elevated }]}
                >
                  <MaterialIcons name="close" size={20} color={theme.text.secondary} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalList}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {availableMajors.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="check-circle" size={48} color={theme.brand.primary} />
                    <Text style={[styles.emptyTitle, { color: theme.text.primary }]}>All majors selected!</Text>
                    <Text style={[styles.emptyText, { color: theme.text.secondary }]}>You've added all available majors</Text>
                  </View>
                ) : (
                  availableMajors.map((m, index) => (
                    <Pressable
                      key={m}
                      style={({ pressed }) => [
                        styles.modalRow,
                        { borderBottomColor: theme.border.light },
                        pressed && { backgroundColor: theme.bg.elevated },
                        index === availableMajors.length - 1 && styles.modalRowLast,
                      ]}
                      onPress={() => handleSelectMajor(m)}
                    >
                      <View style={[styles.modalRowIcon, { backgroundColor: theme.bg.elevated }]}>
                        <MaterialIcons name="school" size={18} color={theme.text.secondary} />
                      </View>
                      <Text style={[styles.modalRowText, { color: theme.text.primary }]} numberOfLines={1}>{m}</Text>
                      <View style={[styles.addIconWrap, { backgroundColor: theme.brand.primaryMuted }]}>
                        <MaterialIcons name="add" size={18} color={theme.brand.primary} />
                      </View>
                    </Pressable>
                  ))
                )}
              </ScrollView>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {selectedMajors.length > 0 && (
        <View style={styles.chips}>
          {selectedMajors.map((m) => (
            <View style={[styles.chip, { backgroundColor: theme.brand.primary }]} key={m}>
              <Text style={styles.chipText} numberOfLines={1}>{m}</Text>
              <TouchableOpacity
                onPress={() => onRemoveMajor(m)}
                hitSlop={12}
                style={styles.chipRemove}
              >
                <MaterialIcons name="close" size={14} color="#fff" />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 18,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1.5,
  },
  selectButtonPressed: {},
  selectButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContentWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalList: {
    maxHeight: 400,
  },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  modalRowLast: {
    borderBottomWidth: 0,
  },
  modalRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
  },
  addIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
    gap: 12,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '700',
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 16,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#fff',
    maxWidth: 150,
  },
  chipRemove: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
