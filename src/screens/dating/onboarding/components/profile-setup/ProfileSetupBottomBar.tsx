import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating';
import type { StyleProp, ViewStyle } from 'react-native';

interface ProfileSetupBottomBarProps {
  onContinue: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  animatedButtonStyle: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  hint?: string | null;
   label?: string;
}

const layout = DATING_LAYOUT.profileSetup.bottomBar;
const colors = DATING_COLORS.profileSetup;

export const ProfileSetupBottomBar: React.FC<ProfileSetupBottomBarProps> = ({
  onContinue,
  onPressIn,
  onPressOut,
  animatedButtonStyle,
  loading = false,
  disabled = false,
  hint = null,
  label,
}) => {
  const isInactive = loading || disabled;

  return (
    <View
      style={[
        styles.bottomBar,
        {
          paddingHorizontal: layout.paddingHorizontal,
          paddingTop: layout.paddingTop,
          paddingBottom: layout.paddingBottom + layout.safeAreaBottom,
          backgroundColor: colors.bottomBarBg,
          borderTopColor: colors.bottomBarBorder,
        },
      ]}
    >
      {hint && (
        <Text style={styles.hint}>{hint}</Text>
      )}
      <Pressable
        onPress={onContinue}
        onPressIn={isInactive ? undefined : onPressIn}
        onPressOut={isInactive ? undefined : onPressOut}
        disabled={isInactive}
      >
        <Animated.View
          style={[
            styles.continueButton,
            animatedButtonStyle,
            {
              height: layout.buttonHeight,
              borderRadius: layout.buttonBorderRadius,
              shadowOpacity: isInactive ? 0 : layout.shadowOpacity,
              shadowRadius: layout.shadowRadius,
              elevation: isInactive ? 0 : layout.elevation,
              backgroundColor: isInactive ? '#ccc' : DATING_COLORS.primary,
            },
          ]}
        >
          {loading ? (
            <ActivityIndicator color={colors.buttonText} />
          ) : (
            <Text style={[styles.continueButtonText, { color: colors.buttonText }]}>
              {label ?? DATING_STRINGS.profileSetup.continue}
            </Text>
          )}
        </Animated.View>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    borderTopWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
      },
    }),
  },
  hint: {
    fontSize: 13,
    color: DATING_COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: '500',
  },
  continueButton: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: DATING_COLORS.primary,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  continueButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
});
