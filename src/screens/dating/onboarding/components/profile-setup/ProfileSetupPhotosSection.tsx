import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating';

const layout = DATING_LAYOUT.profileSetup.photos;
const colors = DATING_COLORS.profileSetup;

export interface PhotoSlot {
  uri: string;
  order: number;
}

interface ProfileSetupPhotosSectionProps {
  photos: PhotoSlot[];
  onPickPhoto: (slotIndex: number) => void;
  uploadingSlot: number | null;
}

export const ProfileSetupPhotosSection: React.FC<ProfileSetupPhotosSectionProps> = ({
  photos,
  onPickPhoto,
  uploadingSlot,
}) => {
  const photoByOrder = (order: number) => photos.find((p) => p.order === order);

  const renderSlot = (order: number, isMain: boolean) => {
    const photo = photoByOrder(order);
    const isUploading = uploadingSlot === order;
    const slotStyle = isMain ? styles.mainPhotoSlot : styles.smallPhotoSlot;

    return (
      <TouchableOpacity
        key={order}
        style={[
          slotStyle,
          {
            borderWidth: photo ? 0 : layout.slotBorderWidth,
            borderRadius: layout.slotBorderRadius,
            backgroundColor: colors.photoSlotBg,
            borderColor: colors.photoSlotBorder,
          },
        ]}
        activeOpacity={0.8}
        onPress={() => onPickPhoto(order)}
        disabled={isUploading}
      >
        {photo ? (
          <>
            <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} resizeMode="cover" />
            {isUploading && (
              <View style={[styles.uploadingOverlay, { backgroundColor: layout.overlayBg }]}>
                <ActivityIndicator color={colors.buttonText} />
              </View>
            )}
          </>
        ) : isUploading ? (
          <ActivityIndicator color={DATING_COLORS.primary} />
        ) : isMain ? (
          <>
            <View
              style={[
                styles.mainIconWrap,
                {
                  width: layout.mainIconSize,
                  height: layout.mainIconSize,
                  borderRadius: layout.mainIconSize / 2,
                  backgroundColor: DATING_COLORS.primary,
                },
              ]}
            >
              <MaterialIcons name="photo-camera" size={layout.cameraIconSize} color={colors.buttonText} />
            </View>
            <Text
              style={[
                styles.mainLabel,
                {
                  color: colors.mainPhotoLabel,
                  fontSize: layout.mainLabelFontSize,
                  marginTop: layout.labelMarginTop,
                },
              ]}
            >
              {DATING_STRINGS.profileSetup.mainPhoto}
            </Text>
          </>
        ) : (
          <MaterialIcons name="add" size={layout.smallIconSize} color={DATING_COLORS.primary} />
        )}

        {isMain && !photo && (
          <View
            style={[
              styles.mainBadge,
              {
                bottom: layout.badgeOffset,
                right: layout.badgeOffset,
                width: layout.badgeSize,
                height: layout.badgeSize,
                borderRadius: layout.badgeSize / 2,
              },
            ]}
          >
            <MaterialIcons name="star" size={layout.starIconSize} color={colors.buttonText} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
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
        {renderSlot(0, true)}
        <View style={[styles.smallSlotsColumn, { gap: layout.gridGap }]}>
          {[1, 2, 3].map((i) => renderSlot(i, false))}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {},
  sectionHeader: {},
  sectionTitle: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  sectionHint: {
    fontSize: layout.mainLabelFontSize,
    marginTop: layout.sectionGap / 3,
  },
  photoGrid: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  mainPhotoSlot: {
    width: '65%',
    aspectRatio: layout.mainSlotAspectRatio,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  smallSlotsColumn: {
    flex: 1,
    flexDirection: 'column',
  },
  smallPhotoSlot: {
    width: '100%',
    aspectRatio: layout.mainSlotAspectRatio,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mainIconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainLabel: {
    fontWeight: '600',
  },
  mainBadge: {
    position: 'absolute',
    backgroundColor: DATING_COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
