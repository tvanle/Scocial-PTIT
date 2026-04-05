import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, ActivityIndicator } from 'react-native';
import Animated from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating';
import { BRAND } from '../../../../../constants/dating/design-system/colors';
import type { StyleProp, ViewStyle } from 'react-native';

interface ProfileSetupBottomBarProps {
  onContinue: () => void;
  onPressIn: () => void;
  onPressOut: () => void;
  animatedButtonStyle: StyleProp<ViewStyle>;
  loading?: boolean;
  disabled?: boolean;
  hint?: string | null;
  label?: string;
}

const layout = DATING_LAYOUT.profileSetup.bottomBar;
const colors = DATING_COLORS.profileSetup;

export const ProfileSetupBottomBar: React.FC<ProfileSetupBottomBarProps> = ({
  onContinue,
  onPressIn,
  onPressOut,
  animatedButtonStyle,
  loading = false,
  disabled = false,
  hint = null,
  label,
}) => {
  const isInactive = loading || disabled;

  return (
    <View style={styles.wrapper}>
      <LinearGradient
        colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#fff']}
        style={styles.gradient}
      />
      <View style={styles.bottomBar}>
        {hint && (
          <View style={styles.hintRow}>
            <MaterialIcons name="info-outline" size={16} color={BRAND.primary} />
            <Text style={styles.hint}>{hint}</Text>
          </View>
        )}
        <Pressable
          onPress={onContinue}
          onPressIn={isInactive ? undefined : onPressIn}
          onPressOut={isInactive ? undefined : onPressOut}
          disabled={isInactive}
        >
          <Animated.View style={animatedButtonStyle}>
            {isInactive ? (
              <View style={styles.buttonDisabled}>
                {loading ? (
                  <ActivityIndicator color="#999" />
                ) : (
                  <>
                    <Text style={styles.buttonTextDisabled}>
                      {label ?? DATING_STRINGS.profileSetup.continue}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#999" />
                  </>
                )}
              </View>
            ) : (
              <LinearGradient
                colors={[BRAND.primary, BRAND.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.button}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <Text style={styles.buttonText}>
                      {label ?? DATING_STRINGS.profileSetup.continue}
                    </Text>
                    <MaterialIcons name="arrow-forward" size={20} color="#fff" />
                  </>
                )}
              </LinearGradient>
            )}
          </Animated.View>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
  },
  gradient: {
    position: 'absolute',
    top: -30,
    left: 0,
    right: 0,
    height: 30,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#fff',
  },
  hintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
    backgroundColor: BRAND.primaryMuted,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  hint: {
    fontSize: 13,
    color: BRAND.primary,
    fontWeight: '500',
  },
  button: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.35,
        shadowRadius: 16,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  buttonDisabled: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8E8E8',
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#fff',
    letterSpacing: 0.3,
  },
  buttonTextDisabled: {
    fontSize: 17,
    fontWeight: '700',
    color: '#999',
    letterSpacing: 0.3,
  },
});
