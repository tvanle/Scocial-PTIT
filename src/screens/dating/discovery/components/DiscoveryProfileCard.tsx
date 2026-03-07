import React from 'react';
import { View, Text, StyleSheet, ImageBackground, TouchableOpacity, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.discovery;
const card = DATING_LAYOUT.discovery.card;
const tag = DATING_LAYOUT.discovery.tag;

interface ProfileData {
  name: string;
  age: number;
  major: string;
  bio: string;
  imageUrl: string;
  interests: { icon: string; label: string }[];
}

interface DiscoveryProfileCardProps {
  profile: ProfileData;
  onPress?: () => void;
}

export const DiscoveryProfileCard = React.memo<DiscoveryProfileCardProps>(({ profile, onPress }) => (
  <Pressable
    style={[styles.card, { borderRadius: card.borderRadius, borderColor: colors.cardBorder }]}
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
      <TouchableOpacity
        style={[
          styles.infoBtn,
          {
            width: card.infoBtnSize,
            height: card.infoBtnSize,
            backgroundColor: colors.infoBtnBg,
            borderColor: colors.infoBtnBorder,
          },
        ]}
        activeOpacity={0.7}
      >
        <MaterialIcons name="info-outline" size={card.infoBtnSize / 2} color={colors.nameText} />
      </TouchableOpacity>

      <LinearGradient
        colors={colors.gradientColors as unknown as string[]}
        style={styles.gradient}
      >
        <View style={[styles.content, { padding: card.padding }]}>
          <Text style={[styles.name, { fontSize: card.nameSize, color: colors.nameText }]}>
            {profile.name}, {profile.age}
          </Text>

          <View style={styles.majorRow}>
            <MaterialIcons name="school" size={card.majorIconSize} color={colors.majorText} />
            <Text style={[styles.majorText, { fontSize: card.majorSize, color: colors.majorText }]}>
              {profile.major}
            </Text>
          </View>

          <Text
            style={[
              styles.bio,
              { fontSize: card.bioSize, lineHeight: card.bioLineHeight, color: colors.bioText },
            ]}
            numberOfLines={card.bioMaxLines}
          >
            {profile.bio}
          </Text>

          <View style={[styles.tagsRow, { gap: tag.gap }]}>
            {profile.interests.map((item) => (
              <View
                key={item.label}
                style={[
                  styles.tag,
                  {
                    height: tag.height,
                    paddingHorizontal: tag.paddingH,
                    borderRadius: tag.borderRadius,
                    backgroundColor: colors.tagBg,
                  },
                ]}
              >
                <MaterialIcons
                  name={item.icon as keyof typeof MaterialIcons.glyphMap}
                  size={tag.iconSize}
                  color={colors.tagText}
                />
                <Text style={[styles.tagLabel, { fontSize: tag.fontSize, color: colors.tagText }]}>
                  {item.label}
                </Text>
              </View>
            ))}
          </View>
        </View>
      </LinearGradient>
    </ImageBackground>
  </Pressable>
));

const styles = StyleSheet.create({
  card: {
    flex: 1,
    overflow: 'hidden',
    borderWidth: 1,
  },
  image: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  infoBtn: {
    position: 'absolute',
    top: 16,
    right: 16,
    borderRadius: 9999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    justifyContent: 'flex-end',
    minHeight: '50%',
  },
  content: {
    justifyContent: 'flex-end',
  },
  name: {
    fontWeight: '700',
  },
  majorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  majorText: {
    fontWeight: '500',
  },
  bio: {
    marginTop: 16,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagLabel: {
    fontWeight: '600',
  },
});
