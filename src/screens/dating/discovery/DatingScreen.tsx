import React, { useCallback, useEffect, useMemo } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_SPACING } from '../../../constants/dating/tokens';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import {
  DiscoveryHeader,
  DiscoveryProfileCard,
  DiscoveryActions,
  DiscoveryBottomNav,
} from './components';
import { useDiscoveryFeed } from './hooks/useDiscoveryFeed';
import type { RootStackParamList } from '../../../types';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery;
const strings = DATING_STRINGS.discovery;

type Nav = NativeStackNavigationProp<RootStackParamList>;

function calculateAge(dob: string | null | undefined): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

const DatingScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const {
    currentCard,
    isLoading,
    isEmpty,
    swipe,
    isSwiping,
    isMatched,
    resetMatch,
  } = useDiscoveryFeed();

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

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <DiscoveryHeader />

        <View style={styles.cardContainer}>
          {isLoading && !currentCard ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.nameText} />
            </View>
          ) : isEmpty ? (
            <View style={styles.center}>
              <Text style={[styles.emptyTitle, { fontSize: layout.empty.titleSize, color: colors.emptyTitle }]}>
                {strings.emptyTitle}
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  {
                    fontSize: layout.empty.subtitleSize,
                    color: colors.emptySubtitle,
                    paddingHorizontal: layout.empty.subtitlePaddingH,
                    marginTop: layout.empty.subtitleMarginTop,
                  },
                ]}
              >
                {strings.emptySubtitle}
              </Text>
            </View>
          ) : profileData ? (
            <DiscoveryProfileCard profile={profileData} onPress={handleCardPress} />
          ) : null}
        </View>

        {!isEmpty && (
          <DiscoveryActions onSkip={handleSkip} onLike={handleLike} />
        )}

        {isMatched && (
          <View style={[styles.matchOverlay, { backgroundColor: colors.matchOverlayBg }]}>
            <Text style={[styles.matchText, { fontSize: layout.match.textSize, color: colors.matchText }]}>
              {strings.matchTitle}
            </Text>
          </View>
        )}
      </SafeAreaView>
      <DiscoveryBottomNav />
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { flex: 1 },
  safeArea: { flex: 1 },
  cardContainer: {
    flex: 1,
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.lg,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyTitle: { fontWeight: '700' },
  emptySubtitle: { textAlign: 'center' },
  matchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchText: { fontWeight: '800' },
});

export default DatingScreen;
