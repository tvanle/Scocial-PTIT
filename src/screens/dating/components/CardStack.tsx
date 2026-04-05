/**
 * Dating Card Stack
 *
 * Quản lý stack của nhiều cards với visual depth
 */

import React, { useCallback, useRef, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from 'react-native-reanimated';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { SwipeableCard, SwipeableCardRef, SwipeDirection } from './SwipeableCard';
import { ProfileCard, ProfileData } from './ProfileCard';
import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  STACK,
  CARD,
  SPRING,
  SPACING,
} from '../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface CardStackProps {
  profiles: ProfileData[];
  onSwipe: (profile: ProfileData, direction: SwipeDirection) => void;
  onSwipeUp?: (profile: ProfileData) => void;
  onCardPress?: (profile: ProfileData) => void;
  isProcessing?: boolean;
}

export interface CardStackRef {
  swipeLeft: () => void;
  swipeRight: () => void;
}

// ═══════════════════════════════════════════════════════════════
// STACKED CARD (with depth styling)
// ═══════════════════════════════════════════════════════════════

interface StackedCardProps {
  profile: ProfileData;
  index: number;
  isActive: boolean;
  onSwipe: (direction: SwipeDirection) => void;
  onSwipeUp?: () => void;
  onTap?: () => void;
  cardRef?: React.RefObject<SwipeableCardRef | null>;
  isProcessing?: boolean;
}

const StackedCard: React.FC<StackedCardProps> = ({
  profile,
  index,
  isActive,
  onSwipe,
  onSwipeUp,
  onTap,
  cardRef,
  isProcessing,
}) => {
  const { theme } = useDatingTheme();

  // Calculate stack position
  const stackPosition = useMemo(() => {
    if (index >= STACK.visibleCards) {
      return null; // Don't render cards beyond visible count
    }

    const scale = 1 - index * STACK.scaleDecrement;
    const translateY = -index * STACK.yOffset;
    const opacity = 1 - index * STACK.opacityDecrement;

    return { scale, translateY, opacity };
  }, [index]);

  if (!stackPosition) return null;

  const animatedStyle = useAnimatedStyle(() => {
    if (isActive) {
      return {
        zIndex: STACK.visibleCards - index,
      };
    }

    return {
      transform: [
        { scale: withSpring(stackPosition.scale, SPRING.stackShuffle) },
        { translateY: withSpring(stackPosition.translateY, SPRING.stackShuffle) },
      ],
      opacity: withSpring(stackPosition.opacity, SPRING.stackShuffle),
      zIndex: STACK.visibleCards - index,
    };
  });

  if (isActive) {
    return (
      <Animated.View style={[styles.cardWrapper, animatedStyle]}>
        <SwipeableCard
          ref={cardRef}
          onSwipe={onSwipe}
          onSwipeUp={onSwipeUp}
          onTap={onTap}
          disabled={isProcessing}
          index={index}
        >
          <ProfileCard profile={profile} />
        </SwipeableCard>
      </Animated.View>
    );
  }

  // Background cards (not interactive)
  return (
    <Animated.View style={[styles.cardWrapper, styles.backgroundCard, animatedStyle]}>
      <View
        style={[
          styles.staticCard,
          {
            backgroundColor: theme.bg.elevated,
            borderRadius: CARD.discovery.borderRadius,
          },
          theme.shadows.md,
        ]}
      >
        <ProfileCard profile={profile} />
      </View>
    </Animated.View>
  );
};

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export const CardStack = React.forwardRef<CardStackRef, CardStackProps>(
  ({ profiles, onSwipe, onSwipeUp, onCardPress, isProcessing }, ref) => {
    const activeCardRef = useRef<SwipeableCardRef>(null);

    // Expose swipe methods via ref
    React.useImperativeHandle(ref, () => ({
      swipeLeft: () => activeCardRef.current?.swipeLeft(),
      swipeRight: () => activeCardRef.current?.swipeRight(),
    }));

    // Handle swipe on active card
    const handleSwipe = useCallback(
      (direction: SwipeDirection) => {
        try {
          if (profiles.length > 0 && direction !== 'none') {
            onSwipe(profiles[0], direction);
          }
        } catch {
          // Prevent crash
        }
      },
      [profiles, onSwipe],
    );

    // Handle swipe up
    const handleSwipeUp = useCallback(() => {
      try {
        if (profiles.length > 0 && onSwipeUp) {
          onSwipeUp(profiles[0]);
        }
      } catch {
        // Prevent crash
      }
    }, [profiles, onSwipeUp]);

    // Handle card tap (view profile)
    const handleCardTap = useCallback(() => {
      try {
        if (profiles.length > 0 && onCardPress) {
          onCardPress(profiles[0]);
        }
      } catch {
        // Prevent crash
      }
    }, [profiles, onCardPress]);

    // Get visible profiles
    const visibleProfiles = useMemo(
      () => profiles.slice(0, STACK.visibleCards),
      [profiles],
    );

    if (visibleProfiles.length === 0) {
      return null;
    }

    return (
      <GestureHandlerRootView style={styles.container}>
        <View style={styles.stackContainer}>
          {/* Render cards in reverse order (bottom to top) */}
          {visibleProfiles
            .slice()
            .reverse()
            .map((profile, reversedIndex) => {
              const actualIndex = visibleProfiles.length - 1 - reversedIndex;
              const isActive = actualIndex === 0;

              return (
                <StackedCard
                  key={profile.userId}
                  profile={profile}
                  index={actualIndex}
                  isActive={isActive}
                  onSwipe={handleSwipe}
                  onSwipeUp={handleSwipeUp}
                  onTap={isActive ? handleCardTap : undefined}
                  cardRef={isActive ? activeCardRef : undefined}
                  isProcessing={isProcessing}
                />
              );
            })}
        </View>
      </GestureHandlerRootView>
    );
  },
);

CardStack.displayName = 'CardStack';

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stackContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardWrapper: {
    position: 'absolute',
  },
  backgroundCard: {
    pointerEvents: 'none',
  },
  staticCard: {
    width: CARD.discovery.width,
    aspectRatio: CARD.discovery.aspectRatio,
    overflow: 'hidden',
  },
});

export default CardStack;
