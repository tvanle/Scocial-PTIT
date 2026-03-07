import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail.chips;

interface DetailInterestsProps {
  interests: string[];
}

export const DetailInterests = React.memo<DetailInterestsProps>(({ interests }) => {
  if (interests.length === 0) return null;

  return (
    <View style={[styles.container, { gap: layout.gap }]}>
      {interests.map((tag) => (
        <View
          key={tag}
          style={[
            styles.chip,
            {
              height: layout.height,
              paddingHorizontal: layout.paddingH,
              borderRadius: layout.borderRadius,
              backgroundColor: colors.chipBg,
              borderColor: colors.chipBorder,
            },
          ]}
        >
          <Text style={[styles.chipText, { fontSize: layout.fontSize, color: colors.chipText }]}>
            #{tag}
          </Text>
        </View>
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  chipText: {
    fontWeight: '600',
  },
});
