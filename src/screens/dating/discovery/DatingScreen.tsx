import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_SPACING } from '../../../constants/dating/tokens';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import { calculateAge } from '../../../utils/dating';
import {
  DiscoveryHeader,
  DiscoveryProfileCard,
  DiscoverySwipeableCard,
  DiscoveryActions,
  DiscoveryBottomNav,
  DiscoveryFilterSheet,
  DiscoveryEmptyState,
} from './components';
import { useDiscoveryFeed } from './hooks/useDiscoveryFeed';
import { useDatingLocation } from './hooks/useDatingLocation';
import type { RootStackParamList } from '../../../types';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery;
const strings = DATING_STRINGS.discovery;

type Nav = NativeStackNavigationProp<RootStackParamList>;

const DatingScreen: React.FC = React.memo(() => {
  const navigation = useNavigation<Nav>();
  const [filterVisible, setFilterVisible] = useState(false);
  const {
    currentCard,
    isLoading,
    isEmpty,
    isProfileMissing,
    swipe,
    isSwiping,
    isMatched,
    resetMatch,
    refresh,
  } = useDiscoveryFeed();
  const { requestAndUpdateLocation, isUpdating: isLocationUpdating } = useDatingLocation();

  useEffect(() => {
    if (!isMatched) return;
    const timer = setTimeout(resetMatch, layout.match.durationMs);
    return () => clearTimeout(timer);
  }, [isMatched, resetMatch]);

  const profileData = useMemo(() => {
    if (!currentCard) return null;
    return {
      userId: currentCard.userId,
      name: currentCard.user.fullName ?? strings.unknownName,
      age: calculateAge(currentCard.user.dateOfBirth),
      major: currentCard.lifestyle?.education ?? '',
      bio: currentCard.bio ?? '',
      imageUrl: currentCard.photos[0]?.url ?? '',
      interests: [] as { icon: string; label: string }[],
      distanceKm: currentCard.distanceKm,
    };
  }, [currentCard]);

  const handleSkip = useCallback(() => {
    if (!currentCard || isSwiping) return;
    swipe({ targetUserId: currentCard.userId, action: 'UNLIKE' });
  }, [currentCard, isSwiping, swipe]);

  const handleLike = useCallback(() => {
    if (!currentCard || isSwiping) return;
    swipe({ targetUserId: currentCard.userId, action: 'LIKE' });
  }, [currentCard, isSwiping, swipe]);

  const handleCardPress = useCallback(() => {
    if (!currentCard) return;
    navigation.navigate('DatingProfileDetail', { profile: currentCard });
  }, [currentCard, navigation]);

  const handleFilterPress = useCallback(() => {
    setFilterVisible(true);
  }, []);

  const handleCloseFilter = useCallback(() => {
    setFilterVisible(false);
  }, []);

  return (
    <View style={styles.wrapper}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <DiscoveryHeader onFilterPress={handleFilterPress} />

        <View style={styles.cardContainer}>
          {isLoading && !currentCard ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.nameText} />
            </View>
          ) : isProfileMissing ? (
            <View style={styles.center}>
              <Text style={styles.emptyTitle}>{strings.profileMissingTitle}</Text>
              <Text style={styles.emptySubtitle}>{strings.profileMissingSubtitle}</Text>
            </View>
          ) : isEmpty ? (
            <DiscoveryEmptyState onRefinePreferences={handleFilterPress} />
          ) : profileData ? (
            <DiscoverySwipeableCard
              key={profileData.userId}
              onSwipeLeft={handleSkip}
              onSwipeRight={handleLike}
              onPress={handleCardPress}
              disabled={isSwiping}
            >
              <DiscoveryProfileCard
                profile={profileData}
                onRequestLocation={requestAndUpdateLocation}
                isLocationUpdating={isLocationUpdating}
              />
            </DiscoverySwipeableCard>
          ) : null}
        </View>

        {!isEmpty && !isProfileMissing && (
          <DiscoveryActions onSkip={handleSkip} onLike={handleLike} />
        )}

        {isMatched && (
          <View style={styles.matchOverlay}>
            <Text style={styles.matchText}>{strings.matchTitle}</Text>
          </View>
        )}
      </SafeAreaView>
      <DiscoveryBottomNav />
      <DiscoveryFilterSheet
        visible={filterVisible}
        onClose={handleCloseFilter}
        onFilterApplied={refresh}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safeArea: { flex: 1 },
  cardContainer: {
    flex: 1,
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: {
    fontWeight: '700',
    fontSize: layout.empty.titleSize,
    color: colors.emptyTitle,
  },
  emptySubtitle: {
    textAlign: 'center',
    fontSize: layout.empty.subtitleSize,
    color: colors.emptySubtitle,
    paddingHorizontal: layout.empty.subtitlePaddingH,
    marginTop: layout.empty.subtitleMarginTop,
  },
  matchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.matchOverlayBg,
  },
  matchText: {
    fontWeight: '800',
    fontSize: layout.match.textSize,
    color: colors.matchText,
  },
});

export default DatingScreen;
