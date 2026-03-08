import React, { useCallback } from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
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
  onLater: () => void;
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
    onLater,
  }) => {
    const handleAllow = useCallback(() => {
      if (!loading) onAllow();
    }, [loading, onAllow]);

    const handleLater = useCallback(() => {
      if (!loading) onLater();
    }, [loading, onLater]);

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
          accessibilityHint="Yêu cầu quyền truy cập vị trí"
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
        <TouchableOpacity
          onPress={handleLater}
          disabled={loading}
          style={styles.secondaryButton}
          accessibilityRole="button"
          accessibilityLabel={DATING_STRINGS.locationPermission.later}
          accessibilityHint="Bỏ qua và vào khám phá"
        >
          <Text style={styles.secondaryButtonText}>
            {DATING_STRINGS.locationPermission.later}
          </Text>
        </TouchableOpacity>
      </Root>
    );
  }
);
