import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal, ViewStyle } from 'react-native';
import { Colors, FontSize, Spacing, BorderRadius } from '../../constants/theme';
import { Strings } from '../../constants/strings';

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
  color = Colors.primary,
  style,
}) => {
  if (!visible) return null;

  const content = (
    <View style={[styles.container, style]}>
      <ActivityIndicator size={size} color={color} />
      {text && <Text style={styles.text}>{text}</Text>}
    </View>
  );

  if (overlay) {
    return (
      <Modal transparent visible={visible} animationType="fade">
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator size={size} color={color} />
            {text && <Text style={styles.overlayText}>{text}</Text>}
          </View>
        </View>
      </Modal>
    );
  }

  return content;
};

export const FullScreenLoading: React.FC<{ text?: string }> = ({ text = Strings.common.loading }) => (
  <View style={styles.fullScreen}>
    <ActivityIndicator size="large" color={Colors.primary} />
    <Text style={styles.text}>{text}</Text>
  </View>
);

export const InlineLoading: React.FC<{ size?: 'small' | 'large'; color?: string }> = ({
  size = 'small',
  color = Colors.primary,
}) => (
  <View style={styles.inline}>
    <ActivityIndicator size={size} color={color} />
  </View>
);

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
  },
  text: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    backgroundColor: Colors.background,
    padding: Spacing.xxl,
    borderRadius: BorderRadius.lg,
    alignItems: 'center',
    minWidth: 120,
  },
  overlayText: {
    marginTop: Spacing.md,
    fontSize: FontSize.md,
    color: Colors.textPrimary,
  },
  fullScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  inline: {
    padding: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default Loading;
