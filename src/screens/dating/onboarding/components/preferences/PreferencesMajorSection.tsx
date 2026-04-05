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
import { DATING_COLORS, DATING_LAYOUT, DATING_STRINGS } from '../../../../../constants/dating';
import { BRAND } from '../../../../../constants/dating/design-system/colors';

const layout = DATING_LAYOUT.preferences.major;
const colors = DATING_COLORS.preferences;

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
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="school" size={20} color={BRAND.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Preferred Majors</Text>
          <Text style={styles.hint}>Find people from specific fields of study</Text>
        </View>
      </View>

      <Pressable
        onPress={handleOpenModal}
        accessibilityRole="button"
        style={({ pressed }) => [styles.selectButton, pressed && styles.selectButtonPressed]}
      >
        <MaterialIcons name="add-circle-outline" size={20} color={BRAND.primary} />
        <Text style={styles.selectButtonText}>Add major preference</Text>
        <MaterialIcons name="chevron-right" size={24} color="#999" />
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
          <View style={styles.modalContent}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHandle} />
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Select Major</Text>
                <TouchableOpacity
                  onPress={handleCloseModal}
                  hitSlop={16}
                  style={styles.closeButton}
                >
                  <MaterialIcons name="close" size={20} color="#666" />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={styles.modalList}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {availableMajors.length === 0 ? (
                  <View style={styles.emptyState}>
                    <MaterialIcons name="check-circle" size={48} color={BRAND.primary} />
                    <Text style={styles.emptyTitle}>All majors selected!</Text>
                    <Text style={styles.emptyText}>You've added all available majors</Text>
                  </View>
                ) : (
                  availableMajors.map((m, index) => (
                    <Pressable
                      key={m}
                      style={({ pressed }) => [
                        styles.modalRow,
                        pressed && styles.modalRowPressed,
                        index === availableMajors.length - 1 && styles.modalRowLast,
                      ]}
                      onPress={() => handleSelectMajor(m)}
                    >
                      <View style={styles.modalRowIcon}>
                        <MaterialIcons name="school" size={18} color="#666" />
                      </View>
                      <Text style={styles.modalRowText} numberOfLines={1}>{m}</Text>
                      <View style={styles.addIconWrap}>
                        <MaterialIcons name="add" size={18} color={BRAND.primary} />
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
            <View style={styles.chip} key={m}>
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
    backgroundColor: '#fff',
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
    backgroundColor: BRAND.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F7F7',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
  },
  selectButtonPressed: {
    backgroundColor: '#F0F0F0',
    borderColor: BRAND.primary,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#666',
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
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    maxHeight: '70%',
  },
  modalHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E0E0E0',
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
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F0F0F0',
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
    borderBottomColor: '#F5F5F5',
  },
  modalRowPressed: {
    backgroundColor: '#F7F7F7',
  },
  modalRowLast: {
    borderBottomWidth: 0,
  },
  modalRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalRowText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1A',
  },
  addIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: BRAND.primaryMuted,
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
    color: '#1A1A1A',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
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
    backgroundColor: BRAND.primary,
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
