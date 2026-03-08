import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail.identity;

interface DetailIdentityProps {
  name: string;
  age: number;
  location?: string;
  distanceKm?: number | null;
  isVerified?: boolean;
  /** Khi có, "Bật vị trí để xem khoảng cách" sẽ thành nút bấm */
  onRequestLocation?: () => void;
  isLocationUpdating?: boolean;
}

export const DetailIdentity = React.memo<DetailIdentityProps>(({
  name,
  age,
  location,
  distanceKm,
  isVerified,
  onRequestLocation,
  isLocationUpdating,
}) => {
  const hasDistance = distanceKm != null && distanceKm > 0;
  const distanceLabel = hasDistance
    ? `Cách bạn ${distanceKm} km`
    : isLocationUpdating
      ? 'Đang cập nhật vị trí...'
      : 'Bật vị trí để xem khoảng cách';
  const showLocationRow = location || distanceKm !== undefined;
  const locationLineText = [location, distanceLabel].filter(Boolean).join(' • ');

  return (
    <View style={[styles.container, { paddingHorizontal: layout.paddingH, paddingTop: layout.paddingTop }]}>
      <View style={styles.nameRow}>
        <Text style={[styles.name, { fontSize: layout.nameSize, color: colors.name }]}>
          {name}, {age}
        </Text>
        {isVerified && (
          <MaterialIcons name="verified" size={layout.verifiedSize} color={colors.verified} />
        )}
      </View>

      {showLocationRow ? (
        <View style={[styles.locationRow, { marginTop: layout.locationMarginTop, gap: layout.locationGap }]}>
          <MaterialIcons name="place" size={layout.locationIconSize} color={colors.locationIcon} />
          {!hasDistance && onRequestLocation ? (
            <Pressable onPress={onRequestLocation} disabled={isLocationUpdating} hitSlop={8}>
              <Text style={[styles.locationLink, { fontSize: layout.locationTextSize }]}>{locationLineText}</Text>
            </Pressable>
          ) : (
            <Text style={[styles.locationText, { fontSize: layout.locationTextSize, color: colors.locationText }]}>
              {locationLineText}
            </Text>
          )}
        </View>
      ) : null}
    </View>
  );
});

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
  locationLink: {
    fontWeight: '500',
    color: DATING_COLORS.primary,
    textDecorationLine: 'underline',
  },
});
