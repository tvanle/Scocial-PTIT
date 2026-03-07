import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating/strings';

const layout = DATING_LAYOUT.profileSetup.photos;
const colors = DATING_COLORS.profileSetup;

export const ProfileSetupPhotosSection: React.FC = () => (
  <View style={styles.section}>
    <View style={[styles.sectionHeader, { marginBottom: layout.sectionMarginBottom }]}>
      <Text style={[styles.sectionTitle, { color: colors.sectionTitle }]}>
        {DATING_STRINGS.profileSetup.photos}
      </Text>
      <Text style={[styles.sectionHint, { color: colors.sectionHint }]}>
        {DATING_STRINGS.profileSetup.photosHint}
      </Text>
    </View>
    <View style={[styles.photoGrid, { gap: layout.gridGap }]}>
      <TouchableOpacity
        style={[
          styles.mainPhotoSlot,
          {
            borderWidth: layout.slotBorderWidth,
            borderRadius: layout.slotBorderRadius,
            backgroundColor: colors.photoSlotBg,
            borderColor: colors.photoSlotBorder,
          },
        ]}
        activeOpacity={0.8}
      >
        <View
          style={[
            styles.mainPhotoIconWrap,
            {
              width: layout.mainIconSize,
              height: layout.mainIconSize,
              borderRadius: layout.mainIconSize / 2,
              backgroundColor: DATING_COLORS.primary,
            },
          ]}
        >
          <MaterialIcons name="photo-camera" size={24} color={colors.buttonText} />
        </View>
        <Text
          style={[
            styles.mainPhotoLabel,
            { color: colors.mainPhotoLabel, fontSize: layout.mainLabelFontSize },
          ]}
        >
          {DATING_STRINGS.profileSetup.mainPhoto}
        </Text>
      </TouchableOpacity>
      <View style={[styles.smallSlotsColumn, { gap: layout.gridGap }]}>
        {[1, 2, 3].map((i) => (
          <TouchableOpacity
            key={i}
            style={[
              styles.smallPhotoSlot,
              {
                borderWidth: layout.slotBorderWidth,
                borderRadius: layout.slotBorderRadius,
                backgroundColor: colors.photoSlotBg,
                borderColor: colors.photoSlotBorder,
              },
            ]}
            activeOpacity={0.8}
          >
            <MaterialIcons name="add" size={layout.smallIconSize} color={DATING_COLORS.primary} />
          </TouchableOpacity>
        ))}
      </View>
    </View>
  </View>
);

const styles = StyleSheet.create({
  section: {},
  sectionHeader: {},
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: 14,
    marginTop: 4,
  },
  photoGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainPhotoSlot: {
    width: '65%',
    aspectRatio: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallSlotsColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  mainPhotoIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainPhotoLabel: {
    fontWeight: '600',
    marginTop: 8,
  },
  smallPhotoSlot: {
    width: '100%',
    aspectRatio: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
