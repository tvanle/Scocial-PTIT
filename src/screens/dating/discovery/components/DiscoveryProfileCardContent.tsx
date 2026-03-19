import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.discovery;
const card = DATING_LAYOUT.discovery.card;
const tag = DATING_LAYOUT.discovery.tag;

const NAME_ROW_GAP = 6;
const MAJOR_ROW_GAP = 6;
const MAJOR_ROW_MARGIN_TOP = 8;
const BIO_MARGIN_TOP = 16;
const TAGS_MARGIN_TOP = 16;
const TAG_GAP_INNER = 6;
const DISTANCE_HIT_SLOP = 8;

interface CardContentProps {
  name: string;
  age: number;
  major: string;
  bio: string;
  interests: { icon: string; label: string }[];
  distanceLabel: string;
  showDistanceHint: boolean;
  onRequestLocation?: () => void;
  isLocationUpdating?: boolean;
}

export const DiscoveryProfileCardContent = React.memo<CardContentProps>(({
  name,
  age,
  major,
  bio,
  interests,
  distanceLabel,
  showDistanceHint,
  onRequestLocation,
  isLocationUpdating,
}) => (
  <View style={styles.content}>
    <View style={styles.nameRow}>
      <Text style={styles.name}>{name}, {age}</Text>
      {showDistanceHint && onRequestLocation ? (
        <Pressable
          onPress={onRequestLocation}
          disabled={isLocationUpdating}
          hitSlop={DISTANCE_HIT_SLOP}
        >
          <Text style={styles.distanceLink}>{distanceLabel}</Text>
        </Pressable>
      ) : (
        <Text style={styles.distance}>{distanceLabel}</Text>
      )}
    </View>
    <View style={styles.majorRow}>
      <MaterialIcons name="school" size={card.majorIconSize} color={colors.majorText} />
      <Text style={styles.majorText}>{major}</Text>
    </View>
    <Text style={styles.bio} numberOfLines={card.bioMaxLines}>{bio}</Text>
    <View style={styles.tagsRow}>
      {interests.map((item) => (
        <View key={item.label} style={styles.tag}>
          <MaterialIcons
            name={item.icon as keyof typeof MaterialIcons.glyphMap}
            size={tag.iconSize}
            color={colors.tagText}
          />
          <Text style={styles.tagLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  </View>
));

const styles = StyleSheet.create({
  content: {
    justifyContent: 'flex-end',
    padding: card.padding,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: NAME_ROW_GAP,
  },
  name: {
    fontWeight: '700',
    fontSize: card.nameSize,
    color: colors.nameText,
  },
  distance: {
    fontSize: 12,
    color: colors.majorText,
    fontWeight: '500',
  },
  distanceLink: {
    fontSize: 12,
    color: DATING_COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  majorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: MAJOR_ROW_GAP,
    marginTop: MAJOR_ROW_MARGIN_TOP,
  },
  majorText: {
    fontWeight: '500',
    fontSize: card.majorSize,
    color: colors.majorText,
  },
  bio: {
    marginTop: BIO_MARGIN_TOP,
    fontSize: card.bioSize,
    lineHeight: card.bioLineHeight,
    color: colors.bioText,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tag.gap,
    marginTop: TAGS_MARGIN_TOP,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    height: tag.height,
    paddingHorizontal: tag.paddingH,
    gap: TAG_GAP_INNER,
    borderRadius: tag.borderRadius,
    backgroundColor: colors.tagBg,
  },
  tagLabel: {
    fontWeight: '600',
    fontSize: tag.fontSize,
    color: colors.tagText,
  },
});
