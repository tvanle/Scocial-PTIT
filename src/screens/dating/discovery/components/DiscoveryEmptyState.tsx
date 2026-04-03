/**
 * Dating Discovery Empty State
 *
 * Empty state khi không còn profiles
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  withSequence,
} from 'react-native-reanimated';

import { useDatingTheme } from '../../../../contexts/DatingThemeContext';
import {
  SPACING,
  RADIUS,
  TEXT_STYLES,
  BUTTON,
  DURATION,
} from '../../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface DiscoveryEmptyStateProps {
  onRefinePreferences?: () => void;
  onBoostProfile?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED ICON
// ═══════════════════════════════════════════════════════════════

const AnimatedIcon: React.FC = () => {
  const { theme } = useDatingTheme();
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 }),
      ),
      -1,
      false,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.iconContainer}>
      <View style={[styles.iconOuter, { backgroundColor: theme.brand.primaryMuted }]}>
        <Animated.View style={[styles.iconInner, animatedStyle]}>
          <MaterialCommunityIcons
            name="heart-search"
            size={48}
            color={theme.brand.primary}
          />
        </Animated.View>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const DiscoveryEmptyState: React.FC<DiscoveryEmptyStateProps> = ({
  onRefinePreferences,
  onBoostProfile,
}) => {
  const { theme } = useDatingTheme();

  return (
    <View style={styles.container}>
      {/* Animated Icon */}
      <AnimatedIcon />

      {/* Text */}
      <Text style={[styles.title, { color: theme.text.primary }]}>
        Không còn ai gần đây
      </Text>
      <Text style={[styles.subtitle, { color: theme.text.muted }]}>
        Mở rộng tiêu chí tìm kiếm hoặc{'\n'}quay lại sau để xem thêm
      </Text>

      {/* Actions */}
      <View style={styles.actions}>
        {onRefinePreferences && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.primaryButton,
              { backgroundColor: theme.brand.primary },
            ]}
            onPress={onRefinePreferences}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="tune" size={20} color="#FFFFFF" />
            <Text style={styles.primaryButtonText}>Chỉnh sửa bộ lọc</Text>
          </TouchableOpacity>
        )}

        {onBoostProfile && (
          <TouchableOpacity
            style={[
              styles.button,
              styles.secondaryButton,
              { borderColor: theme.border.medium },
            ]}
            onPress={onBoostProfile}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons
              name="lightning-bolt"
              size={20}
              color={theme.semantic.boost.main}
            />
            <Text style={[styles.secondaryButtonText, { color: theme.text.secondary }]}>
              Boost hồ sơ
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tips */}
      <View style={[styles.tipsContainer, { backgroundColor: theme.bg.surface }]}>
        <Text style={[styles.tipsTitle, { color: theme.text.secondary }]}>
          💡 Mẹo
        </Text>
        <Text style={[styles.tipsText, { color: theme.text.muted }]}>
          Thêm ảnh và hoàn thiện hồ sơ để tăng cơ hội được match
        </Text>
      </View>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },

  // Icon
  iconContainer: {
    marginBottom: SPACING.lg,
  },
  iconOuter: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconInner: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Text
  title: {
    ...TEXT_STYLES.h1,
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  subtitle: {
    ...TEXT_STYLES.bodyMedium,
    textAlign: 'center',
    marginBottom: SPACING.xl,
  },

  // Actions
  actions: {
    width: '100%',
    gap: SPACING.sm,
    marginBottom: SPACING.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: BUTTON.standard.large.height,
    borderRadius: BUTTON.standard.large.borderRadius,
    gap: SPACING.xs,
  },
  primaryButton: {
    // backgroundColor set inline
  },
  primaryButtonText: {
    ...TEXT_STYLES.buttonLarge,
    color: '#FFFFFF',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  secondaryButtonText: {
    ...TEXT_STYLES.buttonLarge,
  },

  // Tips
  tipsContainer: {
    width: '100%',
    padding: SPACING.md,
    borderRadius: RADIUS.md,
  },
  tipsTitle: {
    ...TEXT_STYLES.label,
    marginBottom: SPACING.xxs,
  },
  tipsText: {
    ...TEXT_STYLES.bodySmall,
  },
});

export default DiscoveryEmptyState;
