import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, Pressable } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';

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
    <View style={[styles.section, { marginBottom: DATING_LAYOUT.preferences.content.sectionMarginBottom }]}>
      <View style={styles.labelRow}>
        <Text style={[styles.label, { fontSize: layout.labelFontSize, color: colors.sectionTitle }]}>
          {DATING_STRINGS.preferencesAgeRange}
        </Text>
        <View style={[styles.pill, { backgroundColor: colors.agePillBg }]}>
          <Text style={styles.pillText}>
            {DATING_STRINGS.preferencesAgeDisplay(value.min, value.max)}
          </Text>
        </View>
      </View>
      <View
        style={[styles.trackWrap, { height: layout.trackHeight + layout.thumbSize }]}
        onLayout={handleTrackLayout}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleTrackPress} />
        <View
          style={[
            styles.trackBg,
            {
              height: layout.trackHeight,
              borderRadius: layout.trackHeight / 2,
              backgroundColor: colors.trackBg,
            },
          ]}
        >
          <View
            style={[
              styles.trackFill,
              {
                left: (trackWidth * leftPercent) / 100,
                width: (trackWidth * (rightPercent - leftPercent)) / 100,
                height: layout.trackHeight,
                borderRadius: layout.trackHeight / 2,
                backgroundColor: colors.trackFill,
              },
            ]}
          />
        </View>
        <GestureDetector gesture={leftPanGesture}>
          <View style={[styles.thumb, thumbStyle, { left: leftThumbLeft }]} />
        </GestureDetector>
        <GestureDetector gesture={rightPanGesture}>
          <View style={[styles.thumb, thumbStyle, { left: rightThumbLeft }]} />
        </GestureDetector>
      </View>
      <View style={styles.labels}>
        <Text style={styles.axisLabel}>{layout.ageMinDefault}</Text>
        <Text style={styles.axisLabel}>{layout.ageMaxCap}+</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {},
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: layout.labelRowMarginBottom,
  },
  label: {
    fontWeight: '700',
  },
  pill: {
    paddingHorizontal: layout.pillPaddingH,
    paddingVertical: layout.pillPaddingV,
    borderRadius: layout.pillBorderRadius,
  },
  pillText: {
    fontSize: layout.pillFontSize,
    fontWeight: '700',
    color: DATING_COLORS.primary,
  },
  trackWrap: {
    width: '100%',
    justifyContent: 'center',
    position: 'relative',
  },
  trackBg: {
    width: '100%',
    position: 'absolute',
    left: 0,
    right: 0,
  },
  trackFill: {
    position: 'absolute',
    top: 0,
  } as const,
  thumb: {
    position: 'absolute',
    top: (layout.trackHeight + layout.thumbSize) / 2 - layout.thumbSize / 2,
    shadowColor: layout.thumbShadowColor,
    shadowOffset: { width: 0, height: layout.thumbShadowOffsetY },
    shadowOpacity: layout.thumbShadowOpacity,
    shadowRadius: layout.thumbShadowRadius,
    elevation: layout.thumbElevation,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: layout.axisLabelsMarginTop,
    paddingHorizontal: 0,
  },
  axisLabel: {
    fontSize: layout.axisLabelFontSize,
    fontWeight: '500',
    color: colors.sectionHint,
  },
});
