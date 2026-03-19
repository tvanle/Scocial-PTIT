import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import {
  DATING_ANIMATION,
  SPRING_ENTRANCE,
} from '../../../constants/dating';

interface UseFadeSlideInOptions {
  delay?: number;
  initialTranslateY?: number;
  duration?: number;
  damping?: number;
  stiffness?: number;
}

export const useFadeSlideIn = (options: UseFadeSlideInOptions = {}) => {
  const {
    delay = 0,
    initialTranslateY = DATING_ANIMATION.translateYEntrance,
    duration = DATING_ANIMATION.durationEntrance,
    damping = SPRING_ENTRANCE.damping,
    stiffness = SPRING_ENTRANCE.stiffness,
  } = options;

  const opacity = useSharedValue(0);
  const translateY = useSharedValue(initialTranslateY);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration }));
    translateY.value = withDelay(delay, withSpring(0, { damping, stiffness }));
  }, [delay, duration, damping, stiffness, opacity, translateY]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return animatedStyle;
};
