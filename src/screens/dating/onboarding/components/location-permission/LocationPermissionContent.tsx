import React from 'react';
import { View, Text } from 'react-native';
import Animated from 'react-native-reanimated';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { locationPermissionStyles as styles } from './locationPermissionStyles';

export interface LocationPermissionContentProps {
  animatedStyle: Record<string, unknown>;
}

export const LocationPermissionContent: React.FC<
  LocationPermissionContentProps
> = React.memo(({ animatedStyle }) => (
  <Animated.View style={[styles.contentBlock, animatedStyle]}>
    <Text style={styles.title} accessibilityRole="header">
      {DATING_STRINGS.locationPermission.title}
    </Text>
    <Text style={styles.description}>
      {DATING_STRINGS.locationPermission.description}
    </Text>
  </Animated.View>
));
