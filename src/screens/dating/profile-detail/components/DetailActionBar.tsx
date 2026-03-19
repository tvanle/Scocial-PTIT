import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery.actions;

interface DetailActionBarProps {
  onSkip: () => void;
  onLike: () => void;
  disabled?: boolean;
}

export const DetailActionBar = React.memo<DetailActionBarProps>(({ onSkip, onLike, disabled }) => {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          gap: layout.gap,
          paddingTop: layout.paddingTop,
          paddingBottom: Math.max(insets.bottom, layout.paddingBottom),
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.btn,
          styles.btnShadow,
          {
            width: layout.skipSize,
            height: layout.skipSize,
            backgroundColor: colors.skipBtnBg,
            borderColor: colors.skipBtnBorder,
          },
        ]}
        onPress={onSkip}
        activeOpacity={0.8}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Skip profile"
      >
        <MaterialIcons name="close" size={layout.skipIconSize} color={colors.skipIcon} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.btn,
          styles.heartShadow,
          {
            width: layout.starSize,
            height: layout.starSize,
            backgroundColor: colors.starBtnBg,
          },
        ]}
        onPress={onLike}
        activeOpacity={0.85}
        disabled={disabled}
        accessibilityRole="button"
        accessibilityLabel="Like profile"
      >
        <MaterialIcons name="favorite" size={layout.starIconSize} color={colors.starIcon} />
      </TouchableOpacity>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
  },
  btn: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
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
