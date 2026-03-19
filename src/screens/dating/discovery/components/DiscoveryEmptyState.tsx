import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';
import {
  EMPTY_STATE_LAYOUT,
  discoveryEmptyStateStyles as styles,
} from './DiscoveryEmptyStateStyles';

const strings = DATING_STRINGS.discovery;
const L = EMPTY_STATE_LAYOUT;

export interface DiscoveryEmptyStateProps {
  onRefinePreferences: () => void;
}

export const DiscoveryEmptyState: React.FC<DiscoveryEmptyStateProps> = React.memo(
  ({ onRefinePreferences }) => {
    const handleRefine = useCallback(() => {
      onRefinePreferences();
    }, [onRefinePreferences]);

    return (
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={styles.illustrationWrap}>
            <View style={styles.glow} />
            <View style={styles.iconCircle}>
              <MaterialIcons
                name="waving-hand"
                size={L.illustrationIconSize}
                color={DATING_COLORS.primary}
              />
            </View>
          </View>

          <View style={styles.textBlock}>
            <Text style={styles.title} accessibilityRole="header">
              {strings.emptyStateTitle}
            </Text>
            <Text style={styles.subtitle}>{strings.emptyStateSubtitle}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            onPress={handleRefine}
            style={({ pressed }) => [styles.primaryBtn, pressed && styles.primaryBtnPressed]}
            accessibilityRole="button"
            accessibilityLabel={strings.emptyStateRefinePreferences}
            accessibilityHint="Mở bộ lọc tùy chọn tìm kiếm"
          >
            <Text style={styles.primaryBtnText}>{strings.emptyStateRefinePreferences}</Text>
          </Pressable>
        </View>

        <View style={styles.handleBar} />
      </View>
    );
  }
);
