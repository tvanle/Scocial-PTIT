/**
 * Dating Profile Detail Action Bar
 *
 * Modern floating action bar với glass effect và animated buttons
 */

import React, { useCallback } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useDatingTheme } from '../../../../contexts/DatingThemeContext';
import { SPACING, RADIUS } from '../../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const BUTTON_SIZES = {
  small: { size: 52, iconSize: 22 },
  large: { size: 64, iconSize: 28 },
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DetailActionBarProps {
  onSkip: () => void;
  onSuperLike?: () => void;
  onLike: () => void;
  disabled?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// ACTION BUTTON COMPONENT
// ═══════════════════════════════════════════════════════════════

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

interface ActionBtnProps {
  icon: string;
  size: 'small' | 'large';
  color: string;
  bgColor: string;
  glowColor?: string;
  onPress: () => void;
  disabled?: boolean;
  hapticStyle?: 'light' | 'medium' | 'heavy' | 'success';
}

const ActionBtn: React.FC<ActionBtnProps> = ({
  icon,
  size,
  color,
  bgColor,
  glowColor,
  onPress,
  disabled,
  hapticStyle = 'medium',
}) => {
  const { theme } = useDatingTheme();
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);
  const dimensions = BUTTON_SIZES[size];

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(0.9, { damping: 15, stiffness: 400 });
  }, []);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, { damping: 15, stiffness: 400 });
  }, []);

  const handlePress = useCallback(() => {
    if (disabled) return;

    // Haptic feedback
    switch (hapticStyle) {
      case 'light':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'heavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'success':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    // Icon bounce animation
    iconScale.value = withSequence(
      withTiming(1.3, { duration: 120 }),
      withSpring(1, { damping: 8, stiffness: 200 }),
    );

    runOnJS(onPress)();
  }, [disabled, hapticStyle, iconScale, onPress]);

  const animatedBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  const shadowStyle = glowColor ? {
    shadowColor: glowColor,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  } : {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  };

  return (
    <AnimatedTouchable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      activeOpacity={1}
      disabled={disabled}
      style={[
        styles.actionBtn,
        {
          width: dimensions.size,
          height: dimensions.size,
          backgroundColor: bgColor,
          borderColor: size === 'small' ? theme.border.subtle : 'transparent',
          borderWidth: size === 'small' ? 1 : 0,
        },
        shadowStyle,
        animatedBtnStyle,
        disabled && styles.disabled,
      ]}
    >
      <Animated.View style={animatedIconStyle}>
        <MaterialCommunityIcons
          name={icon as any}
          size={dimensions.iconSize}
          color={disabled ? theme.text.disabled : color}
        />
      </Animated.View>
    </AnimatedTouchable>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DetailActionBar = React.memo<DetailActionBarProps>(({
  onSkip,
  onSuperLike,
  onLike,
  disabled,
}) => {
  const { theme, isDark } = useDatingTheme();
  const insets = useSafeAreaInsets();
  const paddingBottom = Math.max(insets.bottom + SPACING.sm, SPACING.xl);

  const content = (
    <View style={[styles.content, { paddingBottom }]}>
      {/* Skip/Nope Button */}
      <ActionBtn
        icon="close"
        size="large"
        color={theme.semantic.nope.main}
        bgColor={isDark ? theme.bg.elevated : theme.bg.base}
        onPress={onSkip}
        disabled={disabled}
        hapticStyle="light"
      />

      {/* Super Like Button (optional) */}
      {onSuperLike && (
        <ActionBtn
          icon="star"
          size="small"
          color={theme.semantic.superLike.main}
          bgColor={isDark ? theme.bg.elevated : theme.bg.base}
          glowColor={theme.semantic.superLike.main}
          onPress={onSuperLike}
          disabled={disabled}
          hapticStyle="success"
        />
      )}

      {/* Like/Heart Button */}
      <ActionBtn
        icon="heart"
        size="large"
        color="#FFFFFF"
        bgColor={theme.semantic.like.main}
        glowColor={theme.semantic.like.main}
        onPress={onLike}
        disabled={disabled}
        hapticStyle="success"
      />
    </View>
  );

  // iOS: Glass effect
  if (Platform.OS === 'ios') {
    return (
      <View style={styles.container}>
        <BlurView
          style={StyleSheet.absoluteFill}
          intensity={isDark ? 40 : 80}
          tint={isDark ? 'dark' : 'light'}
        />
        <View
          style={[
            styles.overlay,
            { backgroundColor: isDark ? 'rgba(13,13,13,0.6)' : 'rgba(255,255,255,0.75)' },
          ]}
        />
        <View style={[styles.topBorder, { backgroundColor: theme.border.subtle }]} />
        {content}
      </View>
    );
  }

  // Android: Solid background with elevation
  return (
    <View
      style={[
        styles.container,
        styles.androidShadow,
        { backgroundColor: isDark ? theme.bg.elevated : theme.bg.base },
      ]}
    >
      <View style={[styles.topBorder, { backgroundColor: theme.border.subtle }]} />
      {content}
    </View>
  );
});

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    overflow: 'hidden',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  topBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: StyleSheet.hairlineWidth,
  },
  androidShadow: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 12,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.lg,
    gap: SPACING.lg,
  },
  actionBtn: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});

export default DetailActionBar;
