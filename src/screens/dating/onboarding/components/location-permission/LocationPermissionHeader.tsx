import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { locationPermissionStyles as styles } from './locationPermissionStyles';
import { LOCATION_PERMISSION_LAYOUT } from './constants';

const backIconSize = LOCATION_PERMISSION_LAYOUT.header.backIconSize;
const headerColor = DATING_COLORS.preferences.headerTitle;

export interface LocationPermissionHeaderProps {
  onBack: () => void;
}

export const LocationPermissionHeader: React.FC<LocationPermissionHeaderProps> =
  React.memo(({ onBack }) => {
    const handleBack = useCallback(() => {
      onBack();
    }, [onBack]);

    return (
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.backBtn}
          accessibilityRole="button"
          accessibilityLabel="Quay lại"
          accessibilityHint="Quay lại màn hình trước"
        >
          <MaterialIcons
            name="arrow-back-ios"
            size={backIconSize}
            color={headerColor}
          />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {DATING_STRINGS.locationPermission.headerTitle}
        </Text>
        <View style={styles.headerPlaceholder} />
      </View>
    );
  });
