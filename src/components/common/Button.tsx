import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
  TouchableOpacityProps,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, BorderRadius, FontSize, FontWeight, Layout, Spacing } from '../../constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'small' | 'medium' | 'large';
  loading?: boolean;
  disabled?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  style,
  textStyle,
  ...props
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {
      ...styles.base,
      ...getSizeStyle(),
      ...(fullWidth && styles.fullWidth),
    };

    if (isDisabled) {
      return { ...baseStyle, ...styles.disabled };
    }

    switch (variant) {
      case 'primary':
        return { ...baseStyle, ...styles.primary };
      case 'secondary':
        return { ...baseStyle, ...styles.secondary };
      case 'outline':
        return { ...baseStyle, ...styles.outline };
      case 'ghost':
        return { ...baseStyle, ...styles.ghost };
      default:
        return baseStyle;
    }
  };

  const getTextStyle = (): TextStyle => {
    const baseTextStyle: TextStyle = {
      ...styles.text,
      ...getTextSizeStyle(),
    };

    if (isDisabled) {
      return { ...baseTextStyle, ...styles.disabledText };
    }

    switch (variant) {
      case 'primary':
        return { ...baseTextStyle, ...styles.primaryText };
      case 'secondary':
        return { ...baseTextStyle, ...styles.secondaryText };
      case 'outline':
      case 'ghost':
        return { ...baseTextStyle, ...styles.outlineText };
      default:
        return baseTextStyle;
    }
  };

  const getIconColor = (): string => {
    if (isDisabled) return Colors.gray400;
    switch (variant) {
      case 'primary':
        return Colors.white;
      case 'secondary':
        return Colors.black;
      case 'outline':
      case 'ghost':
        return Colors.black;
      default:
        return Colors.white;
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case 'small':
        return styles.small;
      case 'large':
        return styles.large;
      default:
        return styles.medium;
    }
  };

  const getTextSizeStyle = (): TextStyle => {
    switch (size) {
      case 'small':
        return styles.smallText;
      case 'large':
        return styles.largeText;
      default:
        return styles.mediumText;
    }
  };

  const getIconSize = (): number => {
    switch (size) {
      case 'small':
        return 16;
      case 'large':
        return 22;
      default:
        return 18;
    }
  };

  const renderContent = () => (
    <View style={styles.contentContainer}>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? Colors.white : Colors.black}
          size="small"
        />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={getIconColor()}
              style={styles.iconLeft}
            />
          )}
          <Text style={[getTextStyle(), textStyle]}>
            {title}
          </Text>
          {icon && iconPosition === 'right' && (
            <Ionicons
              name={icon}
              size={getIconSize()}
              color={getIconColor()}
              style={styles.iconRight}
            />
          )}
        </>
      )}
    </View>
  );

  return (
    <TouchableOpacity
      style={[getButtonStyle(), style]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      {...props}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.md,
  },
  contentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullWidth: {
    width: '100%',
  },
  // Sizes
  small: {
    height: Layout.buttonHeightSmall,
    paddingHorizontal: Spacing.lg,
  },
  medium: {
    height: 36,
    paddingHorizontal: Spacing.xl,
  },
  large: {
    height: Layout.buttonHeight,
    paddingHorizontal: Spacing.xxl,
  },
  // Variants - Threads style (black & white)
  primary: {
    backgroundColor: Colors.black,
  },
  secondary: {
    backgroundColor: Colors.gray100,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    backgroundColor: Colors.gray200,
  },
  // Text
  text: {
    fontWeight: FontWeight.semiBold,
  },
  smallText: {
    fontSize: FontSize.sm,
  },
  mediumText: {
    fontSize: FontSize.md,
  },
  largeText: {
    fontSize: FontSize.md,
  },
  primaryText: {
    color: Colors.white,
  },
  secondaryText: {
    color: Colors.black,
  },
  outlineText: {
    color: Colors.black,
  },
  disabledText: {
    color: Colors.gray400,
  },
  iconLeft: {
    marginRight: Spacing.sm,
  },
  iconRight: {
    marginLeft: Spacing.sm,
  },
});

export default Button;
