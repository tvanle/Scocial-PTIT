import React from 'react';
import { Text, StyleSheet, type ViewStyle } from 'react-native';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';

const headerLayout = DATING_LAYOUT.splash.header;

interface AnimatedHeaderProps {
  animatedStyle: AnimatedStyle<ViewStyle>;
  textColor: string;
}

export const AnimatedHeader: React.FC<AnimatedHeaderProps> = ({ animatedStyle, textColor }) => {
  return (
    <Animated.View style={[styles.textContainer, animatedStyle]}>
      <Text style={[styles.title, { color: textColor }]}>
        {DATING_STRINGS.splash.titleStart}
        <Text style={styles.titleHighlight}>{DATING_STRINGS.splash.titleHighlight}</Text>
      </Text>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    alignItems: 'center',
    maxWidth: headerLayout.titleMaxWidth,
  },
  title: {
    fontSize: headerLayout.titleFontSize,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: headerLayout.titleLetterSpacing,
  },
  titleHighlight: {
    color: DATING_COLORS.primary,
  },
});

