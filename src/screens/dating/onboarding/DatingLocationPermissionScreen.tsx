/**
 * Dating Location Permission Screen
 *
 * Final step of onboarding - request location permission
 */

import React, { useCallback } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DatingThemeProvider, useDatingTheme } from '../../../contexts/DatingThemeContext';
import { RootStackParamList } from '../../../types';
import { useFadeSlideIn, usePressScale } from '../hooks';
import {
  LocationPermissionHeader,
  LocationPermissionIllustration,
  LocationPermissionContent,
  LocationPermissionActions,
  useLocationPermission,
} from './components/location-permission';
import { locationPermissionStyles as styles } from './components/location-permission/locationPermissionStyles';

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'DatingLocationPermission'>;

const ANIMATION_DELAY_ILLUSTRATION = 100;
const ANIMATION_DELAY_CONTENT = 220;
const ANIMATION_DELAY_ACTIONS = 340;
const ANIMATION_TRANSLATE_Y = 24;
const ANIMATION_TRANSLATE_Y_SMALL = 20;

const LocationPermissionInner: React.FC = () => {
  const { theme } = useDatingTheme();
  const navigation = useNavigation<NavigationProp>();

  const goToDiscovery = useCallback(() => {
    navigation.replace('DatingTabs');
  }, [navigation]);

  const { requestAndNavigate, loading } = useLocationPermission({
    onSuccess: goToDiscovery,
  });

  const animatedIllustration = useFadeSlideIn({
    delay: ANIMATION_DELAY_ILLUSTRATION,
    initialTranslateY: ANIMATION_TRANSLATE_Y,
  });
  const animatedContent = useFadeSlideIn({
    delay: ANIMATION_DELAY_CONTENT,
    initialTranslateY: ANIMATION_TRANSLATE_Y_SMALL,
  });
  const animatedActions = useFadeSlideIn({
    delay: ANIMATION_DELAY_ACTIONS,
    initialTranslateY: ANIMATION_TRANSLATE_Y_SMALL,
  });
  const {
    animatedStyle: primaryButtonStyle,
    handlePressIn: primaryPressIn,
    handlePressOut: primaryPressOut,
  } = usePressScale();

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);

  return (
    <View style={[styles.wrapper, { backgroundColor: theme.bg.base }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <LocationPermissionHeader onBack={handleBack} />
        <LocationPermissionIllustration animatedStyle={animatedIllustration} />
        <LocationPermissionContent animatedStyle={animatedContent} />
        <LocationPermissionActions
          loading={loading}
          primaryButtonStyle={primaryButtonStyle}
          containerAnimatedStyle={animatedActions}
          onPressIn={primaryPressIn}
          onPressOut={primaryPressOut}
          onAllow={requestAndNavigate}
        />
      </SafeAreaView>
    </View>
  );
};

const DatingLocationPermissionScreen: React.FC = () => {
  return (
    <DatingThemeProvider>
      <LocationPermissionInner />
    </DatingThemeProvider>
  );
};

export default DatingLocationPermissionScreen;
