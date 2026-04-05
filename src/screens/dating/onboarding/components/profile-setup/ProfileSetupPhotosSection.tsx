import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../../constants/dating/theme';
import { DATING_STRINGS } from '../../../../../constants/dating';
import { BRAND } from '../../../../../constants/dating/design-system/colors';

const layout = DATING_LAYOUT.profileSetup.photos;
const colors = DATING_COLORS.profileSetup;

export interface PhotoSlot {
  uri: string;
  order: number;
  isExisting?: boolean;
  id?: string;
}

interface ProfileSetupPhotosSectionProps {
  photos: PhotoSlot[];
  onPickPhoto: (slotIndex: number) => void;
  uploadingSlot: number | null;
  onRemovePhoto?: (slotIndex: number) => void;
}

export const ProfileSetupPhotosSection: React.FC<ProfileSetupPhotosSectionProps> = ({
  photos,
  onPickPhoto,
  uploadingSlot,
  onRemovePhoto,
}) => {
  const photoByOrder = (order: number) => photos.find((p) => p.order === order);
  const photoCount = photos.length;

  const renderSlot = (order: number, isMain: boolean) => {
    const photo = photoByOrder(order);
    const isUploading = uploadingSlot === order;
    const slotStyle = isMain ? styles.mainPhotoSlot : styles.smallPhotoSlot;

    return (
      <TouchableOpacity
        key={order}
        style={[
          slotStyle,
          photo ? styles.slotWithPhoto : styles.slotEmpty,
          isMain && !photo && styles.mainSlotEmpty,
        ]}
        activeOpacity={0.85}
        onPress={() => onPickPhoto(order)}
        disabled={isUploading}
      >
        {photo ? (
          <>
            <Image source={{ uri: photo.uri }} style={styles.photoImage} resizeMode="cover" />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.3)']}
              style={styles.photoGradient}
            />
            {isUploading && (
              <View style={styles.uploadingOverlay}>
                <ActivityIndicator color="#fff" size="large" />
                <Text style={styles.uploadingText}>Uploading...</Text>
              </View>
            )}
            {onRemovePhoto && !isUploading && (
              <TouchableOpacity
                style={styles.removeBtn}
                onPress={() => onRemovePhoto(order)}
                accessibilityRole="button"
                activeOpacity={0.8}
              >
                <MaterialIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            )}
            {isMain && (
              <View style={styles.mainBadgeOnPhoto}>
                <MaterialIcons name="star" size={12} color="#fff" />
                <Text style={styles.mainBadgeText}>Main</Text>
              </View>
            )}
          </>
        ) : isUploading ? (
          <View style={styles.uploadingEmpty}>
            <ActivityIndicator color={BRAND.primary} size="large" />
          </View>
        ) : isMain ? (
          <View style={styles.mainEmptyContent}>
            <View style={styles.mainIconWrap}>
              <MaterialIcons name="photo-camera" size={32} color="#fff" />
            </View>
            <Text style={styles.mainLabel}>Add your best photo</Text>
            <Text style={styles.mainHint}>This will be shown first</Text>
          </View>
        ) : (
          <View style={styles.smallEmptyContent}>
            <View style={styles.smallIconWrap}>
              <MaterialIcons name="add" size={24} color={BRAND.primary} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <View style={styles.titleRow}>
          <MaterialIcons name="photo-library" size={20} color={BRAND.primary} />
          <Text style={styles.sectionTitle}>Photos</Text>
        </View>
        <View style={styles.photoCountBadge}>
          <Text style={styles.photoCountText}>{photoCount}/4</Text>
        </View>
      </View>
      <Text style={styles.sectionHint}>
        Add at least 2 photos. More photos = more matches!
      </Text>
      <View style={styles.photoGrid}>
        {renderSlot(0, true)}
        <View style={styles.smallSlotsColumn}>
          {[1, 2, 3].map((i) => renderSlot(i, false))}
        </View>
      </View>
      {photoCount < 2 && (
        <View style={styles.warningBanner}>
          <MaterialIcons name="info-outline" size={16} color={BRAND.primary} />
          <Text style={styles.warningText}>Add at least 2 photos to continue</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.06,
        shadowRadius: 12,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
  photoCountBadge: {
    backgroundColor: BRAND.primaryMuted,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  photoCountText: {
    fontSize: 12,
    fontWeight: '700',
    color: BRAND.primary,
  },
  sectionHint: {
    fontSize: 13,
    color: '#666',
    marginBottom: 16,
    lineHeight: 18,
  },
  photoGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  mainPhotoSlot: {
    width: '62%',
    aspectRatio: 0.85,
    borderRadius: 16,
    overflow: 'hidden',
  },
  smallSlotsColumn: {
    flex: 1,
    gap: 10,
  },
  smallPhotoSlot: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    overflow: 'hidden',
  },
  slotWithPhoto: {
    backgroundColor: '#000',
  },
  slotEmpty: {
    backgroundColor: '#F7F7F7',
    borderWidth: 2,
    borderStyle: 'dashed',
    borderColor: '#E0E0E0',
  },
  mainSlotEmpty: {
    backgroundColor: BRAND.primaryMuted,
    borderColor: BRAND.primary,
    borderWidth: 2,
  },
  photoImage: {
    ...StyleSheet.absoluteFillObject,
  },
  photoGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 60,
  },
  mainEmptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  mainIconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: BRAND.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    ...Platform.select({
      ios: {
        shadowColor: BRAND.primary,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  mainLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: BRAND.primary,
    textAlign: 'center',
  },
  mainHint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
    textAlign: 'center',
  },
  smallEmptyContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 68, 88, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainBadgeOnPhoto: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: BRAND.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  mainBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#fff',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  uploadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadingText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  uploadingEmpty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  warningBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: BRAND.primaryMuted,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  warningText: {
    fontSize: 13,
    color: BRAND.primary,
    fontWeight: '500',
    flex: 1,
  },
});
