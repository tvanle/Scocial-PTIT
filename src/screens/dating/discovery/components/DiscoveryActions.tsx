import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery.actions;
const strings = DATING_STRINGS.discovery;

interface DiscoveryActionsProps {
  onSkip?: () => void;
  onLike?: () => void;
}

export const DiscoveryActions = React.memo<DiscoveryActionsProps>(({ onSkip, onLike }) => (
  <View style={styles.container}>
    <TouchableOpacity
      style={[styles.btn, styles.btnShadow, styles.skipBtn]}
      activeOpacity={0.8}
      onPress={onSkip}
      accessibilityRole="button"
      accessibilityLabel={strings.actionSkipLabel}
      accessibilityHint={strings.actionSkipHint}
    >
      <MaterialIcons name="close" size={layout.skipIconSize} color={colors.skipIcon} />
    </TouchableOpacity>

    <TouchableOpacity
      style={[styles.btn, styles.heartShadow, styles.likeBtn]}
      activeOpacity={0.85}
      onPress={onLike}
      accessibilityRole="button"
      accessibilityLabel={strings.actionLikeLabel}
      accessibilityHint={strings.actionLikeHint}
    >
      <MaterialIcons name="favorite" size={layout.starIconSize} color={colors.starIcon} />
    </TouchableOpacity>
  </View>
));

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.gap,
    paddingBottom: layout.paddingBottom,
    paddingTop: layout.paddingTop,
  },
  btn: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  skipBtn: {
    width: layout.skipSize,
    height: layout.skipSize,
    backgroundColor: colors.skipBtnBg,
    borderColor: colors.skipBtnBorder,
  },
  likeBtn: {
    width: layout.starSize,
    height: layout.starSize,
    backgroundColor: colors.starBtnBg,
  },
  btnShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  heartShadow: {
    ...Platform.select({
      ios: {
        shadowColor: colors.starBtnShadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 25,
      },
      android: { elevation: 10 },
    }),
  },
});
