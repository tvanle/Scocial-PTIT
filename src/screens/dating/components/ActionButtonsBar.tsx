/**
 * Dating Action Buttons Bar
 *
 * Container cho các action buttons: Undo, Nope, SuperLike, Like, Boost
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';

import { ActionButton } from './ActionButton';
import { ACTION_BAR, SPACING } from '../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ActionButtonsBarProps {
  onUndo?: () => void;
  onNope: () => void;
  onSuperLike?: () => void;
  onLike: () => void;
  onBoost?: () => void;
  disableUndo?: boolean;
  disableSuperLike?: boolean;
  disableBoost?: boolean;
  isProcessing?: boolean;
  style?: StyleProp<ViewStyle>;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const ActionButtonsBar: React.FC<ActionButtonsBarProps> = ({
  onUndo,
  onNope,
  onSuperLike,
  onLike,
  onBoost,
  disableUndo = false,
  disableSuperLike = false,
  disableBoost = false,
  isProcessing = false,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      {/* Undo - Small, left */}
      {onUndo && (
        <ActionButton
          variant="undo"
          size="small"
          onPress={onUndo}
          disabled={disableUndo || isProcessing}
          testID="action-undo"
        />
      )}

      {/* Nope - Large */}
      <ActionButton
        variant="nope"
        size="large"
        onPress={onNope}
        disabled={isProcessing}
        testID="action-nope"
      />

      {/* Super Like - Medium */}
      {onSuperLike && (
        <ActionButton
          variant="superLike"
          size="medium"
          onPress={onSuperLike}
          disabled={disableSuperLike || isProcessing}
          testID="action-superlike"
        />
      )}

      {/* Like - Large */}
      <ActionButton
        variant="like"
        size="large"
        onPress={onLike}
        disabled={isProcessing}
        testID="action-like"
      />

      {/* Boost - Small, right */}
      {onBoost && (
        <ActionButton
          variant="boost"
          size="small"
          onPress={onBoost}
          disabled={disableBoost || isProcessing}
          testID="action-boost"
        />
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: ACTION_BAR.height,
    paddingHorizontal: ACTION_BAR.paddingHorizontal,
    paddingTop: ACTION_BAR.paddingTop,
    paddingBottom: ACTION_BAR.paddingBottom,
    gap: SPACING.md,
  },
});

export default ActionButtonsBar;
