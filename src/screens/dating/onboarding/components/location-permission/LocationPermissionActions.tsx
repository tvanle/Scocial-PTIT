import React, { useCallback } from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { DATING_COLORS } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { locationPermissionStyles as styles } from './locationPermissionStyles';

const colors = DATING_COLORS.onboarding;

export interface LocationPermissionActionsProps {
  loading: boolean;
  primaryButtonStyle: Record<string, unknown>;
  containerAnimatedStyle?: Record<string, unknown>;
  onPressIn: () => void;
  onPressOut: () => void;
  onAllow: () => void;
}

export const LocationPermissionActions: React.FC<
  LocationPermissionActionsProps
> = React.memo(
  ({
    loading,
    primaryButtonStyle,
    containerAnimatedStyle,
    onPressIn,
    onPressOut,
    onAllow,
  }) => {
    const handleAllow = useCallback(() => {
      if (!loading) onAllow();
    }, [loading, onAllow]);

    const Root = containerAnimatedStyle ? Animated.View : View;
    const rootStyle = containerAnimatedStyle
      ? [styles.actions, containerAnimatedStyle]
      : styles.actions;

    return (
      <Root style={rootStyle}>
        <Pressable
          onPress={handleAllow}
          onPressIn={onPressIn}
          onPressOut={onPressOut}
          disabled={loading}
          accessibilityRole="button"
          accessibilityLabel={DATING_STRINGS.locationPermission.allow}
          accessibilityHint="Yêu cầu quyền truy cập vị trí, bắt buộc để tiếp tục"
        >
          <Animated.View style={[styles.primaryButton, primaryButtonStyle]}>
            {loading ? (
              <ActivityIndicator color={colors.buttonText} size="small" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {DATING_STRINGS.locationPermission.allow}
              </Text>
            )}
          </Animated.View>
        </Pressable>
      </Root>
    );
  }
);
