import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  type TextStyle,
  type ViewStyle,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import Animated, { type AnimatedStyle } from 'react-native-reanimated';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';

const { primary } = DATING_COLORS;
const footerLayout = DATING_LAYOUT.splash.footer;

interface AnimatedFooterProps {
  animatedStyle: AnimatedStyle<ViewStyle | TextStyle>;
  mutedTextColor: string;
  onStartPress: () => void;
}

export const AnimatedFooter: React.FC<AnimatedFooterProps> = ({
  animatedStyle,
  mutedTextColor,
  onStartPress,
}) => {
  return (
    <View style={styles.footer}>
      <Animated.View style={animatedStyle}>
        <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={onStartPress}>
          <Text style={styles.buttonText}>{DATING_STRINGS.buttonText}</Text>
          <MaterialIcons
            name="arrow-forward"
            size={22}
            color={DATING_COLORS.splash.buttonText}
            style={styles.buttonIcon}
          />
        </TouchableOpacity>
      </Animated.View>

      <Animated.Text style={[styles.footerText, { color: mutedTextColor }, animatedStyle]}>
        {DATING_STRINGS.footerText}
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: footerLayout.paddingBottom,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    height: footerLayout.buttonHeight,
    backgroundColor: primary,
    borderRadius: footerLayout.buttonBorderRadius,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: primary,
        shadowOffset: { width: 0, height: footerLayout.shadowOffsetY },
        shadowOpacity: footerLayout.shadowOpacity,
        shadowRadius: footerLayout.shadowRadius,
      },
      android: {
        elevation: footerLayout.elevation,
        shadowColor: primary,
      },
    }),
  },
  buttonText: {
    color: DATING_COLORS.splash.buttonText,
    fontSize: footerLayout.buttonFontSize,
    fontWeight: '700',
    letterSpacing: footerLayout.buttonLetterSpacing,
  },
  buttonIcon: {
    marginLeft: footerLayout.iconMarginLeft,
    marginTop: footerLayout.iconMarginTop,
  },
  footerText: {
    marginTop: footerLayout.footerTextMarginTop,
    fontSize: footerLayout.footerTextFontSize,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: footerLayout.footerTextLineHeight,
    paddingHorizontal: footerLayout.footerTextPaddingHorizontal,
  },
});

