/**
 * Dating Swipeable Card
 *
 * Core swipe component với gesture handling
 * - Swipe left = Nope
 * - Swipe right = Like
 */

import React, { useImperativeHandle, forwardRef } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  CARD,
  SWIPE,
  SPRING,
  DURATION,
} from '../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type SwipeDirection = 'left' | 'right' | 'up' | 'none';

export interface SwipeableCardRef {
  swipeLeft: () => void;
  swipeRight: () => void;
  resetPosition: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  onSwipe: (direction: SwipeDirection) => void;
  onSwipeUp?: () => void;
  onTap?: () => void;
  disabled?: boolean;
  index?: number;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_OUT_POSITION = SCREEN_WIDTH * 1.5;

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const SwipeableCard = forwardRef<SwipeableCardRef, SwipeableCardProps>(
  (
    {
      children,
      onSwipe,
      onSwipeUp,
      onTap,
      disabled = false,
      index = 0,
    },
    ref,
  ) => {
    const { theme } = useDatingTheme();

    // Animation values
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
      swipeLeft: () => {
        translateX.value = withTiming(-CARD_OUT_POSITION, { duration: DURATION.normal }, () => {
          runOnJS(onSwipe)('left');
        });
      },
      swipeRight: () => {
        translateX.value = withTiming(CARD_OUT_POSITION, { duration: DURATION.normal }, () => {
          runOnJS(onSwipe)('right');
        });
      },
      resetPosition: () => {
        translateX.value = withSpring(0, SPRING.cardReturn);
        translateY.value = withSpring(0, SPRING.cardReturn);
      },
    }));

    // Tap gesture for viewing profile
    const tapGesture = Gesture.Tap()
      .enabled(!disabled)
      .onEnd(() => {
        if (onTap) {
          runOnJS(onTap)();
        }
      });

    // Pan gesture
    const panGesture = Gesture.Pan()
      .enabled(!disabled)
      .onUpdate((event) => {
        translateX.value = event.translationX;
        translateY.value = event.translationY;
      })
      .onEnd((event) => {
        const { translationX, translationY, velocityX } = event;

        // Check swipe up (view profile)
        if (translationY < -80 && onSwipeUp) {
          runOnJS(onSwipeUp)();
          translateX.value = withSpring(0, SPRING.cardReturn);
          translateY.value = withSpring(0, SPRING.cardReturn);
          return;
        }

        // Check horizontal swipe
        const swipedRight = translationX > SWIPE.threshold || velocityX > SWIPE.velocityThreshold;
        const swipedLeft = translationX < -SWIPE.threshold || velocityX < -SWIPE.velocityThreshold;

        if (swipedRight) {
          translateX.value = withTiming(CARD_OUT_POSITION, { duration: DURATION.normal }, () => {
            runOnJS(onSwipe)('right');
          });
        } else if (swipedLeft) {
          translateX.value = withTiming(-CARD_OUT_POSITION, { duration: DURATION.normal }, () => {
            runOnJS(onSwipe)('left');
          });
        } else {
          translateX.value = withSpring(0, SPRING.cardReturn);
          translateY.value = withSpring(0, SPRING.cardReturn);
        }
      });

    // Combine gestures - tap should work when not dragging
    const combinedGesture = Gesture.Race(tapGesture, panGesture);

    // Animated card style with rotation
    const animatedCardStyle = useAnimatedStyle(() => {
      const rotate = interpolate(
        translateX.value,
        [-200, 0, 200],
        [-12, 0, 12],
        Extrapolation.CLAMP,
      );

      return {
        transform: [
          { translateX: translateX.value },
          { translateY: translateY.value },
          { rotate: `${rotate}deg` },
        ],
      };
    });

    return (
      <GestureDetector gesture={combinedGesture}>
        <Animated.View
          style={[
            styles.card,
            { backgroundColor: theme.bg.elevated },
            animatedCardStyle,
          ]}
        >
          {children}
        </Animated.View>
      </GestureDetector>
    );
  },
);

SwipeableCard.displayName = 'SwipeableCard';

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  card: {
    width: CARD.discovery.width,
    aspectRatio: CARD.discovery.aspectRatio,
    borderRadius: CARD.discovery.borderRadius,
    overflow: 'hidden',
  },
});

export default SwipeableCard;
