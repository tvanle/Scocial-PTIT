import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import type { RootStackParamList } from '../../../types';
import {
  DetailHeroImage,
  DetailPhotoGrid,
  DetailIdentity,
  DetailInfoCards,
  DetailSection,
  DetailInterests,
  DetailCampusCard,
  DetailActionBar,
} from './components';
import datingService from '../../../services/dating/datingService';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail;
const strings = DATING_STRINGS.profileDetail;

type RouteParams = RouteProp<RootStackParamList, 'DatingProfileDetail'>;
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

function extractYear(studentId?: string | null): number | null {
  if (!studentId) return null;
  const match = studentId.match(/[A-Z](\d{2})/);
  if (!match) return null;
  const startYear = 2000 + parseInt(match[1], 10);
  return new Date().getFullYear() - startYear + 1;
}

const DatingProfileDetailScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { profile } = route.params;

  const swipeMutation = useMutation({
    mutationFn: (action: 'LIKE' | 'UNLIKE') =>
      datingService.swipe({ targetUserId: profile.userId, action }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dating', 'discovery'] });
      navigation.goBack();
    },
  });

  const age = useMemo(() => calculateAge(profile.user.dateOfBirth), [profile.user.dateOfBirth]);
  const yearLabel = useMemo(() => {
    const y = extractYear(profile.user.studentId);
    return y ? strings.yearLabel(y) : undefined;
  }, [profile.user.studentId]);

  const handleBack = useCallback(() => navigation.goBack(), [navigation]);
  const handleSkip = useCallback(() => swipeMutation.mutate('UNLIKE'), [swipeMutation]);
  const handleLike = useCallback(() => swipeMutation.mutate('LIKE'), [swipeMutation]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces
      >
        <DetailHeroImage imageUrl={profile.photos[0]?.url ?? ''} onBack={handleBack} />

        <DetailIdentity
          name={profile.user.fullName ?? strings.unknownName}
          age={age}
          location="Hanoi, Vietnam"
          isVerified
        />

        <DetailInfoCards
          major={profile.lifestyle?.education ?? undefined}
          yearLabel={yearLabel}
        />

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {profile.bio ? (
          <DetailSection icon="people-outline" title={strings.aboutMe}>
            <Text style={[styles.bioText, { color: colors.bioText }]}>
              {profile.bio}
            </Text>
          </DetailSection>
        ) : null}

        <DetailSection icon="auto-awesome" title={strings.interests}>
          <DetailInterests
            interests={['Coding', 'Photography', 'Basketball', 'Robotics', 'Travel', 'UI_Design']}
          />
        </DetailSection>

        <View style={styles.campusWrap}>
          <DetailCampusCard department={profile.lifestyle?.education ?? undefined} />
        </View>

        <DetailPhotoGrid photos={profile.photos} />
      </ScrollView>

      <DetailActionBar
        onSkip={handleSkip}
        onLike={handleLike}
        disabled={swipeMutation.isPending}
      />

      {swipeMutation.isPending && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.likeBtnBg} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: layout.scrollPaddingBottom },
  divider: {
    height: layout.divider.height,
    marginHorizontal: layout.divider.marginH,
    marginVertical: layout.divider.marginV,
  },
  bioText: {
    fontSize: layout.bio.textSize,
    lineHeight: layout.bio.lineHeight,
  },
  campusWrap: {
    paddingHorizontal: layout.section.paddingH,
    marginTop: layout.section.marginTop,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default DatingProfileDetailScreen;
