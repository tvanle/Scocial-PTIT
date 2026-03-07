import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail.identity;

interface DetailIdentityProps {
  name: string;
  age: number;
  location?: string;
  isVerified?: boolean;
}

export const DetailIdentity = React.memo<DetailIdentityProps>(({
  name,
  age,
  location,
  isVerified,
}) => (
  <View style={[styles.container, { paddingHorizontal: layout.paddingH, paddingTop: layout.paddingTop }]}>
    <View style={styles.nameRow}>
      <Text style={[styles.name, { fontSize: layout.nameSize, color: colors.name }]}>
        {name}, {age}
      </Text>
      {isVerified && (
        <MaterialIcons name="verified" size={layout.verifiedSize} color={colors.verified} />
      )}
    </View>

    {location ? (
      <View style={[styles.locationRow, { marginTop: layout.locationMarginTop, gap: layout.locationGap }]}>
        <MaterialIcons name="place" size={layout.locationIconSize} color={colors.locationIcon} />
        <Text style={[styles.locationText, { fontSize: layout.locationTextSize, color: colors.locationText }]}>
          {location}
        </Text>
      </View>
    ) : null}
  </View>
));

const styles = StyleSheet.create({
  container: {},
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  name: {
    fontWeight: '700',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontWeight: '400',
  },
});
