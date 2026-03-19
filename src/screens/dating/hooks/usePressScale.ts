import { useCallback } from 'react';
import {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { SPRING_BUTTON, PRESS_SCALE_DOWN } from '../../../constants/dating';

interface UsePressScaleOptions {
  scaleDown?: number;
}

export const usePressScale = (options: UsePressScaleOptions = {}) => {
  const { scaleDown = PRESS_SCALE_DOWN } = options;
  const scale = useSharedValue(1);

  const handlePressIn = useCallback(() => {
    scale.value = withSpring(scaleDown, SPRING_BUTTON);
  }, [scale, scaleDown]);

  const handlePressOut = useCallback(() => {
    scale.value = withSpring(1, SPRING_BUTTON);
  }, [scale]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { animatedStyle, handlePressIn, handlePressOut };
};
