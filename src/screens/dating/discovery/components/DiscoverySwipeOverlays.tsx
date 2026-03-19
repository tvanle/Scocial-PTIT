import React from 'react';
import { View, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery.swipe;
const strings = DATING_STRINGS.discovery;

interface DiscoverySwipeOverlaysProps {
  nopeStyle: StyleProp<ViewStyle>;
  likeStyle: StyleProp<ViewStyle>;
}

export const DiscoverySwipeOverlays = React.memo<DiscoverySwipeOverlaysProps>(
  ({ nopeStyle, likeStyle }) => (
    <>
      <Animated.View style={[styles.overlayLeft, nopeStyle]} pointerEvents="none">
        <View style={[styles.badge, styles.nopeBadge]}>
          <Text style={styles.nopeBadgeText}>{strings.swipeNopeLabel}</Text>
        </View>
      </Animated.View>
      <Animated.View style={[styles.overlayRight, likeStyle]} pointerEvents="none">
        <View style={[styles.badge, styles.likeBadge]}>
          <MaterialIcons name="favorite" size={48} color={colors.swipeLikeBorder} />
          <Text style={styles.likeBadgeText}>{strings.swipeLikeLabel}</Text>
        </View>
      </Animated.View>
    </>
  ),
);

const styles = StyleSheet.create({
  overlayLeft: {
    position: 'absolute',
    left: layout.overlayPosition,
    top: layout.overlayPosition,
    zIndex: 10,
  },
  overlayRight: {
    position: 'absolute',
    right: layout.overlayPosition,
    top: layout.overlayPosition,
    zIndex: 10,
  },
  badge: {
    borderWidth: 4,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  nopeBadge: {
    borderColor: colors.swipeNopeBorder,
    transform: [{ rotate: '-22deg' }],
  },
  likeBadge: {
    borderColor: colors.swipeLikeBorder,
    alignItems: 'center',
    transform: [{ rotate: '22deg' }],
  },
  nopeBadgeText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.swipeNopeBorder,
  },
  likeBadgeText: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: 2,
    color: colors.swipeLikeBorder,
  },
});
