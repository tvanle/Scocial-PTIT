import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail.infoCards;
const strings = DATING_STRINGS.profileDetail;

interface DetailInfoCardsProps {
  major?: string;
  yearLabel?: string;
}

interface CardData {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  value: string;
}

export const DetailInfoCards = React.memo<DetailInfoCardsProps>(({ major, yearLabel }) => {
  const cards: CardData[] = [];

  if (major) {
    cards.push({ icon: 'school', label: strings.major, value: major });
  }
  if (yearLabel) {
    cards.push({ icon: 'event', label: strings.year, value: yearLabel });
  }

  if (cards.length === 0) return null;

  return (
    <View
      style={[
        styles.container,
        { paddingHorizontal: layout.sectionPaddingH, marginTop: layout.marginTop, gap: layout.gap },
      ]}
    >
      {cards.map((card) => (
        <View
          key={card.label}
          style={[
            styles.card,
            styles.cardShadow,
            {
              borderRadius: layout.radius,
              paddingVertical: layout.cardPaddingV,
              paddingHorizontal: layout.cardPaddingH,
              backgroundColor: colors.infoCardBg,
              borderColor: colors.infoCardBorder,
            },
          ]}
        >
          <View
            style={[
              styles.iconWrap,
              {
                width: layout.iconBgSize,
                height: layout.iconBgSize,
                borderRadius: layout.iconBgSize / 2,
                backgroundColor: colors.infoCardIconBg,
              },
            ]}
          >
            <MaterialIcons name={card.icon} size={layout.iconSize / 2} color={colors.infoCardIconColor} />
          </View>
          <View>
            <Text style={[styles.label, { fontSize: layout.labelSize, color: colors.infoCardLabel }]}>
              {card.label}
            </Text>
            <Text style={[styles.value, { fontSize: layout.valueSize, color: colors.infoCardValue }]}>
              {card.value}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
  },
  card: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
  },
  cardShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.04,
        shadowRadius: 4,
      },
      android: { elevation: 1 },
    }),
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontWeight: '600',
    marginTop: 2,
  },
});
