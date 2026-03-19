import React, { useCallback, useMemo } from 'react';
import { View, ScrollView, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { DATING_COLORS, DATING_LAYOUT } from '../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../constants/dating/strings';
import { calculateAge, extractYear } from '../../../utils/dating';
import type { RootStackParamList } from '../../../types';
import {
  DetailHeroImage,
  DetailPhotoGrid,
  DetailIdentity,
  DetailInfoCards,
  DetailSection,
  DetailInterests,
  DetailPromptsCard,
  DetailActionBar,
} from './components';
import datingService from '../../../services/dating/datingService';
import { useDatingLocation } from '../discovery/hooks/useDatingLocation';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail;
const strings = DATING_STRINGS.profileDetail;

type RouteParams = RouteProp<RootStackParamList, 'DatingProfileDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const DatingProfileDetailScreen: React.FC = () => {
  const route = useRoute<RouteParams>();
  const navigation = useNavigation<Nav>();
  const queryClient = useQueryClient();
  const { profile } = route.params;
  const { requestAndUpdateLocation, isUpdating: isLocationUpdating } = useDatingLocation();

  const swipeMutation = useMutation({
    mutationFn: (action: 'LIKE' | 'UNLIKE') =>
      datingService.swipe({ targetUserId: profile.userId, action }),
    onSuccess: (data: { matched?: boolean | null }) => {
      // Cập nhật discovery feed ngay lập tức để loại bỏ user hiện tại
      queryClient.setQueriesData(
        { queryKey: ['dating', 'discovery'] },
        (old: unknown) => {
          if (!old || typeof old !== 'object') return old;
          const value = old as {
            data?: Array<{ userId: string }>;
            pagination?: unknown;
          };
          if (!Array.isArray(value.data)) return old;
          return {
            ...value,
            data: value.data.filter((card) => card.userId !== profile.userId),
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: ['dating', 'discovery'] });
      queryClient.invalidateQueries({ queryKey: ['dating', 'likes', 'incoming'] });

      if (data?.matched) {
        navigation.navigate('DatingMatch', { profile, source: 'detail' });
        return;
      }

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
    <View style={styles.root}>
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
          distanceKm={profile.distanceKm}
          onRequestLocation={requestAndUpdateLocation}
          isLocationUpdating={isLocationUpdating}
          isVerified
        />

        <DetailInfoCards
          major={profile.lifestyle?.education ?? undefined}
          yearLabel={yearLabel}
        />

        <View style={styles.divider} />

        {profile.bio ? (
          <DetailSection icon="people-outline" title={strings.aboutMe}>
            <Text style={styles.bioText}>
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
          <DetailPromptsCard prompts={profile.prompts} />
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
  root: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: layout.scrollPaddingBottom },
  divider: {
    height: layout.divider.height,
    marginHorizontal: layout.divider.marginH,
    marginVertical: layout.divider.marginV,
    backgroundColor: colors.divider,
  },
  bioText: {
    fontSize: layout.bio.textSize,
    lineHeight: layout.bio.lineHeight,
    color: colors.bioText,
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
