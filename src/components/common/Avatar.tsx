import React from 'react';
import { View, Image, Text, StyleSheet, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, FontWeight, Layout } from '../../constants/theme';

type AvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl' | 'profile';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: AvatarSize | number;
  showOnlineStatus?: boolean;
  isOnline?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  showEditButton?: boolean;
  onEditPress?: () => void;
}

const Avatar: React.FC<AvatarProps> = ({
  uri,
  name = '',
  size = 'md',
  showOnlineStatus = false,
  isOnline = false,
  onPress,
  style,
  showEditButton = false,
  onEditPress,
}) => {
  const avatarSize = typeof size === 'number' ? size : Layout.avatarSize[size];

  const getInitials = (fullName: string): string => {
    const names = fullName.trim().split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase();
    }
    return fullName.slice(0, 2).toUpperCase();
  };

  const getFontSize = (): number => {
    if (typeof size === 'number') {
      return Math.max(10, size / 3);
    }
    switch (size) {
      case 'xs':
        return FontSize.xs;
      case 'sm':
        return FontSize.sm;
      case 'md':
        return FontSize.md;
      case 'lg':
        return FontSize.lg;
      case 'xl':
        return FontSize.xl;
      case 'xxl':
        return FontSize.xxl;
      case 'profile':
        return FontSize.header;
      default:
        return FontSize.md;
    }
  };

  const getOnlineIndicatorSize = (): number => {
    if (typeof size === 'number') {
      return Math.max(6, size / 4);
    }
    switch (size) {
      case 'xs':
      case 'sm':
        return 8;
      case 'md':
        return 10;
      case 'lg':
        return 12;
      case 'xl':
      case 'xxl':
        return 14;
      case 'profile':
        return 18;
      default:
        return 10;
    }
  };

  const renderAvatar = () => (
    <View
      style={[
        styles.container,
        {
          width: avatarSize,
          height: avatarSize,
          borderRadius: avatarSize / 2,
        },
        style,
      ]}
    >
      {uri ? (
        <Image
          source={{ uri }}
          style={[
            styles.image,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        />
      ) : (
        <View
          style={[
            styles.placeholder,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: avatarSize / 2,
            },
          ]}
        >
          <Text style={[styles.initials, { fontSize: getFontSize() }]}>
            {getInitials(name)}
          </Text>
        </View>
      )}

      {showOnlineStatus && (
        <View
          style={[
            styles.onlineIndicator,
            {
              width: getOnlineIndicatorSize(),
              height: getOnlineIndicatorSize(),
              borderRadius: getOnlineIndicatorSize() / 2,
              backgroundColor: isOnline ? Colors.online : Colors.gray400,
            },
          ]}
        />
      )}

      {showEditButton && (
        <TouchableOpacity style={styles.editButton} onPress={onEditPress} activeOpacity={0.7}>
          <Ionicons name="camera" size={14} color={Colors.white} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        {renderAvatar()}
      </TouchableOpacity>
    );
  }

  return renderAvatar();
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  image: {
    backgroundColor: Colors.gray200,
  },
  placeholder: {
    backgroundColor: Colors.gray300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.white,
    fontWeight: FontWeight.semiBold,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  editButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.black,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
});

export default Avatar;
