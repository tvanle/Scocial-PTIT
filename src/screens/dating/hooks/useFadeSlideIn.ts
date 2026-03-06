import { useEffect } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
} from 'react-native-reanimated';

const DEFAULT_DURATION = 700;
const DEFAULT_DAMPING = 12;
const DEFAULT_STIFFNESS = 90;

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
    initialTranslateY = 30,
    duration = DEFAULT_DURATION,
    damping = DEFAULT_DAMPING,
    stiffness = DEFAULT_STIFFNESS,
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
