import React, { useCallback, useMemo } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from 'react-native-reanimated';
import { DATING_LAYOUT } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';
import { DiscoverySwipeOverlays } from './DiscoverySwipeOverlays';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const layout = DATING_LAYOUT.discovery.swipe;
const strings = DATING_STRINGS.discovery;

interface DiscoverySwipeableCardProps {
  children: React.ReactNode;
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
  onPress: () => void;
  disabled?: boolean;
}

export const DiscoverySwipeableCard = React.memo<DiscoverySwipeableCardProps>(
  ({ children, onSwipeLeft, onSwipeRight, onPress, disabled }) => {
    const translateX = useSharedValue(0);
    const translateY = useSharedValue(0);
    const rotation = useSharedValue(0);

    const runSwipeLeft = useCallback(() => onSwipeLeft(), [onSwipeLeft]);
    const runSwipeRight = useCallback(() => onSwipeRight(), [onSwipeRight]);
    const runPress = useCallback(() => onPress(), [onPress]);

    const threshold = useMemo(
      () => SCREEN_WIDTH * layout.thresholdRatio,
      [],
    );
    const exitDistance = useMemo(
      () => SCREEN_WIDTH * layout.exitMultiplier,
      [],
    );
    const springConfig = useMemo(
      () => ({ damping: layout.springDamping, stiffness: layout.springStiffness }),
      [],
    );

    const panGesture = useMemo(
      () =>
        Gesture.Pan()
          .enabled(!disabled)
          .onUpdate((e) => {
            'worklet';
            translateX.value = e.translationX;
            translateY.value = e.translationY * layout.verticalDragFactor;
            rotation.value = e.translationX * layout.rotationFactor;
          })
          .onEnd((e) => {
            'worklet';
            const shouldSwipeLeft =
              translateX.value < -threshold || e.velocityX < -layout.velocityThreshold;
            const shouldSwipeRight =
              translateX.value > threshold || e.velocityX > layout.velocityThreshold;

            if (shouldSwipeLeft) {
              translateX.value = withTiming(-exitDistance, {
                duration: layout.exitDurationMs,
              });
              translateY.value = withTiming(0);
              rotation.value = withTiming(-layout.returnRotationDeg);
              runOnJS(runSwipeLeft)();
            } else if (shouldSwipeRight) {
              translateX.value = withTiming(exitDistance, {
                duration: layout.exitDurationMs,
              });
              translateY.value = withTiming(0);
              rotation.value = withTiming(layout.returnRotationDeg);
              runOnJS(runSwipeRight)();
            } else {
              translateX.value = withSpring(0, springConfig);
              translateY.value = withSpring(0, springConfig);
              rotation.value = withSpring(0, springConfig);
            }
          }),
      [disabled, runSwipeLeft, runSwipeRight, threshold, exitDistance, springConfig],
    );

    const tapGesture = useMemo(
      () =>
        Gesture.Tap()
          .enabled(!disabled)
          .onEnd(() => runOnJS(runPress)()),
      [disabled, runPress],
    );

    const exclusiveGesture = useMemo(
      () => Gesture.Exclusive(panGesture, tapGesture),
      [panGesture, tapGesture],
    );

    const cardAnimatedStyle = useAnimatedStyle(() => ({
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${rotation.value}deg` },
      ],
    }));

    const nopeOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        translateX.value,
        [-SCREEN_WIDTH * layout.interpolationRatio, -threshold, 0],
        [layout.overlayOpacityMax, layout.overlayOpacityMax, 0],
      ),
    }));

    const likeOpacity = useAnimatedStyle(() => ({
      opacity: interpolate(
        translateX.value,
        [0, threshold, SCREEN_WIDTH * layout.interpolationRatio],
        [0, layout.overlayOpacityMax, layout.overlayOpacityMax],
      ),
    }));

    return (
      <View style={styles.wrapper}>
        <GestureDetector gesture={exclusiveGesture}>
          <Animated.View
            style={[styles.cardWrap, cardAnimatedStyle]}
            accessibilityRole="button"
            accessibilityLabel={strings.swipeCardHint}
            accessibilityHint={strings.swipeCardHint}
          >
            <DiscoverySwipeOverlays nopeStyle={nopeOpacity} likeStyle={likeOpacity} />
            {children}
          </Animated.View>
        </GestureDetector>
      </View>
    );
  },
);

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  cardWrap: { flex: 1, position: 'relative' as const },
});
