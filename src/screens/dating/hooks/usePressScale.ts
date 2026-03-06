import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

const PRESS_SCALE = 0.97;
const SPRING_CONFIG = { damping: 15, stiffness: 400 };

interface UsePressScaleOptions {
  scaleDown?: number;
}

export const usePressScale = (options: UsePressScaleOptions = {}) => {
  const { scaleDown = PRESS_SCALE } = options;
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleDown, SPRING_CONFIG);
  }, [scale, scaleDown]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, handlePressIn, handlePressOut };
};
