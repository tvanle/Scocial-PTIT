/**
 * Dating Profile Card
 *
 * Complete profile card với image carousel và info overlay
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';

import { ImageCarousel } from './ImageCarousel';
import { ProfileCardContent } from './ProfileCardContent';
import { CARD } from '../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ProfileData {
  userId: string;
  name: string;
  age: number;
  images: string[];
  isVerified?: boolean;
  isOnline?: boolean;
  distance?: number | null;
  education?: string;
  bio?: string;
  tags?: Array<{ icon?: string; label: string }>;
}

interface ProfileCardProps {
  profile: ProfileData;
  onImageChange?: (index: number) => void;
  onMorePress?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const ProfileCard: React.FC<ProfileCardProps> = ({
  profile,
  onImageChange,
  onMorePress,
}) => {
  return (
    <View style={styles.container}>
      {/* Image Carousel */}
      <ImageCarousel
        images={profile.images}
        onImageChange={onImageChange}
        borderRadius={CARD.discovery.borderRadius}
      />

      {/* Profile Info Overlay */}
      <ProfileCardContent
        name={profile.name}
        age={profile.age}
        isVerified={profile.isVerified}
        isOnline={profile.isOnline}
        distance={profile.distance}
        education={profile.education}
        bio={profile.bio}
        tags={profile.tags}
        onMorePress={onMorePress}
      />
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default ProfileCard;
