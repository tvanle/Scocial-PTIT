import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';
import { BRAND } from '../../../../../constants/dating/design-system/colors';

const layout = DATING_LAYOUT.preferences.ageRange;
const colors = DATING_COLORS.preferences;

function valueToPercent(value: number): number {
  const { ageMinDefault, ageMaxCap } = layout;
  return Math.max(0, Math.min(100, ((value - ageMinDefault) / (ageMaxCap - ageMinDefault + 1)) * 100));
}

function percentToValue(percent: number): number {
  const { ageMinDefault, ageMaxCap } = layout;
  const raw = ageMinDefault + (percent / 100) * (ageMaxCap - ageMinDefault + 1);
  return Math.round(Math.max(ageMinDefault, Math.min(ageMaxCap, raw)));
}

export interface AgeRangeValue {
  min: number;
  max: number;
}

interface PreferencesAgeRangeSectionProps {
  value: AgeRangeValue;
  onChange: (value: AgeRangeValue) => void;
}

export const PreferencesAgeRangeSection: React.FC<PreferencesAgeRangeSectionProps> = ({
  value,
  onChange,
}) => {
  const [trackWidth, setTrackWidth] = useState(0);
  const dragStartRef = useRef<{ min: number; max: number }>({ min: value.min, max: value.max });

  const handleTrackLayout = useCallback((e: LayoutChangeEvent) => {
    setTrackWidth(e.nativeEvent.layout.width);
  }, []);

  const handleTrackPress = useCallback(
    (evt: { nativeEvent: { locationX: number } }) => {
      if (trackWidth <= 0) return;
      const percent = (evt.nativeEvent.locationX / trackWidth) * 100;
      const newVal = percentToValue(percent);
      const mid = (value.min + value.max) / 2;
      if (newVal <= mid) {
        const newMin = Math.min(newVal, value.max);
        onChange({ ...value, min: newMin });
      } else {
        const newMax = Math.max(newVal, value.min);
        onChange({ ...value, max: newMax });
      }
    },
    [onChange, trackWidth, value]
  );

  const updateMinFromDrag = useCallback(
    (translationX: number) => {
      if (trackWidth <= 0) return;
      const { min: startMin, max: startMax } = dragStartRef.current;
      const startLeft = (trackWidth * valueToPercent(startMin)) / 100 - layout.thumbSize / 2;
      const newLeft = startLeft + translationX;
      const percent = ((newLeft + layout.thumbSize / 2) / trackWidth) * 100;
      const newVal = percentToValue(percent);
      const newMin = Math.max(layout.ageMinDefault, Math.min(startMax, newVal));
      onChange({ ...value, min: newMin });
    },
    [onChange, trackWidth, value]
  );

  const updateMaxFromDrag = useCallback(
    (translationX: number) => {
      if (trackWidth <= 0) return;
      const { min: startMin, max: startMax } = dragStartRef.current;
      const startLeft = (trackWidth * valueToPercent(startMax)) / 100 - layout.thumbSize / 2;
      const newLeft = startLeft + translationX;
      const percent = ((newLeft + layout.thumbSize / 2) / trackWidth) * 100;
      const newVal = percentToValue(percent);
      const newMax = Math.max(startMin, Math.min(layout.ageMaxCap, newVal));
      onChange({ ...value, max: newMax });
    },
    [onChange, trackWidth, value]
  );

  const saveDragStart = useCallback(() => {
    dragStartRef.current = { min: value.min, max: value.max };
  }, [value.min, value.max]);

  const leftPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          runOnJS(saveDragStart)();
        })
        .onUpdate((e) => {
          runOnJS(updateMinFromDrag)(e.translationX);
        }),
    [saveDragStart, updateMinFromDrag]
  );

  const rightPanGesture = useMemo(
    () =>
      Gesture.Pan()
        .onStart(() => {
          runOnJS(saveDragStart)();
        })
        .onUpdate((e) => {
          runOnJS(updateMaxFromDrag)(e.translationX);
        }),
    [saveDragStart, updateMaxFromDrag]
  );

  const leftPercent = valueToPercent(value.min);
  const rightPercent = valueToPercent(value.max);

  const thumbStyle = useMemo(
    () => ({
      width: layout.thumbSize,
      height: layout.thumbSize,
      borderRadius: layout.thumbSize / 2,
      borderWidth: layout.thumbBorderWidth,
      backgroundColor: colors.thumbBg,
      borderColor: colors.thumbBorder,
    }),
    []
  );

  const leftThumbLeft = trackWidth > 0 ? (trackWidth * leftPercent) / 100 - layout.thumbSize / 2 : 0;
  const rightThumbLeft = trackWidth > 0 ? (trackWidth * rightPercent) / 100 - layout.thumbSize / 2 : 0;

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.iconWrap}>
          <MaterialIcons name="cake" size={20} color={BRAND.primary} />
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>Age Range</Text>
          <Text style={styles.hint}>Set your preferred age range</Text>
        </View>
        <View style={styles.ageDisplay}>
          <Text style={styles.ageDisplayText}>
            {value.min} - {value.max}
          </Text>
        </View>
      </View>

      <View style={styles.sliderContainer}>
        <View
          style={styles.trackWrap}
          onLayout={handleTrackLayout}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={handleTrackPress} />
          <View style={styles.trackBg}>
            <LinearGradient
              colors={[BRAND.primaryLight, BRAND.primary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={[
                styles.trackFill,
                {
                  left: (trackWidth * leftPercent) / 100,
                  width: Math.max(0, (trackWidth * (rightPercent - leftPercent)) / 100),
                },
              ]}
            />
          </View>
          <GestureDetector gesture={leftPanGesture}>
            <View style={[styles.thumb, thumbStyle, { left: leftThumbLeft }]}>
              <View style={styles.thumbInner}>
                <View style={styles.thumbLines}>
                  <View style={styles.thumbLine} />
                  <View style={styles.thumbLine} />
                </View>
              </View>
            </View>
          </GestureDetector>
          <GestureDetector gesture={rightPanGesture}>
            <View style={[styles.thumb, thumbStyle, { left: rightThumbLeft }]}>
              <View style={styles.thumbInner}>
                <View style={styles.thumbLines}>
                  <View style={styles.thumbLine} />
                  <View style={styles.thumbLine} />
                </View>
              </View>
            </View>
          </GestureDetector>
        </View>
        <View style={styles.labels}>
          <Text style={styles.axisLabel}>{layout.ageMinDefault}</Text>
          <Text style={styles.axisLabel}>{layout.ageMaxCap}+</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    marginBottom: 24,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.primaryMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 4,
  },
  hint: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
  },
  ageDisplay: {
    backgroundColor: BRAND.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
  },
  ageDisplayText: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.primary,
  },
  sliderContainer: {
    paddingHorizontal: 4,
  },
  trackWrap: {
    width: '100%',
    height: 44,
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8E8E8',
    position: 'absolute',
    overflow: 'hidden',
  },
  trackFill: {
    position: 'absolute',
    top: 0,
    height: 6,
    borderRadius: 3,
  } as const,
  thumb: {
    position: 'absolute',
    top: 8,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  thumbInner: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbLines: {
    flexDirection: 'row',
    gap: 2,
  },
  thumbLine: {
    width: 2,
    height: 10,
    borderRadius: 1,
    backgroundColor: BRAND.primary,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  axisLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999',
  },
});
