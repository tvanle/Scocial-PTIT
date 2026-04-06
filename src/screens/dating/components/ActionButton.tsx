/**
 * Dating Action Button Component
 *
 * Circular action buttons với animations và haptic feedback
 * Variants: like, nope, superLike, boost, undo
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  StyleProp,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  BUTTON,
  SPRING,
  DURATION,
  HAPTIC,
} from '../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

type ActionButtonVariant = 'like' | 'nope' | 'superLike' | 'boost' | 'undo';
type ActionButtonSize = 'small' | 'medium' | 'large';

interface ActionButtonProps {
  variant: ActionButtonVariant;
  size?: ActionButtonSize;
  onPress: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}

// ═══════════════════════════════════════════════════════════════
// BUTTON CONFIG
// ═══════════════════════════════════════════════════════════════

const BUTTON_CONFIG: Record<
  ActionButtonVariant,
  {
    icon: string;
    defaultSize: ActionButtonSize;
    haptic: keyof typeof HAPTIC;
  }
> = {
  like: {
    icon: 'heart',
    defaultSize: 'large',
    haptic: 'like',
  },
  nope: {
    icon: 'close',
    defaultSize: 'large',
    haptic: 'nope',
  },
  superLike: {
    icon: 'star',
    defaultSize: 'medium',
    haptic: 'superLike',
  },
  boost: {
    icon: 'lightning-bolt',
    defaultSize: 'small',
    haptic: 'buttonPress',
  },
  undo: {
    icon: 'undo-variant',
    defaultSize: 'small',
    haptic: 'buttonPress',
  },
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

export const ActionButton: React.FC<ActionButtonProps> = ({
  variant,
  size,
  onPress,
  disabled = false,
  style,
  testID,
}) => {
  const { theme } = useDatingTheme();
  const config = BUTTON_CONFIG[variant];
  const buttonSize = size ?? config.defaultSize;
  const dimensions = BUTTON.action[buttonSize];

  // Animation values
  const scale = useSharedValue(1);
  const iconScale = useSharedValue(1);

  // Get colors based on variant
  const getColors = useCallback(() => {
    switch (variant) {
      case 'like':
        return {
          border: theme.semantic.like.main,
          icon: theme.semantic.like.main,
          activeBg: theme.semantic.like.main,
          glow: theme.glows.like,
        };
      case 'nope':
        return {
          border: theme.semantic.nope.main,
          icon: theme.semantic.nope.main,
          activeBg: theme.semantic.nope.main,
          glow: theme.glows.nope,
        };
      case 'superLike':
        return {
          border: theme.semantic.superLike.main,
          icon: theme.semantic.superLike.main,
          activeBg: theme.semantic.superLike.main,
          glow: theme.glows.superLike,
        };
      case 'boost':
        return {
          border: theme.semantic.boost.main,
          icon: theme.semantic.boost.main,
          activeBg: theme.semantic.boost.main,
          glow: theme.glows.boost,
        };
      case 'undo':
        return {
          border: theme.brand.primary,
          icon: theme.brand.primary,
          activeBg: theme.brand.primaryMuted,
          glow: null,
        };
      default:
        return {
          border: theme.border.medium,
          icon: theme.text.muted,
          activeBg: theme.bg.surface,
          glow: null,
        };
    }
  }, [variant, theme]);

  const colors = getColors();

  // Haptic feedback
  const triggerHaptic = useCallback(() => {
    const hapticType = HAPTIC[config.haptic];
    switch (hapticType) {
      case 'impactLight':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case 'impactMedium':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case 'impactHeavy':
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case 'notificationSuccess':
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case 'selectionChanged':
        Haptics.selectionAsync();
        break;
      default:
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [config.haptic]);

  // Press handler
  const handlePress = useCallback(() => {
    if (disabled) return;

    // Trigger haptic
    triggerHaptic();

    // Button press animation
    scale.value = withSequence(
      withTiming(0.92, { duration: DURATION.instant }),
      withSpring(1, SPRING.snappy),
    );

    // Icon pulse animation
    iconScale.value = withSequence(
      withTiming(1.3, { duration: 150 }),
      withSpring(1, SPRING.bouncy),
    );

    // Execute callback
    runOnJS(onPress)();
  }, [disabled, triggerHaptic, scale, iconScale, onPress]);

  // Animated styles
  const animatedButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconScale.value }],
  }));

  return (
    <AnimatedTouchable
      style={[
        styles.button,
        {
          width: dimensions.size,
          height: dimensions.size,
          borderColor: colors.border,
          backgroundColor: 'transparent',
        },
        colors.glow && !disabled ? colors.glow : null,
        animatedButtonStyle,
        disabled && styles.disabled,
        style,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`${variant} button`}
    >
      <Animated.View style={animatedIconStyle}>
        <MaterialCommunityIcons
          name={config.icon as any}
          size={dimensions.iconSize}
          color={disabled ? theme.text.disabled : colors.icon}
        />
      </Animated.View>
    </AnimatedTouchable>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  button: {
    borderRadius: 9999,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabled: {
    opacity: 0.4,
  },
});

export default ActionButton;
