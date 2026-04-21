import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { BorderRadius, Spacing } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  padding?: 'none' | 'small' | 'medium' | 'large';
  variant?: 'default' | 'outlined';
}

const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  padding = 'medium',
  variant = 'default',
}) => {
  const { colors } = useTheme();

  const getPadding = (): number => {
    switch (padding) {
      case 'none':
        return 0;
      case 'small':
        return Spacing.sm;
      case 'medium':
        return Spacing.md;
      case 'large':
        return Spacing.lg;
      default:
        return Spacing.md;
    }
  };

  const cardStyle: ViewStyle = {
    ...styles.card,
    backgroundColor: colors.background,
    ...(variant === 'outlined' ? { borderWidth: 1, borderColor: colors.gray200 } : {}),
    padding: getPadding(),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.7}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.md,
  },
});

export default Card;
