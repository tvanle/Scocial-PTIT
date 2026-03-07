import React from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS, SPRING_BUTTON, PRESS_SCALE_DOWN } from '../../../../../constants/dating';

const layout = DATING_LAYOUT.preferences.bottomBar;

interface PreferencesBottomBarProps {
  onFinish: () => void;
  loading?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export const PreferencesBottomBar: React.FC<PreferencesBottomBarProps> = ({ onFinish, loading = false }) => {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(PRESS_SCALE_DOWN, SPRING_BUTTON);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, SPRING_BUTTON);
  };

  return (
    <View style={[styles.wrapper, { paddingHorizontal: layout.paddingHorizontal }]}>
      <View style={[styles.gradient, { paddingTop: layout.paddingTop, paddingBottom: layout.paddingBottom }]}>
        <AnimatedPressable
          style={[styles.button, animatedStyle, loading && { opacity: 0.7 }]}
          onPress={onFinish}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={DATING_STRINGS.preferences.finish}
        >
          {loading ? (
            <ActivityIndicator color={DATING_COLORS.preferences.buttonText} />
          ) : (
            <>
              <Text style={styles.buttonText}>{DATING_STRINGS.preferences.finish}</Text>
              <MaterialIcons
                name="check-circle"
                size={layout.buttonIconSize}
                color={DATING_COLORS.preferences.buttonText}
              />
            </>
          )}
        </AnimatedPressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  gradient: {
    backgroundColor: DATING_COLORS.preferences.background,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: layout.buttonGap,
    height: layout.buttonHeight,
    borderRadius: layout.buttonBorderRadius,
    backgroundColor: DATING_COLORS.primary,
    shadowColor: DATING_COLORS.primary,
    shadowOffset: { width: 0, height: layout.shadowOffsetY },
    shadowOpacity: layout.shadowOpacity,
    shadowRadius: layout.shadowRadius,
    elevation: layout.elevation,
  },
  buttonText: {
    fontSize: layout.buttonFontSize,
    fontWeight: '700',
    color: DATING_COLORS.preferences.buttonText,
  },
});
