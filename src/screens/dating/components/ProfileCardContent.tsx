/**
 * Dating Profile Card Content
 *
 * Info overlay trên card: name, age, distance, tags, bio
 */

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useDatingTheme } from '../../../contexts/DatingThemeContext';
import {
  SPACING,
  RADIUS,
  TEXT_STYLES,
  BADGE,
} from '../../../constants/dating/design-system';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

interface ProfileTag {
  icon?: string;
  label: string;
}

interface ProfileCardContentProps {
  name: string;
  age: number;
  isVerified?: boolean;
  distance?: number | null; // in km
  education?: string;
  bio?: string;
  tags?: ProfileTag[];
  onMorePress?: () => void;
}

// ═══════════════════════════════════════════════════════════════
// TAG COMPONENT
// ═══════════════════════════════════════════════════════════════

interface TagChipProps {
  icon?: string;
  label: string;
}

const TagChip: React.FC<TagChipProps> = ({ icon, label }) => {
  return (
    <View style={styles.tag}>
      {icon && (
        <Text style={styles.tagIcon}>{icon}</Text>
      )}
      <Text style={styles.tagText}>{label}</Text>
    </View>
  );
};

// ═══════════════════════════════════════════════════════════════
// COMPONENT
// ═══════════════════════════════════════════════════════════════

export const ProfileCardContent: React.FC<ProfileCardContentProps> = ({
  name,
  age,
  isVerified = false,
  distance,
  education,
  bio,
  tags = [],
  onMorePress,
}) => {
  const { theme } = useDatingTheme();

  const gradientColors = theme.card.gradient as [string, string, string];

  // Format distance
  const distanceText = distance != null
    ? distance < 1
      ? 'Gần đây'
      : `${distance.toFixed(1)} km`
    : null;

  // Limit visible tags
  const visibleTags = tags.slice(0, 3);
  const remainingCount = tags.length - 3;

  return (
    <LinearGradient
      colors={gradientColors}
      style={styles.gradient}
      locations={[0, 0.5, 1]}
    >
      <View style={styles.content}>
        {/* Name & Age */}
        <View style={styles.nameRow}>
          <Text style={styles.name}>{name}</Text>
          <Text style={styles.age}>, {age}</Text>
          {isVerified && (
            <MaterialCommunityIcons
              name="check-decagram"
              size={20}
              color={theme.semantic.verified}
              style={styles.verifiedIcon}
            />
          )}
        </View>

        {/* Info Row: Education & Distance */}
        <View style={styles.infoRow}>
          {education && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>🎓</Text>
              <Text style={styles.infoText}>{education}</Text>
            </View>
          )}
          {education && distanceText && (
            <Text style={styles.infoDivider}>•</Text>
          )}
          {distanceText && (
            <View style={styles.infoItem}>
              <Text style={styles.infoIcon}>📍</Text>
              <Text style={styles.infoText}>{distanceText}</Text>
            </View>
          )}
        </View>

        {/* Tags */}
        {visibleTags.length > 0 && (
          <View style={styles.tagsContainer}>
            {visibleTags.map((tag, index) => (
              <TagChip key={index} icon={tag.icon} label={tag.label} />
            ))}
            {remainingCount > 0 && (
              <View style={styles.tag}>
                <Text style={styles.tagText}>+{remainingCount}</Text>
              </View>
            )}
          </View>
        )}

        {/* Bio Preview */}
        {bio && (
          <View style={styles.bioContainer}>
            <Text style={styles.bio} numberOfLines={2}>
              "{bio}"
            </Text>
            {onMorePress && (
              <Pressable onPress={onMorePress} style={styles.moreButton}>
                <Text style={styles.moreText}>Xem thêm</Text>
                <MaterialCommunityIcons
                  name="chevron-up"
                  size={16}
                  color="rgba(255,255,255,0.8)"
                />
              </Pressable>
            )}
          </View>
        )}
      </View>
    </LinearGradient>
  );
};

// ═══════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════

const styles = StyleSheet.create({
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: '45%',
    justifyContent: 'flex-end',
  },
  content: {
    padding: SPACING.md,
    paddingBottom: SPACING.lg,
  },

  // Name row
  nameRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.xs,
  },
  name: {
    ...TEXT_STYLES.cardName,
    color: '#FFFFFF',
  },
  age: {
    ...TEXT_STYLES.cardAge,
    color: '#FFFFFF',
  },
  verifiedIcon: {
    marginLeft: SPACING.xs,
  },

  // Info row
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 14,
    marginRight: SPACING.xxs,
  },
  infoText: {
    ...TEXT_STYLES.cardInfo,
    color: 'rgba(255,255,255,0.9)',
  },
  infoDivider: {
    ...TEXT_STYLES.cardInfo,
    color: 'rgba(255,255,255,0.5)',
    marginHorizontal: SPACING.xs,
  },

  // Tags
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: SPACING.sm,
    gap: SPACING.xs,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: BADGE.tag.height,
    paddingHorizontal: BADGE.tag.paddingHorizontal,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: BADGE.tag.borderRadius,
  },
  tagIcon: {
    fontSize: 12,
    marginRight: SPACING.xxs,
  },
  tagText: {
    ...TEXT_STYLES.tag,
    color: '#FFFFFF',
  },

  // Bio
  bioContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  bio: {
    ...TEXT_STYLES.cardBio,
    color: 'rgba(255,255,255,0.85)',
    flex: 1,
    fontStyle: 'italic',
  },
  moreButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.sm,
  },
  moreText: {
    ...TEXT_STYLES.caption,
    color: 'rgba(255,255,255,0.8)',
  },
});

export default ProfileCardContent;
