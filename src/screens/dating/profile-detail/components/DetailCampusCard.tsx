import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../constants/dating/strings';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail.campus;
const strings = DATING_STRINGS.profileDetail;

interface DetailCampusCardProps {
  department?: string;
}

export const DetailCampusCard = React.memo<DetailCampusCardProps>(({ department }) => {
  if (!department) return null;

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: layout.radius,
          padding: layout.padding,
          backgroundColor: colors.campusBg,
          borderColor: colors.campusBorder,
          gap: layout.gap,
        },
      ]}
    >
      <MaterialIcons name="account-balance" size={layout.iconSize} color={colors.campusIcon} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { fontSize: layout.titleSize, color: colors.campusTitle }]}>
          {strings.campusStatus}
        </Text>
        <Text
          style={[
            styles.body,
            {
              fontSize: layout.bodySize,
              lineHeight: layout.bodyLineHeight,
              color: colors.campusBody,
            },
          ]}
        >
          {strings.campusActive(department)}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    fontWeight: '700',
  },
  body: {
    marginTop: 2,
  },
});
