import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';

const colors = DATING_COLORS.preferences;
const majorOptions = DATING_STRINGS.preferences.majorOptions;
const noMajorOption = DATING_STRINGS.preferences.noMajorOption;
const selectMajor = DATING_STRINGS.preferences.selectMajor;
const CHECK_ICON_SIZE = 22;

interface MajorDropdownBlockProps {
  value: string | null;
  onChange: (major: string | null) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const MajorDropdownBlock = React.memo<MajorDropdownBlockProps>(
  ({ value, onChange, open, onOpenChange }) => (
    <View style={styles.wrap}>
      <TouchableOpacity
        style={styles.trigger}
        onPress={() => onOpenChange(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.triggerText} numberOfLines={1}>
          {value ?? selectMajor}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={24} color={colors.sectionHint} />
      </TouchableOpacity>
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => onOpenChange(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => onOpenChange(false)} />
          <View style={styles.modalContent}>
            <ScrollView style={styles.modalScroll} keyboardShouldPersistTaps="handled">
              <Pressable
                style={styles.modalRow}
                onPress={() => {
                  onChange(null);
                  onOpenChange(false);
                }}
              >
                <Text style={styles.modalRowText}>{noMajorOption}</Text>
              </Pressable>
              {majorOptions.map((m) => (
                <Pressable
                  key={m}
                  style={[styles.modalRow, value === m && styles.modalRowSelected]}
                  onPress={() => {
                    onChange(m);
                    onOpenChange(false);
                  }}
                >
                  <Text style={styles.modalRowText}>{m}</Text>
                  {value === m && (
                    <MaterialIcons name="check" size={CHECK_ICON_SIZE} color={DATING_COLORS.primary} />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
);

const styles = StyleSheet.create({
  wrap: { marginTop: 4 },
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    backgroundColor: colors.selectBg,
  },
  triggerText: {
    flex: 1,
    fontSize: 15,
    color: colors.sectionTitle,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    maxHeight: '50%',
    backgroundColor: colors.background,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 24,
  },
  modalScroll: { maxHeight: 280 },
  modalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  modalRowSelected: { backgroundColor: colors.cardBg },
  modalRowText: {
    fontSize: 16,
    color: colors.sectionTitle,
  },
});
