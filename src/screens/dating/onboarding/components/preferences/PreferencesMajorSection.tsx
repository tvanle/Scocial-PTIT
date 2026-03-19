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
    <View style={[styles.section, { marginBottom: DATING_LAYOUT.preferences.content.sectionMarginBottom }]}>
      <Text style={[styles.label, { fontSize: layout.labelFontSize, color: colors.sectionTitle }]}>
        {DATING_STRINGS.preferences.preferredMajors}
      </Text>

      <Pressable
        onPress={handleOpenModal}
        accessibilityRole="button"
        accessibilityLabel={DATING_STRINGS.preferences.preferredMajors}
      >
        <View style={styles.selectButton}>
          <MaterialIcons name="school" size={layout.iconLeftSize} color={colors.sectionHint} />
          <Text style={[styles.selectButtonText, { color: colors.sectionTitle }]}>
            {DATING_STRINGS.preferences.selectMajor}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={layout.iconRightSize} color={colors.sectionHint} />
        </View>
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
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: layout.modalTitleFontSize, color: colors.sectionTitle }]}>
                  {DATING_STRINGS.preferences.preferredMajors}
                </Text>
                <TouchableOpacity onPress={handleCloseModal} hitSlop={16} accessibilityLabel="Close">
                  <MaterialIcons name="close" size={24} color={colors.sectionHint} />
                </TouchableOpacity>
              </View>
              <ScrollView
                style={[styles.modalList, { maxHeight: layout.modalMaxHeight }]}
                showsVerticalScrollIndicator={true}
                keyboardShouldPersistTaps="handled"
              >
                {availableMajors.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.sectionHint }]}>
                    {DATING_STRINGS.preferences.allMajorsSelected}
                  </Text>
                ) : (
                  availableMajors.map((m) => (
                    <Pressable
                      key={m}
                      style={({ pressed }) => [
                        styles.modalRow,
                        {
                          height: layout.modalRowHeight,
                          paddingHorizontal: layout.modalRowPaddingH,
                          backgroundColor: pressed ? colors.cardBg : 'transparent',
                        },
                      ]}
                      onPress={() => handleSelectMajor(m)}
                    >
                      <Text style={[styles.modalRowText, { color: colors.sectionTitle }]} numberOfLines={1}>
                        {m}
                      </Text>
                      <MaterialIcons name="add" size={22} color={DATING_COLORS.primary} />
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
            <View style={[styles.chip, { backgroundColor: colors.chipBg }]} key={m}>
              <Text style={styles.chipText} numberOfLines={1}>
                {m}
              </Text>
              <TouchableOpacity
                onPress={() => onRemoveMajor(m)}
                hitSlop={{
                  top: layout.removeHitSlop,
                  bottom: layout.removeHitSlop,
                  left: layout.removeHitSlop,
                  right: layout.removeHitSlop,
                }}
                accessibilityLabel={DATING_STRINGS.preferences.removeMajor(m)}
                accessibilityRole="button"
              >
                <MaterialIcons name="close" size={layout.chipIconSize} color={colors.chipText} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {},
  label: {
    fontWeight: '700',
    marginBottom: layout.labelMarginBottom,
  },
  selectButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.selectBg,
    borderRadius: layout.selectBorderRadius,
    paddingHorizontal: layout.selectPaddingH,
    minHeight: layout.selectMinHeight,
    gap: layout.iconGap,
  },
  selectButtonText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  modalContentWrap: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: DATING_COLORS.preferences.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.cardBorder,
  },
  modalTitle: {
    fontWeight: '700',
  },
  modalList: {},
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalRowText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  emptyText: {
    padding: 24,
    fontSize: 15,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: layout.chipGap,
    marginTop: layout.chipsMarginTop,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: layout.chipInnerGap,
    paddingHorizontal: layout.chipPaddingH,
    paddingVertical: layout.chipPaddingV,
    borderRadius: layout.chipBorderRadius,
  },
  chipText: {
    fontSize: layout.chipFontSize,
    fontWeight: '700',
    color: colors.chipText,
    maxWidth: layout.chipMaxWidth,
  },
});
