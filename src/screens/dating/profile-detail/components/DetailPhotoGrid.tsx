import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { DATING_LAYOUT } from '../../../../constants/dating/theme';

const layout = DATING_LAYOUT.profileDetail.photoGrid;
const SCREEN_WIDTH = Dimensions.get('window').width;

interface Photo {
  url: string;
  order?: number;
}

interface DetailPhotoGridProps {
  photos: Photo[];
}

export const DetailPhotoGrid = React.memo<DetailPhotoGridProps>(({ photos }) => {
  if (photos.length <= 1) return null;

  return (
    <View style={[styles.container, { gap: layout.gap }]}>
      {photos.slice(1).map((photo, idx) => (
        <Image
          key={photo.url}
          source={{ uri: photo.url }}
          style={[styles.photo, { borderRadius: layout.borderRadius }]}
          resizeMode="cover"
          accessibilityRole="image"
          accessibilityLabel={`Photo ${idx + 2}`}
        />
      ))}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  photo: {
    width: SCREEN_WIDTH,
    aspectRatio: 3 / 4,
  },
});
