import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import Animated from 'react-native-reanimated';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import type { StyleProp, ViewStyle } from 'react-native';

interface ProfileSetupBottomBarProps {
  onContinue: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  animatedButtonStyle: StyleProp<ViewStyle>;
}

const layout = DATING_LAYOUT.profileSetup.bottomBar;
const colors = DATING_COLORS.profileSetup;

export const ProfileSetupBottomBar: React.FC<ProfileSetupBottomBarProps> = ({
  onContinue,
  onPressIn,
  onPressOut,
  animatedButtonStyle,
}) => (
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
    <Pressable onPress={onContinue} onPressIn={onPressIn} onPressOut={onPressOut}>
      <Animated.View
        style={[
          styles.continueButton,
          animatedButtonStyle,
          {
            height: layout.buttonHeight,
            borderRadius: layout.buttonBorderRadius,
            shadowOpacity: layout.shadowOpacity,
            shadowRadius: layout.shadowRadius,
            elevation: layout.elevation,
            backgroundColor: DATING_COLORS.primary,
          },
        ]}
      >
        <Text style={[styles.continueButtonText, { color: colors.buttonText }]}>
          {DATING_STRINGS.profileSetup.continue}
        </Text>
      </Animated.View>
    </Pressable>
  </View>
);

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
