import React from 'react';
import {
  View,
  ImageBackground,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.profileDetail;
const layout = DATING_LAYOUT.profileDetail;
const SCREEN_HEIGHT = Dimensions.get('window').height;

interface DetailHeroImageProps {
  imageUrl: string;
  onBack: () => void;
}

const HEADER_ACTIONS: Array<{ icon: keyof typeof MaterialIcons.glyphMap; label: string }> = [
  { icon: 'filter-list', label: 'Filter' },
  { icon: 'place', label: 'Location' },
  { icon: 'refresh', label: 'Refresh' },
  { icon: 'more-vert', label: 'More options' },
];

export const DetailHeroImage = React.memo<DetailHeroImageProps>(({ imageUrl, onBack }) => {
  const insets = useSafeAreaInsets();

  return (
    <ImageBackground
      source={{ uri: imageUrl }}
      style={[styles.image, { height: SCREEN_HEIGHT * layout.image.heightRatio }]}
      resizeMode="cover"
    >
      <View style={[styles.overlay, { paddingTop: insets.top + layout.header.paddingTop }]}>
        <View style={[styles.headerRow, { paddingHorizontal: layout.header.paddingH }]}>
          <TouchableOpacity
            style={[
              styles.headerBtn,
              {
                width: layout.header.btnSize,
                height: layout.header.btnSize,
                borderRadius: layout.header.btnRadius,
                backgroundColor: colors.headerBtnBg,
              },
            ]}
            onPress={onBack}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Go back"
          >
            <MaterialIcons name="arrow-back" size={layout.header.iconSize} color={colors.headerIcon} />
          </TouchableOpacity>

          <View style={[styles.actionsRow, { gap: layout.header.topRowGap }]}>
            {HEADER_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.icon}
                style={[
                  styles.headerBtn,
                  {
                    width: layout.header.btnSize,
                    height: layout.header.btnSize,
                    borderRadius: layout.header.btnRadius,
                    backgroundColor: colors.headerBtnBg,
                  },
                ]}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={action.label}
              >
                <MaterialIcons name={action.icon} size={layout.header.iconSize} color={colors.headerIcon} />
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </ImageBackground>
  );
});

const styles = StyleSheet.create({
  image: {
    width: '100%',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.15,
        shadowRadius: 4,
      },
      android: { elevation: 3 },
    }),
  },
});
