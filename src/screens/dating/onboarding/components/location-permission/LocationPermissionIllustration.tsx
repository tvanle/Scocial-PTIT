import React from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS } from '../../../../../constants/dating/theme';
import { DATING_COLORS_SEMANTIC } from '../../../../../constants/dating';
import { locationPermissionStyles as styles } from './locationPermissionStyles';
import { LOCATION_PERMISSION_LAYOUT as LAYOUT } from './constants';

const primaryColor = DATING_COLORS.primary;
const floatingAccentColor = DATING_COLORS_SEMANTIC.infoIcon;

export interface LocationPermissionIllustrationProps {
  animatedStyle: Record<string, unknown>;
}

export const LocationPermissionIllustration: React.FC<
  LocationPermissionIllustrationProps
> = React.memo(({ animatedStyle }) => (
  <View style={styles.illustrationContainer}>
    <Animated.View style={[styles.illustrationCard, animatedStyle]}>
      <View style={styles.decorCircleOuter} />
      <View style={styles.decorCircleInner} />
      <View style={styles.illustrationCenter}>
        <View style={styles.mainIconCircle}>
          <MaterialIcons
            name="location-on"
            size={LAYOUT.illustration.mainIconSize}
            color={primaryColor}
          />
        </View>
        <View style={[styles.floatingIcon, styles.floatingTopRight]}>
          <MaterialIcons
            name="favorite"
            size={LAYOUT.illustration.floatingIconSize}
            color={primaryColor}
          />
        </View>
        <View style={[styles.floatingIcon, styles.floatingBottomLeft]}>
          <MaterialIcons
            name="person-pin-circle"
            size={LAYOUT.illustration.floatingIconSize}
            color={floatingAccentColor}
          />
        </View>
      </View>
    </Animated.View>
  </View>
));
