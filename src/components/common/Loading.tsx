import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal, ViewStyle } from 'react-native';
import { FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { useTheme } from '../../hooks/useThemeColors';

interface LoadingProps {
  visible?: boolean;
  text?: string;
  overlay?: boolean;
  size?: 'small' | 'large';
  color?: string;
  style?: ViewStyle;
}

export const Loading: React.FC<LoadingProps> = ({
  visible = true,
  text,
  overlay = false,
  size = 'large',
  color,
  style,
}) => {
  const { colors } = useTheme();
  const indicatorColor = color || colors.primary;

  if (!visible) return null;

  const content = (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={indicatorColor} />
      {text && <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>}
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.overlay}>
          <View style={[styles.overlayContent, { backgroundColor: colors.background }]}>
            <ActivityIndicator size={size} color={indicatorColor} />
            {text && <Text style={[styles.overlayText, { color: colors.primary }]}>{text}</Text>}
          </View>
        </View>
      </Modal>
    );
  }

  return content;
};

export const FullScreenLoading: React.FC<{ text?: string }> = ({ text = 'Dang tai...' }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.fullScreen, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      {text && <Text style={[styles.text, { color: colors.textSecondary }]}>{text}</Text>}
    </View>
  );
};

export const InlineLoading: React.FC<{ size?: 'small' | 'large'; color?: string }> = ({
  size = 'small',
  color,
}) => {
  const { colors } = useTheme();
  const indicatorColor = color || colors.primary;

  return (
    <View style={styles.inline}>
      <ActivityIndicator size={size} color={indicatorColor} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  text: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    minWidth: 100,
  },
  overlayText: {
    marginTop: Spacing.md,
    fontSize: FontSize.sm,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inline: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Loading;
