import React from 'react';
import { View, StyleSheet, Platform, type ViewStyle } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { DATING_COLORS } from '../../../../constants/dating/theme';
import { IconGlow } from './IconGlow';

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
      <IconGlow glowColor={glowColor} size={220} />
      <View style={[styles.iconSurface, { backgroundColor: surfaceColor }]}>
        <MaterialIcons name="favorite-border" size={100} color={DATING_COLORS.primary} />
        <View style={[styles.badgeContainer, { borderColor: surfaceColor }]}>
          <MaterialIcons name="star-border" size={24} color="#ffffff" />
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  iconContainerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 40,
  },
  iconSurface: {
    padding: 40,
    borderRadius: 40,
    ...Platform.select({
      ios: {
        shadowColor: '#FA4E57',
        shadowOffset: { width: 0, height: 16 },
        shadowOpacity: 0.15,
        shadowRadius: 32,
      },
      android: {
        elevation: 16,
        shadowColor: '#FA4E57',
      },
    }),
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1,
  },
  badgeContainer: {
    position: 'absolute',
    top: 24,
    right: 24,
    backgroundColor: DATING_COLORS.primary,
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
});

