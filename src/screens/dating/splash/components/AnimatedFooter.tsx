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
import { DATING_STRINGS } from '../../../../constants/dating/strings';

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
            color="#ffffff"
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
    paddingBottom: 20,
  },
  button: {
    flexDirection: 'row',
    width: '100%',
    height: 60,
    backgroundColor: '#FA4E57',
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#FA4E57',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.25,
        shadowRadius: 16,
      },
      android: {
        elevation: 6,
        shadowColor: '#FA4E57',
      },
    }),
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  buttonIcon: {
    marginLeft: 8,
    marginTop: 2,
  },
  footerText: {
    marginTop: 28,
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: 16,
  },
});

