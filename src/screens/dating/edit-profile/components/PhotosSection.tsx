import React, { useCallback, useState } from 'react';
import { View, Image, Pressable, StyleSheet, ScrollView, Text, Alert, Switch } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import {
  DATING_COLORS,
  DATING_SPACING,
  DATING_RADIUS,
  DATING_LAYOUT_TOKENS as L,
  DATING_FONT_SIZE,
} from '../../../../constants/dating';

interface PhotosSectionProps {
  photos: string[];
  onPhotosUpdate: (photos: string[]) => void;
}

export const PhotosSection: React.FC<PhotosSectionProps> = React.memo(
  ({ photos, onPhotosUpdate }) => {
    const [autoReorderEnabled, setAutoReorderEnabled] = useState(false);

    const handleToggleAutoReorder = useCallback((value: boolean) => {
      setAutoReorderEnabled(value);
      if (value && photos.length > 1) {
        Alert.alert(
          'Tự động sắp xếp',
          'Ảnh sẽ được sắp xếp dựa trên lượt tương tác. Hình ảnh nổi bật nhất sẽ được đặt ở trước.'
        );
      }
    }, [photos]);

    const handleAddPhoto = useCallback(async () => {
      try {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Lỗi', 'Cần cấp quyền truy cập thư viện ảnh');
          return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
          const uri = result.assets[0].uri;
          if (photos.length < 5) {
            onPhotosUpdate([...photos, uri]);
          } else {
            Alert.alert('Thông báo', 'Tối đa 5 ảnh');
          }
        }
      } catch (err) {
        console.error('Error picking image:', err);
        Alert.alert('Lỗi', 'Không thể chọn ảnh');
      }
    }, [photos, onPhotosUpdate]);

    const handleRemovePhoto = useCallback(
      (index: number) => {
        const updated = photos.filter((_, i) => i !== index);
        onPhotosUpdate(updated);
      },
      [photos, onPhotosUpdate]
    );

    return (
      <View style={styles.container}>
        <Text style={styles.sectionTitle}>Ảnh của bạn</Text>
        <Text style={styles.hint}>Thêm ít nhất 2 ảnh để tiếp tục</Text>

        {/* Main Photo */}
        <Pressable
          style={[
            styles.mainPhotoSlot,
            !photos[0] && styles.emptySlot,
          ]}
          onPress={handleAddPhoto}
        >
          {photos[0] ? (
            <>
              <Image source={{ uri: photos[0] }} style={styles.photo} />
              <View style={styles.mainPhotoLabel}>
                <Text style={styles.mainPhotoLabelText}>Main Photo</Text>
              </View>
            </>
          ) : (
            <Ionicons
              name="image-outline"
              size={L.mainIconSize}
              color={DATING_COLORS.light.textMuted}
            />
          )}
        </Pressable>

        {/* Additional Photos Grid */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.gridContainer}
          scrollEventThrottle={16}
        >
          {[...Array(4)].map((_, index) => (
            <View key={`photo-${index + 1}`} style={styles.gridItem}>
              <Pressable
                style={[
                  styles.photoSlot,
                  !photos[index + 1] && styles.emptySlot,
                ]}
                onPress={handleAddPhoto}
              >
                {photos[index + 1] ? (
                  <>
                    <Image source={{ uri: photos[index + 1] }} style={styles.photo} />
                    <Pressable
                      style={styles.removeBtn}
                      onPress={() => handleRemovePhoto(index + 1)}
                    >
                      <Ionicons name="close" size={16} color={DATING_COLORS.light.background} />
                    </Pressable>
                  </>
                ) : (
                  <Ionicons
                    name="image-outline"
                    size={L.placeholderWidth}
                    color={DATING_COLORS.light.textMuted}
                  />
                )}
              </Pressable>
            </View>
          ))}
        </ScrollView>

        {/* Auto-reorder Toggle */}
        {photos.length >= 2 && (
          <View style={styles.autoReorderToggleContainer}>
            <View style={styles.autoReorderLabelGroup}>
              <Ionicons
                name="sync-outline"
                size={20}
                color={DATING_COLORS.primary}
                style={{ marginRight: DATING_SPACING.sm }}
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.autoReorderLabel}>Tự động sắp xếp lại ảnh</Text>
                <Text style={styles.autoReorderSubtitle}>Sắp xếp ảnh theo lượt tương tác</Text>
              </View>
            </View>
            <Switch
              value={autoReorderEnabled}
              onValueChange={handleToggleAutoReorder}
              trackColor={{ false: '#e0e0e0', true: DATING_COLORS.primary }}
            />
          </View>
        )}

        {/* Photo Requirement Info */}
        {photos.length < 3 && (
          <View style={styles.infoContainer}>
            <Ionicons
              name="information-circle"
              size={16}
              color={DATING_COLORS.light.textSecondary}
              style={{ marginRight: DATING_SPACING.xs }}
            />
            <Text style={styles.infoText}>
              Hồ sơ có từ 3 ảnh trở lên sẽ hiển thị với nhiều người
              hơn. {'\n'}Hãy chọn những tấm hình đẹp nhất của bạn nhé!
            </Text>
          </View>
        )}
      </View>
    );
  }
);

const styles = StyleSheet.create({
  container: {
    marginBottom: DATING_SPACING.xl,
  },
  sectionTitle: {
    fontSize: DATING_FONT_SIZE.title,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
    marginBottom: DATING_SPACING.xs,
  },
  hint: {
    fontSize: DATING_FONT_SIZE.body,
    color: DATING_COLORS.light.textSecondary,
    marginBottom: DATING_SPACING.md,
  },
  mainPhotoSlot: {
    width: '100%',
    height: 320,
    borderRadius: DATING_RADIUS.lg,
    backgroundColor: '#EEEEEE',
    borderWidth: L.slotBorderWidth,
    borderColor: DATING_COLORS.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: DATING_SPACING.lg,
  },
  photoSlot: {
    width: 100,
    height: 100,
    borderRadius: DATING_RADIUS.lg,
    backgroundColor: '#EEEEEE',
    borderWidth: L.slotBorderWidth,
    borderColor: DATING_COLORS.light.border,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  emptySlot: {
    backgroundColor: '#F5F5F5',
  },
  photo: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  mainPhotoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: DATING_SPACING.sm,
    paddingHorizontal: DATING_SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  mainPhotoLabelText: {
    fontSize: DATING_FONT_SIZE.small,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  removeBtn: {
    position: 'absolute',
    top: DATING_SPACING.xs,
    right: DATING_SPACING.xs,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: DATING_COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridContainer: {
    flexGrow: 0,
    gap: DATING_SPACING.md,
    marginBottom: DATING_SPACING.lg,
    paddingRight: DATING_SPACING.lg,
  },
  gridItem: {
    width: 100,
  },
  autoReorderToggleContainer: {
    flexDirection: 'row',
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.md,
    borderRadius: DATING_RADIUS.md,
    backgroundColor: DATING_COLORS.light.background,
    borderWidth: 1,
    borderColor: DATING_COLORS.light.border,
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: DATING_SPACING.lg,
  },
  autoReorderLabelGroup: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'center',
  },
  autoReorderLabel: {
    fontSize: DATING_FONT_SIZE.body,
    fontWeight: '600',
    color: DATING_COLORS.light.textPrimary,
  },
  autoReorderSubtitle: {
    fontSize: DATING_FONT_SIZE.small,
    color: DATING_COLORS.light.textSecondary,
    marginTop: 2,
  },
  infoContainer: {
    flexDirection: 'row',
    paddingHorizontal: DATING_SPACING.md,
    paddingVertical: DATING_SPACING.sm,
    borderRadius: DATING_RADIUS.md,
    backgroundColor: '#F0F0F0',
  },
  infoText: {
    fontSize: DATING_FONT_SIZE.small,
    color: DATING_COLORS.light.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
});
