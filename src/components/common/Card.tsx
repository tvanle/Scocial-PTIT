import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { Colors, BorderRadius, Spacing, Shadow } from '../../constants/theme';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
  shadow?: 'none' | 'small' | 'medium' | 'large';
  borderRadius?: 'none' | 'small' | 'medium' | 'large';
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = 'medium',
  shadow = 'small',
  borderRadius = 'medium',
}) => {
  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return Spacing.sm;
      case 'medium':
        return Spacing.lg;
      case 'large':
        return Spacing.xl;
      default:
        return Spacing.lg;
    }
  };

  const getShadow = (): ViewStyle => {
    switch (shadow) {
      case 'none':
        return {};
      case 'small':
        return Shadow.small;
      case 'medium':
        return Shadow.medium;
      case 'large':
        return Shadow.large;
      default:
        return Shadow.small;
    }
  };

  const getBorderRadius = (): number => {
    switch (borderRadius) {
      case 'none':
        return 0;
      case 'small':
        return BorderRadius.sm;
      case 'medium':
        return BorderRadius.md;
      case 'large':
        return BorderRadius.lg;
      default:
        return BorderRadius.md;
    }
  };

  const cardStyle: ViewStyle = {
    ...styles.card,
    padding: getPadding(),
    borderRadius: getBorderRadius(),
    ...getShadow(),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.9}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.cardBackground,
  },
});

export default Card;
