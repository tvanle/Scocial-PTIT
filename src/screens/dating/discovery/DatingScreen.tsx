import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Text, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_SPACING } from '../../../constants/dating/tokens';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import {
  DiscoveryHeader,
  DiscoveryProfileCard,
  DiscoveryActions,
  DiscoveryBottomNav,
} from './components';
import datingService from '../../../services/dating/datingService';
import type { DiscoveryCard } from '../../../types';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery;
const strings = DATING_STRINGS.discovery;

function calculateAge(dob: string | null | undefined): number {
  if (!dob) return 0;
  const birth = new Date(dob);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

function toProfileData(card: DiscoveryCard) {
  return {
    userId: card.userId,
    name: card.user.fullName ?? strings.unknownName,
    age: calculateAge(card.user.dateOfBirth),
    major: card.lifestyle?.education ?? '',
    bio: card.bio ?? '',
    imageUrl: card.photos[0]?.url ?? '',
    interests: [] as { icon: string; label: string }[],
  };
}

const DatingScreen: React.FC = () => {
  const [cards, setCards] = useState<DiscoveryCard[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [loading, setLoading] = useState(true);
  const [swiping, setSwiping] = useState(false);
  const [matchAlert, setMatchAlert] = useState(false);
  const pageRef = useRef(1);
  const hasMoreRef = useRef(true);

  const fetchCandidates = useCallback(async (page: number, append = false) => {
    try {
      setLoading(true);
      const res = await datingService.getDiscovery({
        page: String(page),
        limit: String(layout.feed.pageSize),
      });
      const newCards = res.data ?? [];
      if (append) {
        setCards((prev) => [...prev, ...newCards]);
      } else {
        setCards(newCards);
        setCurrentIdx(0);
      }
      hasMoreRef.current = page < (res.pagination?.totalPages ?? 1);
    } catch (err) {
      console.error('[Discovery] fetch error', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCandidates(1);
  }, [fetchCandidates]);

  const loadMore = useCallback(() => {
    if (!hasMoreRef.current) return;
    pageRef.current += 1;
    fetchCandidates(pageRef.current, true);
  }, [fetchCandidates]);

  const handleSwipe = useCallback(
    async (action: 'LIKE' | 'PASS') => {
      const card = cards[currentIdx];
      if (!card || swiping) return;

      setSwiping(true);
      try {
        const res = await datingService.swipe({
          targetUserId: card.userId,
          action,
        });
        if (res.matched) {
          setMatchAlert(true);
          setTimeout(() => setMatchAlert(false), layout.match.durationMs);
        }
      } catch (err: any) {
        console.error('[Swipe] error', err?.message);
      } finally {
        setSwiping(false);
      }

      const nextIdx = currentIdx + 1;
      if (nextIdx >= cards.length - layout.feed.prefetchThreshold && hasMoreRef.current) {
        loadMore();
      }
      setCurrentIdx(nextIdx);
    },
    [cards, currentIdx, swiping, loadMore],
  );

  const handleSkip = useCallback(() => handleSwipe('PASS'), [handleSwipe]);
  const handleLike = useCallback(() => handleSwipe('LIKE'), [handleSwipe]);

  const currentCard = cards[currentIdx];
  const isEmpty = !loading && !currentCard;

  return (
    <View style={[styles.wrapper, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <DiscoveryHeader />

        <View style={styles.cardContainer}>
          {loading && !currentCard ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={colors.nameText} />
            </View>
          ) : isEmpty ? (
            <View style={styles.center}>
              <Text
                style={[
                  styles.emptyTitle,
                  { fontSize: layout.empty.titleSize, color: colors.emptyTitle },
                ]}
              >
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
          ) : currentCard ? (
            <DiscoveryProfileCard profile={toProfileData(currentCard)} />
          ) : null}
        </View>

        {!isEmpty && (
          <DiscoveryActions onSkip={handleSkip} onLike={handleLike} />
        )}

        {matchAlert && (
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
  wrapper: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  cardContainer: {
    flex: 1,
    paddingHorizontal: DATING_SPACING.lg,
    paddingVertical: DATING_SPACING.lg,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontWeight: '700',
  },
  emptySubtitle: {
    textAlign: 'center',
  },
  matchOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  matchText: {
    fontWeight: '800',
  },
});

export default DatingScreen;
