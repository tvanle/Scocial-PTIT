import React from 'react';
import { StyleSheet, ImageBackground, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';
import { DiscoveryProfileCardContent } from './DiscoveryProfileCardContent';

const colors = DATING_COLORS.discovery;
const strings = DATING_STRINGS.discovery;
const card = DATING_LAYOUT.discovery.card;

interface ProfileData {
  name: string;
  age: number;
  major: string;
  bio: string;
  imageUrl: string;
  interests: { icon: string; label: string }[];
  distanceKm?: number | null;
}

interface DiscoveryProfileCardProps {
  profile: ProfileData;
  onPress?: () => void;
  /** Khi có, dòng "Bật vị trí để xem khoảng cách" sẽ thành nút bấm để bật định vị */
  onRequestLocation?: () => void;
  /** Đang cập nhật vị trí (hiển thị trạng thái nếu cần) */
  isLocationUpdating?: boolean;
}

export const DiscoveryProfileCard = React.memo<DiscoveryProfileCardProps>(({
  profile,
  onPress,
  onRequestLocation,
  isLocationUpdating,
}) => {
  const showDistanceHint = !(profile.distanceKm != null && profile.distanceKm > 0);
  const distanceLabel = profile.distanceKm != null && profile.distanceKm > 0
    ? strings.distanceAway(profile.distanceKm)
    : isLocationUpdating
      ? strings.locationUpdating
      : strings.distanceUnknown;

  return (
  <Pressable
    style={styles.card}
    onPress={onPress}
    accessibilityRole="button"
    accessibilityLabel={`View ${profile.name}'s profile`}
    accessibilityHint="Opens full profile detail"
  >
    <ImageBackground
      source={{ uri: profile.imageUrl }}
      style={styles.image}
      resizeMode="cover"
    >
      <TouchableOpacity style={styles.infoBtn} activeOpacity={0.7}>
        <MaterialIcons name="info-outline" size={card.infoBtnSize / 2} color={colors.nameText} />
      </TouchableOpacity>

      <LinearGradient
        colors={colors.gradientColors as unknown as readonly [string, string, ...string[]]}
        style={styles.gradient}
      >
        <DiscoveryProfileCardContent
          name={profile.name}
          age={profile.age}
          major={profile.major}
          bio={profile.bio}
          interests={profile.interests}
          distanceLabel={distanceLabel}
          showDistanceHint={showDistanceHint}
          onRequestLocation={onRequestLocation}
          isLocationUpdating={isLocationUpdating}
        />
      </LinearGradient>
    </ImageBackground>
  </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
    borderRadius: card.borderRadius,
    borderColor: colors.cardBorder,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: card.infoBtnSize,
    height: card.infoBtnSize,
    borderRadius: 9999,
    borderWidth: 1,
    backgroundColor: colors.infoBtnBg,
    borderColor: colors.infoBtnBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    justifyContent: 'flex-end',
    minHeight: '50%',
  },
});
