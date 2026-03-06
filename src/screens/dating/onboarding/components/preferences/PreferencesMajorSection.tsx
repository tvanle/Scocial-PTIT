import React, { useCallback, useEffect, useState } from 'react';
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
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { DATING_MAJOR_OPTIONS } from '../../../../../constants/dating/majors';
import { usePressScale } from '../../../hooks';

const layout = DATING_LAYOUT.preferences.major;
const anim = DATING_LAYOUT.preferences.animation;
const colors = DATING_COLORS.preferences;

const SHEET_OFFSET = 400;

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
  const overlayOpacity = useSharedValue(0);
  const sheetTranslateY = useSharedValue(SHEET_OFFSET);

  const availableMajors = DATING_MAJOR_OPTIONS.filter((m) => !selectedMajors.includes(m));

  const { animatedStyle: buttonAnimatedStyle, handlePressIn, handlePressOut } = usePressScale({
    scaleDown: 0.98,
  });

  useEffect(() => {
    if (modalVisible) {
      overlayOpacity.value = withTiming(1, { duration: anim.modalOverlayDuration });
      sheetTranslateY.value = withSpring(0, {
        damping: anim.modalSheetDamping,
        stiffness: anim.modalSheetStiffness,
      });
    } else {
      overlayOpacity.value = 0;
      sheetTranslateY.value = SHEET_OFFSET;
    }
  }, [modalVisible, overlayOpacity, sheetTranslateY]);

  const handleOpenModal = useCallback(() => {
    setModalVisible(true);
  }, []);

  const finishClose = useCallback(() => {
    setModalVisible(false);
    onPickerChange('');
  }, [onPickerChange]);

  const handleCloseModal = useCallback(() => {
    overlayOpacity.value = withTiming(0, { duration: anim.modalOverlayDuration });
    sheetTranslateY.value = withTiming(SHEET_OFFSET, { duration: anim.modalSheetDuration }, () => {
      runOnJS(finishClose)();
    });
  }, [finishClose, overlayOpacity, sheetTranslateY]);

  const handleSelectMajor = useCallback(
    (major: string) => {
      onAddMajor(major);
      overlayOpacity.value = withTiming(0, { duration: anim.modalOverlayDuration });
      sheetTranslateY.value = withTiming(SHEET_OFFSET, { duration: anim.modalSheetDuration }, () => {
        runOnJS(finishClose)();
      });
    },
    [onAddMajor, finishClose, overlayOpacity, sheetTranslateY]
  );

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }],
  }));

  return (
    <View style={[styles.section, { marginBottom: DATING_LAYOUT.preferences.content.sectionMarginBottom }]}>
      <Text style={[styles.label, { fontSize: layout.labelFontSize, color: colors.sectionTitle }]}>
        {DATING_STRINGS.preferencesPreferredMajors}
      </Text>

      <Pressable
        onPress={handleOpenModal}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={DATING_STRINGS.preferencesPreferredMajors}
      >
        <Animated.View style={[styles.selectButton, buttonAnimatedStyle]}>
          <MaterialIcons name="school" size={layout.iconLeftSize} color={colors.sectionHint} />
          <Text style={[styles.selectButtonText, { color: colors.sectionTitle }]}>
            {DATING_STRINGS.preferencesSelectMajor}
          </Text>
          <MaterialIcons name="keyboard-arrow-down" size={layout.iconRightSize} color={colors.sectionHint} />
        </Animated.View>
      </Pressable>

      <Modal
        visible={modalVisible}
        transparent
        animationType="none"
        onRequestClose={handleCloseModal}
        statusBarTranslucent
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleCloseModal}>
          <Animated.View style={[styles.modalOverlay, overlayAnimatedStyle]} />
        </Pressable>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalContentWrap}
          pointerEvents="box-none"
        >
          <Animated.View style={[styles.modalContent, sheetAnimatedStyle]}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { fontSize: layout.modalTitleFontSize, color: colors.sectionTitle }]}>
                  {DATING_STRINGS.preferencesPreferredMajors}
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
                    {DATING_STRINGS.preferencesAllMajorsSelected}
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
          </Animated.View>
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
                accessibilityLabel={DATING_STRINGS.preferencesRemoveMajor(m)}
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
