/**
 * Dating Image Carousel
 *
 * Tap-based image carousel với pagination dots
 * Tap left = prev, Tap right = next
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  PAGINATION,
  SWIPE,
  DURATION,
  RADIUS,
  SPACING,
} from '../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ImageCarouselProps {
  images: string[];
  onImageChange?: (index: number) => void;
  borderRadius?: number;
}

// ═══════════════════════════════════════════════════════════════
// PAGINATION DOT
// ═══════════════════════════════════════════════════════════════

interface PaginationDotProps {
  active: boolean;
  color: string;
  activeColor: string;
}

const PaginationDot: React.FC<PaginationDotProps> = ({
  active,
  color,
  activeColor,
}) => {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withTiming(active ? PAGINATION.dotSizeActive : PAGINATION.dotSize, {
      duration: DURATION.fast,
    }),
    height: withTiming(active ? PAGINATION.dotSizeActive : PAGINATION.dotSize, {
      duration: DURATION.fast,
    }),
    backgroundColor: withTiming(active ? activeColor : color, {
      duration: DURATION.fast,
    }),
    opacity: withTiming(active ? 1 : 0.5, { duration: DURATION.fast }),
  }));

  return <Animated.View style={[styles.dot, animatedStyle]} />;
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const ImageCarousel: React.FC<ImageCarouselProps> = ({
  images,
  onImageChange,
  borderRadius = RADIUS.lg,
}) => {
  const { theme } = useDatingTheme();
  const [currentIndex, setCurrentIndex] = useState(0);

  const hasMultipleImages = images.length > 1;

  // Handle tap navigation
  const handleTap = useCallback(
    (event: any) => {
      if (!hasMultipleImages) return;

      const { locationX } = event.nativeEvent;
      const screenWidth = Dimensions.get('window').width;
      const tapZoneWidth = screenWidth * SWIPE.tapZone.left;

      // Haptic feedback
      Haptics.selectionAsync();

      let newIndex = currentIndex;

      if (locationX < tapZoneWidth) {
        // Tap left - previous
        newIndex = currentIndex > 0 ? currentIndex - 1 : images.length - 1;
      } else if (locationX > screenWidth - tapZoneWidth) {
        // Tap right - next
        newIndex = currentIndex < images.length - 1 ? currentIndex + 1 : 0;
      } else {
        // Tap center - do nothing (or could open full screen)
        return;
      }

      setCurrentIndex(newIndex);
      onImageChange?.(newIndex);
    },
    [currentIndex, images.length, hasMultipleImages, onImageChange],
  );

  if (images.length === 0) {
    return (
      <View
        style={[
          styles.container,
          { borderRadius, backgroundColor: theme.bg.surface },
        ]}
      />
    );
  }

  return (
    <View style={[styles.container, { borderRadius }]}>
      {/* Main Image */}
      <Pressable style={styles.imageContainer} onPress={handleTap}>
        <Animated.View
          key={currentIndex}
          entering={FadeIn.duration(DURATION.fast)}
          exiting={FadeOut.duration(DURATION.instant)}
          style={StyleSheet.absoluteFill}
        >
          <Image
            source={{ uri: images[currentIndex] }}
            style={[styles.image, { borderRadius }]}
            resizeMode="cover"
          />
        </Animated.View>
      </Pressable>

      {/* Pagination Dots */}
      {hasMultipleImages && (
        <View style={styles.pagination}>
          {images.map((_, index) => (
            <PaginationDot
              key={index}
              active={index === currentIndex}
              color="rgba(255,255,255,0.5)"
              activeColor="#FFFFFF"
            />
          ))}
        </View>
      )}

      {/* Tap Zone Indicators (development only) */}
      {__DEV__ && hasMultipleImages && (
        <>
          <View style={[styles.tapZone, styles.tapZoneLeft]} />
          <View style={[styles.tapZone, styles.tapZoneRight]} />
        </>
      )}
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
  },
  imageContainer: {
    flex: 1,
  },
  image: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  pagination: {
    position: 'absolute',
    top: PAGINATION.containerPadding,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: PAGINATION.containerHeight,
    gap: PAGINATION.dotGap,
  },
  dot: {
    borderRadius: 9999,
  },
  // Development tap zone indicators
  tapZone: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: `${SWIPE.tapZone.left * 100}%`,
    backgroundColor: __DEV__ ? 'rgba(255,0,0,0.05)' : 'transparent',
  },
  tapZoneLeft: {
    left: 0,
  },
  tapZoneRight: {
    right: 0,
  },
});

export default ImageCarousel;
