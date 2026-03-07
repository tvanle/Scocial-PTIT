import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { DATING_COLORS, DATING_LAYOUT } from '../../../../constants/dating/theme';

const colors = DATING_COLORS.discovery;
const layout = DATING_LAYOUT.discovery.actions;

interface DiscoveryActionsProps {
  onSkip?: () => void;
  onLike?: () => void;
}

export const DiscoveryActions: React.FC<DiscoveryActionsProps> = ({ onSkip, onLike }) => (
  <View
    style={[
      styles.container,
      { gap: layout.gap, paddingBottom: layout.paddingBottom, paddingTop: layout.paddingTop },
    ]}
  >
    <TouchableOpacity
      style={[
        styles.btn,
        styles.btnShadow,
        {
          width: layout.skipSize,
          height: layout.skipSize,
          backgroundColor: colors.skipBtnBg,
          borderColor: colors.skipBtnBorder,
        },
      ]}
      activeOpacity={0.8}
      onPress={onSkip}
    >
      <MaterialIcons name="close" size={layout.skipIconSize} color={colors.skipIcon} />
    </TouchableOpacity>

    <TouchableOpacity
      style={[
        styles.btn,
        styles.heartShadow,
        {
          width: layout.starSize,
          height: layout.starSize,
          backgroundColor: colors.starBtnBg,
        },
      ]}
      activeOpacity={0.85}
      onPress={onLike}
    >
      <MaterialIcons name="favorite" size={layout.starIconSize} color={colors.starIcon} />
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btn: {
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  btnShadow: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
  heartShadow: {
    ...Platform.select({
      ios: {
        shadowColor: colors.starBtnShadow,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 1,
        shadowRadius: 25,
      },
      android: { elevation: 10 },
    }),
  },
});
