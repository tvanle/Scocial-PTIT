import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { DATING_COLORS } from '../../../constants/dating/theme';

const colors = DATING_COLORS.preferences;
const FOOTER_GAP = 12;
const PADDING_H = 20;
const PADDING_V = 16;
const BUTTON_HEIGHT = 48;
const BORDER_RADIUS = 24;

interface FilterFormFooterProps {
  clearLabel: string;
  applyLabel: string;
  loading: boolean;
  onClear: () => void;
  onApply: () => void;
}

export const FilterFormFooter = React.memo<FilterFormFooterProps>(
  ({ clearLabel, applyLabel, loading, onClear, onApply }) => (
    <View style={styles.footer}>
      <Pressable style={styles.clearBtn} onPress={onClear} disabled={loading}>
        <Text style={styles.clearBtnText}>{clearLabel}</Text>
      </Pressable>
      <Pressable
        style={[styles.applyBtn, loading && styles.applyBtnDisabled]}
        onPress={onApply}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#fff" />
        ) : (
          <Text style={styles.applyBtnText}>{applyLabel}</Text>
        )}
      </Pressable>
    </View>
  )
);

const styles = StyleSheet.create({
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: FOOTER_GAP,
    paddingHorizontal: PADDING_H,
    paddingVertical: PADDING_V,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.cardBorder,
    backgroundColor: colors.background,
  },
  clearBtn: {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: BORDER_RADIUS,
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.sectionTitle,
  },
  applyBtn: {
    flex: 1,
    height: BUTTON_HEIGHT,
    borderRadius: BORDER_RADIUS,
    backgroundColor: DATING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnDisabled: { opacity: 0.7 },
  applyBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.buttonText,
  },
});
