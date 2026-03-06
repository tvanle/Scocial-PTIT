import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { IconGlow } from './IconGlow';

const { primary } = DATING_COLORS;
const logoLayout = DATING_LAYOUT.splash.logo;

interface AnimatedLogoProps {
  animatedStyle: AnimatedStyle<ViewStyle>;
  surfaceColor: string;
  glowColor: string;
}

export const AnimatedLogo: React.FC<AnimatedLogoProps> = ({
  animatedStyle,
  surfaceColor,
  glowColor,
}) => {
  return (
    <Animated.View style={[styles.iconContainerWrapper, animatedStyle]}>
      <IconGlow glowColor={glowColor} size={logoLayout.glowSize} />
      <View style={[styles.iconSurface, { backgroundColor: surfaceColor }]}>
        <MaterialIcons name="favorite-border" size={100} color={primary} />
        <View style={[styles.badgeContainer, { borderColor: surfaceColor }]}>
          <MaterialIcons name="star-border" size={24} color={DATING_COLORS.splash.buttonText} />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconContainerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: logoLayout.surfacePadding,
  },
  iconSurface: {
    padding: logoLayout.surfacePadding,
    borderRadius: logoLayout.surfaceBorderRadius,
    ...Platform.select({
      ios: {
        shadowColor: primary,
        shadowOffset: { width: 0, height: logoLayout.shadowOffsetY },
        shadowOpacity: logoLayout.shadowOpacity,
        shadowRadius: logoLayout.shadowRadius,
      },
      android: {
        elevation: logoLayout.elevation,
        shadowColor: primary,
      },
    }),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeContainer: {
    position: 'absolute',
    top: logoLayout.badgePosition,
    right: logoLayout.badgePosition,
    backgroundColor: primary,
    width: logoLayout.badgeSize,
    height: logoLayout.badgeSize,
    borderRadius: logoLayout.badgeSize / 2,
    borderWidth: logoLayout.badgeBorderWidth,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

